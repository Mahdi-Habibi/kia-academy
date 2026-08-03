'use client';

import Link from 'next/link';
import { BookOpen, Loader2, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { PageBackButton } from '@/components/layout/PageBackButton';
import { useAuth } from '@/context/AuthProvider';
import { useLanguage } from '@/context/LanguageProvider';
import { api, ApiError } from '@/lib/api';
import type { CourseSummary } from '@kia-academy/shared';

export function PublicCoursesPage() {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .listCourses()
      .then(setCourses)
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : t('courses.loadError'));
      })
      .finally(() => setLoading(false));
  }, [t]);

  const visibleCourses = useMemo(() => courses, [courses]);

  if (loading) {
    return (
      <div className="page-content auth-loading">
        <Loader2 size={24} className="spin" /> {t('courses.loading')}
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="container catalog-shell">
        <PageBackButton href="/" />
        <span className="eyebrow">
          <BookOpen size={14} className="inline-leading-icon" />
          {t('publicCourses.eyebrow')}
        </span>
        <h1>{t('publicCourses.title')}</h1>
        <p className="auth-sub">{t('publicCourses.sub')}</p>

        {error && <p className="form-error">{error}</p>}

        <div className="catalog-grid">
          {visibleCourses.map((course) => (
            <article key={course.id} className="catalog-card">
              <span className="catalog-icon">{course.icon || '📘'}</span>
              <h3>{course.title}</h3>
              <p>{course.description}</p>
              <div className="catalog-meta">
                <span>{t('common.lessonsCount', { count: course.lessonCount })}</span>
                <span className="catalog-progress">
                  {course.enrolled ? t('common.percentComplete', { pct: course.progressPct }) : t('publicCourses.available')}
                </span>
              </div>
              <div className="catalog-actions">
                <Link href={`/courses/${course.slug}`} className="btn-outline-full">
                  {t('publicCourses.viewIntro')}
                </Link>
                {!isAuthenticated && (
                  <Link href={`/courses/${course.slug}?buy=1`} className="btn-next">
                    {t('publicCourses.buy')}
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>

        {visibleCourses.length === 0 && (
          <div className="glass-panel" style={{ padding: '1rem', marginTop: '1rem' }}>
            <p className="auth-sub">{t('courses.empty')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
