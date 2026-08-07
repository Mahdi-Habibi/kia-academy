'use client';

import type { PaymentResponse } from '@kia-academy/shared';
import { CreditCard, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { DashboardGate, PanelPage } from '@/components/dashboard/DashboardShell';
import { useLanguage } from '@/context/LanguageProvider';
import { api, ApiError } from '@/lib/api';

function productLabel(
  t: (key: string) => string,
  productType: PaymentResponse['productType'],
) {
  switch (productType) {
    case 'ROADMAP_BUNDLE':
      return t('panel.finance.product.roadmap');
    case 'COURSE':
      return t('panel.finance.product.course');
    case 'READINESS_TEST':
      return t('panel.finance.product.readiness');
    default:
      return productType;
  }
}

export default function FinancePage() {
  const { t, format } = useLanguage();
  const [payments, setPayments] = useState<PaymentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    api
      .myPayments()
      .then((data) => {
        if (!cancelled) setPayments(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : t('panel.finance.loadError'));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [t]);

  return (
    <DashboardGate nextPath="/dashboard/finance">
      <PanelPage
        eyebrow={
          <>
            <CreditCard size={14} className="inline-leading-icon" />
            {t('panel.nav.finance')}
          </>
        }
        title={t('panel.finance.title')}
        sub={t('panel.finance.sub')}
      >
        {loading ? (
          <p className="auth-loading">
            <Loader2 size={18} className="spin" /> {t('common.loading')}
          </p>
        ) : null}
        {error ? <p className="form-error">{error}</p> : null}
        {!loading && !error && payments.length === 0 ? (
          <p className="panel-muted">{t('panel.finance.empty')}</p>
        ) : null}
        <div className="panel-list">
          {payments.map((payment) => (
            <div key={payment.id} className="panel-row">
              <div className="panel-row__main">
                <b>{productLabel(t, payment.productType)}</b>
                <span className="ltr-isolate mono">
                  {payment.productRef ? `${payment.productRef} · ` : ''}
                  {payment.id.slice(0, 8)}
                </span>
                <span>
                  {payment.createdAt ? format.date(payment.createdAt) : '—'} ·{' '}
                  {t(`panel.finance.status.${payment.status.toLowerCase()}`)}
                </span>
              </div>
              <div className="panel-row__actions">
                <span className="mono ltr-isolate">
                  {format.currency(payment.amountCents)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </PanelPage>
    </DashboardGate>
  );
}
