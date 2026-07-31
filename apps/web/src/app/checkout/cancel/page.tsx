'use client';

import Link from 'next/link';
import { XCircle } from 'lucide-react';
import { useLanguage } from '@/context/LanguageProvider';

export default function CheckoutCancelPage() {
  const { t } = useLanguage();

  return (
    <div className="page-content">
      <div className="container checkout-result">
        <XCircle size={48} className="checkout-result-icon cancel" />
        <h1>{t('checkout.cancel.title')}</h1>
        <p className="auth-sub">{t('checkout.cancel.sub')}</p>
        <div className="checkout-result-actions">
          <Link href="/checkout" className="cta-primary">
            {t('checkout.cancel.back')}
          </Link>
          <Link href="/dashboard" className="cta-secondary">
            {t('checkout.success.dashboard')}
          </Link>
        </div>
      </div>
    </div>
  );
}
