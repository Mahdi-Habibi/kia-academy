'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { LogIn } from 'lucide-react';
import { FormEvent, Suspense, useEffect, useState } from 'react';
import { PageBackButton } from '@/components/layout/PageBackButton';
import { useAuth } from '@/context/AuthProvider';
import { useLanguage } from '@/context/LanguageProvider';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, user, loading, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const next = searchParams.get('next') ?? '/dashboard';

  useEffect(() => {
    if (loading) return;
    if (isAuthenticated && user?.profileComplete) {
      const dest =
        user.role === 'SUPER_ADMIN' || user.role === 'ADMIN'
          ? next.startsWith('/admin')
            ? next
            : '/admin'
          : next === '/'
            ? '/dashboard'
            : next;
      router.replace(dest);
    }
  }, [loading, isAuthenticated, user, next, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login({ email, password });
      router.push(next === '/' ? '/dashboard' : next);
    } catch {
      setError(t('auth.login.error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-content">
      <div className="container auth-shell">
        <PageBackButton href="/" />
        <div className="auth-card">
          <span className="eyebrow">
            <LogIn size={14} className="inline-leading-icon" />
            {t('auth.login.eyebrow')}
          </span>
          <h1>{t('auth.login.title')}</h1>
          <p className="auth-sub">{t('auth.login.sub')}</p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="form-field">
              <span>{t('auth.login.email')}</span>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('auth.login.emailPlaceholder')}
                dir="ltr"
                className="ltr-isolate"
              />
            </label>
            <label className="form-field">
              <span>{t('auth.login.password')}</span>
              <input
                type="password"
                autoComplete="current-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('auth.login.passwordPlaceholder')}
              />
            </label>
            {error && <p className="form-error">{error}</p>}
            <button type="submit" className="cta-primary auth-submit" disabled={submitting}>
              {submitting ? t('auth.login.submitting') : t('auth.login.submit')}
            </button>
          </form>

          <p className="auth-footer">
            {t('auth.login.footer')} <Link href="/register">{t('auth.login.createAccount')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const { t } = useLanguage();

  return (
    <Suspense fallback={<div className="page-content auth-loading">{t('common.loading')}</div>}>
      <LoginForm />
    </Suspense>
  );
}
