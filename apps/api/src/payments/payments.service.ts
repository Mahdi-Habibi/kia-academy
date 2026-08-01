import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DEFAULT_CURRENCY,
  normalizePaymentSettings,
  STRIPE_SUPPORTED_CURRENCIES,
  type CheckoutDto,
  type PaymentResponse,
  type RoadmapResponse,
  type SitePaymentSettings,
} from '@kia-academy/shared';
import { SiteSettingsService } from '../site-settings/site-settings.service';
import type Stripe from 'stripe';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma/prisma.service';
import { StripeService } from '../stripe/stripe.service';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeService: StripeService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
    private readonly siteSettings: SiteSettingsService,
  ) {}

  async createCheckout(userId: string, dto: CheckoutDto): Promise<PaymentResponse> {
    const amountCents = await this.resolveAmountCents(userId, dto);
    const productName = await this.resolveProductName(dto);
    const productRef = this.resolveProductRef(dto);
    const paymentCfg = await this.resolvePaymentConfig();
    const appUrl = this.configService.get<string>('APP_URL', 'http://localhost:3000');

    const payment = await this.prisma.payment.create({
      data: {
        userId,
        productType: dto.productType,
        productRef,
        amountCents,
        currency: DEFAULT_CURRENCY,
        status: 'PENDING',
      },
    });

    let checkoutUrl: string | undefined;

    if (paymentCfg.provider === 'stripe') {
      if (this.stripeService.isConfigured() && STRIPE_SUPPORTED_CURRENCIES.has(DEFAULT_CURRENCY)) {
        const user = await this.prisma.user.findUniqueOrThrow({
          where: { id: userId },
        });
        const session = await this.stripeService.createSession(
          payment.id,
          amountCents,
          productName,
          user.email ?? 'noreply@kia.academy',
          `${appUrl}/checkout/success?payment_id=${payment.id}`,
          `${appUrl}/checkout/cancel?payment_id=${payment.id}`,
        );
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: { stripeId: session.id },
        });
        checkoutUrl = session.url ?? undefined;
      } else if (this.stripeService.isConfigured()) {
        // Stripe does not support IRR — fall back to in-app gateway simulator.
        checkoutUrl = `${appUrl}/checkout/gateway?payment_id=${payment.id}&provider=stripe`;
      } else {
        checkoutUrl = `${appUrl}/checkout/gateway?payment_id=${payment.id}&provider=stripe`;
      }
    } else if (paymentCfg.provider === 'zarinpal' || paymentCfg.provider === 'idpay') {
      // Redirect to third-party payment step (sandbox simulator when keys are for testing).
      const params = new URLSearchParams({
        payment_id: payment.id,
        provider: paymentCfg.provider,
      });
      if (paymentCfg.merchantId) params.set('merchant', paymentCfg.merchantId);
      if (paymentCfg.sandbox) params.set('sandbox', '1');
      checkoutUrl = `${appUrl}/checkout/gateway?${params.toString()}`;
    }
    // provider === 'dev' → no checkoutUrl; client confirms in-app after review.

    return this.toResponse(payment, checkoutUrl);
  }

  async confirmPayment(userId: string, paymentId: string): Promise<PaymentResponse> {
    const paymentCfg = await this.resolvePaymentConfig();
    // Live Stripe webhooks own confirmation; allow confirm for all other providers / sandbox.
    if (paymentCfg.provider === 'stripe' && this.stripeService.isConfigured()) {
      const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
      if (payment?.stripeId && !paymentCfg.sandbox) {
        throw new BadRequestException(
          'Payment confirmation via API is only available in development without Stripe',
        );
      }
    }

    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { user: true },
    });

    if (!payment || payment.userId !== userId) {
      throw new NotFoundException(`Payment ${paymentId} not found`);
    }

    if (payment.status === 'COMPLETED') {
      return this.toResponse(payment);
    }

    const completed = await this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'COMPLETED' },
    });

    await this.grantEntitlements(completed);
    await this.emailService.sendPaymentReceipt(
      {
        id: payment.user.id,
        name: payment.user.name,
        email: payment.user.email ?? 'noreply@kia.academy',
      },
      completed,
    );

    return this.toResponse(completed);
  }

  async getPaymentForUser(userId: string, paymentId: string): Promise<PaymentResponse> {
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment || payment.userId !== userId) {
      throw new NotFoundException(`Payment ${paymentId} not found`);
    }
    return this.toResponse(payment);
  }

  async handleStripeWebhook(
    rawBody: Buffer,
    signature: string | string[] | undefined,
  ): Promise<{ received: true }> {
    if (!signature || Array.isArray(signature)) {
      throw new BadRequestException('Missing Stripe signature');
    }

    const event = this.stripeService.constructWebhookEvent(rawBody, signature);

    if (event.type === 'checkout.session.completed') {
      await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
    }

    return { received: true };
  }

  async getMyPayments(userId: string): Promise<PaymentResponse[]> {
    const payments = await this.prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return payments.map((payment) => this.toResponse(payment));
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
    const paymentId = session.metadata?.paymentId;
    if (!paymentId) {
      return;
    }

    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { user: true },
    });

    if (!payment || payment.status === 'COMPLETED') {
      return;
    }

    const completed = await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'COMPLETED',
        stripeId: session.id,
      },
    });

    await this.grantEntitlements(completed);
    await this.emailService.sendPaymentReceipt(
      {
        id: payment.user.id,
        name: payment.user.name,
        email: payment.user.email ?? 'noreply@kia.academy',
      },
      completed,
    );
  }

  private async resolvePaymentConfig(): Promise<SitePaymentSettings> {
    const settings = await this.siteSettings.get();
    return normalizePaymentSettings(settings.payment);
  }

  private resolveProductRef(dto: CheckoutDto): string | null {
    if (dto.courseSlugs?.length) {
      return JSON.stringify([...new Set(dto.courseSlugs.map((s) => s.trim()).filter(Boolean))]);
    }
    return dto.productRef ?? null;
  }

  private parseCourseRefs(productRef: string | null): string[] {
    if (!productRef) return [];
    try {
      const parsed = JSON.parse(productRef) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === 'string' && item.length > 0);
      }
    } catch {
      /* fall through to single slug */
    }
    return [productRef];
  }

  private async resolveAmountCents(userId: string, dto: CheckoutDto): Promise<number> {
    const settings = await this.siteSettings.get();

    if (dto.productType === 'READINESS_TEST') {
      throw new BadRequestException('Readiness test is free and no longer sold separately');
    }

    if (dto.productType === 'COURSE') {
      const slugs = dto.courseSlugs?.length
        ? dto.courseSlugs
        : dto.productRef
          ? [dto.productRef]
          : [];
      if (!slugs.length) {
        throw new BadRequestException('productRef or courseSlugs is required for COURSE checkout');
      }
      return settings.pricing.courseCents * slugs.length;
    }

    if (dto.productType === 'ROADMAP_BUNDLE') {
      if (!dto.productRef) {
        throw new BadRequestException(
          'productRef (roadmap id) is required for ROADMAP_BUNDLE checkout',
        );
      }

      const roadmap = await this.prisma.roadmap.findUnique({
        where: { id: dto.productRef },
      });
      if (!roadmap) {
        throw new NotFoundException(`Roadmap ${dto.productRef} not found`);
      }
      if (roadmap.userId !== userId) {
        throw new NotFoundException(`Roadmap ${dto.productRef} not found`);
      }

      const pricing = JSON.parse(roadmap.pricing) as RoadmapResponse['pricing'];
      return pricing.discounted;
    }

    throw new BadRequestException(`Unsupported product type: ${dto.productType}`);
  }

  private async resolveProductName(dto: CheckoutDto): Promise<string> {
    switch (dto.productType) {
      case 'READINESS_TEST':
        return 'Readiness Assessment';
      case 'ROADMAP_BUNDLE':
        return 'Roadmap Bundle';
      case 'COURSE': {
        const slugs = dto.courseSlugs?.length
          ? dto.courseSlugs
          : dto.productRef
            ? this.parseCourseRefs(dto.productRef)
            : [];
        if (!slugs.length) {
          return 'Course selection';
        }
        if (slugs.length === 1) {
          const course = await this.prisma.course.findFirst({
            where: {
              OR: [{ id: slugs[0] }, { slug: slugs[0] }],
            },
          });
          return course?.title ?? 'Course';
        }
        return `${slugs.length} courses`;
      }
      default:
        return dto.productType;
    }
  }

  private async grantEntitlements(payment: {
    id: string;
    userId: string;
    productType: 'READINESS_TEST' | 'ROADMAP_BUNDLE' | 'COURSE';
    productRef: string | null;
  }): Promise<void> {
    switch (payment.productType) {
      case 'READINESS_TEST':
        await this.prisma.entitlement.upsert({
          where: {
            userId_resourceType_resourceId: {
              userId: payment.userId,
              resourceType: 'readiness',
              resourceId: 'test',
            },
          },
          create: {
            userId: payment.userId,
            resourceType: 'readiness',
            resourceId: 'test',
            source: 'PURCHASE',
          },
          update: { source: 'PURCHASE' },
        });
        break;

      case 'ROADMAP_BUNDLE':
        if (!payment.productRef) {
          throw new BadRequestException('Roadmap reference missing on payment');
        }

        await this.prisma.entitlement.upsert({
          where: {
            userId_resourceType_resourceId: {
              userId: payment.userId,
              resourceType: 'roadmap',
              resourceId: payment.productRef,
            },
          },
          create: {
            userId: payment.userId,
            resourceType: 'roadmap',
            resourceId: payment.productRef,
            source: 'BUNDLE',
          },
          update: { source: 'BUNDLE' },
        });

        await this.prisma.roadmap.update({
          where: { id: payment.productRef },
          data: { enrolled: true, paymentId: payment.id },
        });
        break;

      case 'COURSE':
        for (const slug of this.parseCourseRefs(payment.productRef)) {
          const course = await this.prisma.course.findFirst({
            where: { OR: [{ slug }, { id: slug }] },
          });
          const courseSlug = course?.slug ?? slug;
          await this.prisma.entitlement.upsert({
            where: {
              userId_resourceType_resourceId: {
                userId: payment.userId,
                resourceType: 'course',
                resourceId: courseSlug,
              },
            },
            create: {
              userId: payment.userId,
              resourceType: 'course',
              resourceId: courseSlug,
              source: 'PURCHASE',
            },
            update: { source: 'PURCHASE' },
          });
          if (course) {
            await this.prisma.enrollment.upsert({
              where: { userId_courseId: { userId: payment.userId, courseId: course.id } },
              create: { userId: payment.userId, courseId: course.id },
              update: {},
            });
          }
        }
        break;
    }
  }

  private toResponse(
    payment: {
      id: string;
      productType: 'READINESS_TEST' | 'ROADMAP_BUNDLE' | 'COURSE';
      amountCents: number;
      currency: string;
      status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
    },
    checkoutUrl?: string,
  ): PaymentResponse {
    return {
      id: payment.id,
      productType: payment.productType,
      amountCents: payment.amountCents,
      currency: payment.currency,
      status: payment.status,
      checkoutUrl,
    };
  }
}
