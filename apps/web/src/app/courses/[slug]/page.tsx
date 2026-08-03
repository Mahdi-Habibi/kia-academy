'use client';

import Link from 'next/link';
import { ArrowLeft, BookOpen, CreditCard, Loader2, Sparkles } from 'lucide-react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { PageBackButton } from '@/components/layout/PageBackButton';
import { useAuth } from '@/context/AuthProvider';
import { useLanguage } from '@/context/LanguageProvider';
import { api, ApiError } from '@/lib/api';
import type { CourseSummary, LessonSummary } from '@kia-academy/shared';

function CourseIntroContent() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const slug = params.slug;
  const buyNow = searchParams.get('buy') === '1';

  const [course, setCourse] = useState<(CourseSummary & { lessons?: LessonSummary[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slug) return;
    api
      .getCourse(slug)
      .then((data) => setCourse(data))
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : t('courses.loadError'));
      })
      .finally(() => setLoading(false));
  }, [slug, t]);

  useEffect(() => {
    if (!buyNow || !course || !slug) return;
    const nextPath = `/checkout?product=COURSE&slugs=${encodeURIComponent(slug)}`;
    if (!isAuthenticated) {
      router.replace(`/login?next=${encodeURIComponent(nextPath)}`);
      return;
    }
    router.replace(nextPath);
  }, [buyNow, course, isAuthenticated, router, slug]);

  const lessonCount = course?.lessonCount ?? 0;
  const previewLessons = useMemo(() => (course?.lessons ?? []).slice(0, 3), [course?.lessons]);

  if (loading) {
    return (
      <div className="page-content auth-loading">
        <Loader2 size={24} className="spin" /> {t('courses.loading')}
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="page-content">
        <div className="container auth-shell">
          <PageBackButton href="/courses" />
          <div className="auth-card">
            <p className="form-error">{error || t('courses.loadError')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="container catalog-shell">
        <PageBackButton href="/courses" />
        <span className="eyebrow">
          <BookOpen size={14} className="inline-leading-icon" />
          {t('publicCourses.introEyebrow')}
        </span>
        <h1>{course.title}</h1>
        <p className="auth-sub">{course.description}</p>

        <div className="glass-panel" style={{ padding: '1rem', marginTop: '1rem' }}>
          <div className="catalog-meta" style={{ marginBottom: '0.75rem' }}>
            <span>{t('common.lessonsCount', { count: lessonCount })}</span>
            <span>{t('publicCourses.sessionsLocked')}</span>
          </div>
          <p className="auth-sub">{t('publicCourses.introBody')}</p>

          <div style={{ marginTop: '1rem' }}>
            <h3 style={{ marginBottom: '0.5rem' }}>{t('publicCourses.previewTitle')}</h3>
            <ul className="checkout-features">
              {previewLessons.map((lesson) => (
                <li key={lesson.id}>
                  <Sparkles size={14} /> {lesson.title}
                </li>
              ))}
            </ul>
          </div>

          <div className="catalog-actions" style={{ marginTop: '1.25rem' }}>
            {isAuthenticated ? (
              <Link href={`/checkout?product=COURSE&slugs=${encodeURIComponent(course.slug)}`} className="btn-next">
                <CreditCard size={16} className="inline-leading-icon" />
                {t('publicCourses.buy')}
              </Link>
            ) : (
              <Link href={`/login?next=${encodeURIComponent(`/checkout?product=COURSE&slugs=${encodeURIComponent(course.slug)}`)}`} className="btn-next">
                <CreditCard size={16} className="inline-leading-icon" />
                {t('publicCourses.buy')}
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CourseIntroPage() {
  const { t } = useLanguage();

  return (
    <Suspense fallback={<div className="page-content auth-loading">{t('common.loading')}</div>}>
      <CourseIntroContent />
    </Suspense>
  );
}
