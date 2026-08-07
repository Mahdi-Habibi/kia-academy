import type { SitePaymentSettings } from '@kia-academy/shared';
import type {
  PaymentCreateInput,
  PaymentCreateResult,
  PaymentProvider,
  PaymentVerifyInput,
  PaymentVerifyResult,
} from './payment-provider';

/** In-app / development provider — no external redirect; client confirms. */
export class DevPaymentProvider implements PaymentProvider {
  readonly id = 'dev' as const;

  async createPayment(
    _input: PaymentCreateInput,
    _settings: SitePaymentSettings,
  ): Promise<PaymentCreateResult> {
    return {
      redirectUrl: null,
      gatewayRef: null,
      immediateConfirm: true,
    };
  }

  async verifyPayment(
    _input: PaymentVerifyInput,
    _settings: SitePaymentSettings,
  ): Promise<PaymentVerifyResult> {
    return { success: true, gatewayRef: 'dev' };
  }
}
