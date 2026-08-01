import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PaymentsService } from './payments.service';

describe('PaymentsService', () => {
  const prisma = {
    payment: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    roadmap: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    entitlement: {
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
      pricing: {
        readinessTestCents: 1900,
        courseCents: 4900,
        modulePrices: [49, 69, 79, 89, 59],
        bundleDiscountPercent: 20,
      },
      payment: {
        provider: 'dev',
        merchantId: '',
        apiKey: '',
        sandbox: true,
      },
    }),
  };

  const service = new PaymentsService(
    prisma as never,
    stripeService as never,
    emailService as never,
    configService as never,
    siteSettings as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
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
      pricing: JSON.stringify({ original: 2490000, discounted: 1490000 }),
    });
    prisma.payment.create.mockResolvedValue({
      id: 'pay-1',
      productType: 'ROADMAP_BUNDLE',
      amountCents: 1490000,
      currency: 'irr',
      status: 'PENDING',
    });

    const result = await service.createCheckout('user-1', {
      productType: 'ROADMAP_BUNDLE',
      productRef: 'rm-1',
    });

    expect(prisma.payment.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        productType: 'ROADMAP_BUNDLE',
        productRef: 'rm-1',
        amountCents: 1490000,
        currency: 'irr',
        status: 'PENDING',
      },
    });
    expect(result.id).toBe('pay-1');
    expect(result.amountCents).toBe(1490000);
  });

  it('grants roadmap entitlement on confirmPayment', async () => {
    prisma.payment.findUnique.mockResolvedValue({
      id: 'pay-1',
      userId: 'user-1',
      productType: 'ROADMAP_BUNDLE',
      productRef: 'rm-1',
      amountCents: 14900,
      currency: 'usd',
      status: 'PENDING',
      user: { id: 'user-1', name: 'Alex', email: 'alex@kia.academy' },
    });
    prisma.payment.update.mockResolvedValue({
      id: 'pay-1',
      userId: 'user-1',
      productType: 'ROADMAP_BUNDLE',
      productRef: 'rm-1',
      amountCents: 14900,
      currency: 'usd',
      status: 'COMPLETED',
    });

    const result = await service.confirmPayment('user-1', 'pay-1');

    expect(prisma.entitlement.upsert).toHaveBeenCalled();
    expect(prisma.roadmap.update).toHaveBeenCalledWith({
      where: { id: 'rm-1' },
      data: { enrolled: true, paymentId: 'pay-1' },
    });
    expect(result.status).toBe('COMPLETED');
  });

  it('rejects confirmPayment for another user', async () => {
    prisma.payment.findUnique.mockResolvedValue({
      id: 'pay-1',
      userId: 'other-user',
      status: 'PENDING',
    });

    await expect(service.confirmPayment('user-1', 'pay-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
