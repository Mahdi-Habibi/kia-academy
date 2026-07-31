'use client';

import Link from 'next/link';
import { CheckCircle, Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/context/AuthProvider';
import { useLanguage } from '@/context/LanguageProvider';

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const { refreshSession } = useAuth();
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [error, setError] = useState('');

  const paymentId = searchParams.get('payment_id');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // Stripe: webhook completes payment; dev mode may use confirmPayment with payment id.
        if (paymentId && !process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
          try {
            await api.confirmPayment(paymentId);
          } catch {
            /* may already be confirmed */
          }
        }
        await refreshSession();
        if (!cancelled) setStatus('ok');
      } catch (err) {
        if (!cancelled) {
          setStatus('error');
          setError(err instanceof ApiError ? err.message : t('checkout.success.verifyError'));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [paymentId, refreshSession, t]);

  if (status === 'loading') {
    return (
      <div className="page-content auth-loading">
        <Loader2 size={24} className="spin" /> {t('checkout.confirming')}
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="container checkout-result">
        {status === 'ok' ? (
          <>
            <CheckCircle size={48} className="checkout-result-icon ok" />
            <h1>{t('checkout.success.title')}</h1>
            <p className="auth-sub">{t('checkout.success.sub')}</p>
            <div className="checkout-result-actions">
              <button
                type="button"
                className="cta-primary"
                onClick={() => router.push('/readiness')}
              >
                {t('checkout.success.goReadiness')}
              </button>
              <Link href="/dashboard" className="cta-secondary">
                {t('checkout.success.dashboard')}
              </Link>
            </div>
          </>
        ) : (
          <>
            <h1>{t('checkout.success.verifyIssue')}</h1>
            <p className="form-error">{error}</p>
            <Link href="/checkout" className="cta-primary">
              {t('checkout.success.return')}
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

function SuccessFallback() {
  const { t } = useLanguage();
  return <div className="page-content auth-loading">{t('common.loading')}</div>;
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<SuccessFallback />}>
      <SuccessContent />
    </Suspense>
  );
}
