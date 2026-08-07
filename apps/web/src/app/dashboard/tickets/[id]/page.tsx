'use client';

import type { SupportTicketDetail } from '@kia-academy/shared';
import { Loader2, Ticket } from 'lucide-react';
import { useParams } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { PageBackButton } from '@/components/layout/PageBackButton';
import { DashboardGate, PanelPage } from '@/components/dashboard/DashboardShell';
import { useLanguage } from '@/context/LanguageProvider';
import { api, ApiError } from '@/lib/api';

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t, format } = useLanguage();
  const [ticket, setTicket] = useState<SupportTicketDetail | null>(null);
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    api
      .getTicket(id)
      .then((data) => {
        if (!cancelled) setTicket(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : t('panel.tickets.loadError'));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, t]);

  const handleReply = async (e: FormEvent) => {
    e.preventDefault();
    if (!id || !reply.trim() || saving) return;
    setSaving(true);
    setError('');
    try {
      const updated = await api.replyTicket(id, { body: reply.trim() });
      setTicket(updated);
      setReply('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('panel.tickets.saveError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardGate nextPath={`/dashboard/tickets/${id}`}>
      <PanelPage
        eyebrow={
          <>
            <Ticket size={14} className="inline-leading-icon" />
            {t('panel.nav.tickets')}
          </>
        }
        title={ticket?.subject || t('panel.tickets.detailTitle')}
        sub={ticket ? format.date(ticket.createdAt) : undefined}
        actions={<PageBackButton href="/dashboard/tickets" />}
      >
        {loading ? (
          <p className="auth-loading">
            <Loader2 size={18} className="spin" /> {t('common.loading')}
          </p>
        ) : null}
        {error ? <p className="form-error">{error}</p> : null}
        {ticket ? (
          <>
            <div className="ticket-bubble">
              <p>{ticket.body}</p>
              {ticket.courseTitle ? (
                <p className="panel-muted" style={{ marginTop: '0.75rem' }}>
                  {ticket.courseTitle}
                </p>
              ) : null}
            </div>
            <div className="ticket-thread">
              {ticket.replies.map((item) => (
                <div
                  key={item.id}
                  className={`ticket-bubble${item.isStaff ? ' ticket-bubble--staff' : ''}`}
                >
                  <b>{item.authorName}</b>
                  <span className="panel-muted"> · {format.date(item.createdAt)}</span>
                  <p style={{ marginTop: '0.5rem' }}>{item.body}</p>
                </div>
              ))}
            </div>
            <form className="auth-form" style={{ marginTop: '1.5rem' }} onSubmit={handleReply}>
              <label className="field">
                <span>{t('panel.tickets.reply')}</span>
                <textarea
                  className="input"
                  rows={4}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  required
                  minLength={1}
                />
              </label>
              <button type="submit" className="btn btn--primary" disabled={saving || !reply.trim()}>
                {saving ? t('common.saving') : t('panel.tickets.sendReply')}
              </button>
            </form>
          </>
        ) : null}
      </PanelPage>
    </DashboardGate>
  );
}
