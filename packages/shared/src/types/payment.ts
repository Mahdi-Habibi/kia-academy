export type ProductType = 'READINESS_TEST' | 'ROADMAP_BUNDLE' | 'COURSE';
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

export interface CheckoutDto {
  productType: ProductType;
  productRef?: string;
  /** When purchasing multiple courses independently from the roadmap bundle. */
  courseSlugs?: string[];
}

export interface PaymentResponse {
  id: string;
  productType: ProductType;
  /** Amount in IRR (Iranian Rials). Field name kept for API compatibility. */
  amountCents: number;
  currency: string;
  status: PaymentStatus;
  checkoutUrl?: string;
  productRef?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

/** Catalog prices in Iranian Rials (IRR). */
export const PRODUCT_PRICES: Record<ProductType, number> = {
  READINESS_TEST: 790_000,
  ROADMAP_BUNDLE: 0,
  COURSE: 1_490_000,
};

export const DEFAULT_CURRENCY = 'irr';

/** Stripe Checkout does not support IRR; use dev confirm flow for IRR catalog. */
export const STRIPE_SUPPORTED_CURRENCIES = new Set(['usd', 'eur', 'gbp']);
