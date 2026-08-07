import { BadRequestException } from '@nestjs/common';
import { PaymentsService } from './payments.service';

describe('PaymentsService', () => {
  const prisma = {
    payment: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    order: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    invoice: {
      create: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
    },
    roadmap: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    entitlement: {
      upsert: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
    },
    enrollment: {
      upsert: jest.fn(),
    },
    user: {
      findUniqueOrThrow: jest.fn(),
    },
    course: {
      findFirst: jest.fn(),
    },
  };

  const stripeService = {
    isConfigured: jest.fn().mockReturnValue(false),
    createSession: jest.fn(),
    constructWebhookEvent: jest.fn(),
  };

  const emailService = {
    sendPaymentReceipt: jest.fn(),
  };

  const configService = {
    get: jest.fn().mockReturnValue('http://localhost:3000'),
  };

  const siteSettings = {
    get: jest.fn().mockResolvedValue({
      general: { siteName: 'Kia Academy' },
      tracks: [],
      pricing: {
        readinessTestCents: 1900,
        courseCents: 4900,
        modulePrices: [49, 69, 79, 89, 59],
        bundleDiscountPercent: 20,
      },
      payment: {
        enabled: true,
        provider: 'dev',
        currency: 'irr',
        merchantId: '',
        apiKey: '',
        sandbox: true,
        displayName: '',
        description: '',
        callbackUrl: '',
        successUrl: '',
        failureUrl: '',
      },
    }),
  };

  const providers = {
    resolve: jest.fn().mockReturnValue({
      id: 'dev',
      createPayment: jest.fn().mockResolvedValue({
        redirectUrl: null,
        gatewayRef: null,
        immediateConfirm: true,
      }),
      verifyPayment: jest.fn().mockResolvedValue({ success: true }),
    }),
    resolveById: jest.fn(),
  };

  const cartService = {
    getCart: jest.fn(),
    clearCart: jest.fn(),
  };

  const service = new PaymentsService(
    prisma as never,
    stripeService as never,
    emailService as never,
    configService as never,
    siteSettings as never,
    providers as never,
    cartService as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.entitlement.findMany.mockResolvedValue([]);
    providers.resolve.mockReturnValue({
      id: 'dev',
      createPayment: jest.fn().mockResolvedValue({
        redirectUrl: null,
        gatewayRef: null,
        immediateConfirm: true,
      }),
      verifyPayment: jest.fn().mockResolvedValue({ success: true }),
    });
  });

  it('requires productRef for ROADMAP_BUNDLE checkout', async () => {
    await expect(
      service.createCheckout('user-1', { productType: 'ROADMAP_BUNDLE' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('creates a pending payment using roadmap pricing', async () => {
    prisma.roadmap.findUnique.mockResolvedValue({
      id: 'rm-1',
      userId: 'user-1',
      trackName: 'Web',
      enrolled: false,
      pricing: JSON.stringify({ original: 2490000, discounted: 1490000 }),
    });
    prisma.order.create.mockResolvedValue({
      id: 'ord-1',
      totalCents: 1490000,
      currency: 'irr',
    });
    prisma.payment.create.mockResolvedValue({
      id: 'pay-1',
      productType: 'ROADMAP_BUNDLE',
      productRef: 'rm-1',
      amountCents: 1490000,
      currency: 'irr',
      status: 'PENDING',
      orderId: 'ord-1',
      provider: 'dev',
    });
    prisma.payment.findUniqueOrThrow.mockResolvedValue({
      id: 'pay-1',
      productType: 'ROADMAP_BUNDLE',
      productRef: 'rm-1',
      amountCents: 1490000,
      currency: 'irr',
      status: 'PENDING',
      orderId: 'ord-1',
      provider: 'dev',
      stripeId: null,
      metadata: null,
    });
    prisma.user.findUniqueOrThrow.mockResolvedValue({
      id: 'user-1',
      email: 'a@b.c',
      phone: null,
    });
    prisma.payment.update.mockResolvedValue({
      id: 'pay-1',
      productType: 'ROADMAP_BUNDLE',
      productRef: 'rm-1',
      amountCents: 1490000,
      currency: 'irr',
      status: 'PENDING',
      orderId: 'ord-1',
      provider: 'dev',
    });

    const result = await service.createCheckout('user-1', {
      productType: 'ROADMAP_BUNDLE',
      productRef: 'rm-1',
    });

    expect(prisma.order.create).toHaveBeenCalled();
    expect(prisma.payment.create).toHaveBeenCalled();
    expect(result.id).toBe('pay-1');
    expect(result.amountCents).toBe(1490000);
    expect(result.status).toBe('PENDING');
  });
});
