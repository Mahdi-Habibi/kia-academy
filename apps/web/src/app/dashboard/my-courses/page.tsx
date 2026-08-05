'use client';

import type { CourseSummary } from '@kia-academy/shared';
import { BookOpen, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { useLanguage } from '@/context/LanguageProvider';
import { api, ApiError } from '@/lib/api';
import { localizeCourse } from '@/lib/courseLocalization';

export default function MyCoursesPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { t, locale } = useLanguage();
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.replace('/login?next=/dashboard/my-courses');
      return;
    }
    api.listMyCourses().then(setCourses).catch((err) => setError(err instanceof ApiError ? err.message : t('courses.loadError'))).finally(() => setLoading(false));
  }, [authLoading, isAuthenticated, router, t]);

  const localizedCourses = useMemo(() => courses.map((course) => localizeCourse(course, locale)), [courses, locale]);
  if (authLoading || loading) return <div className="page-content auth-loading"><Loader2 size={24} className="spin" /> {t('courses.loading')}</div>;

  return (
    <div className="page-content"><div className="container catalog-shell">
      <span className="eyebrow"><BookOpen size={14} className="inline-leading-icon" />{t('nav.myCourses')}</span>
      <h1>{t('courses.title')}</h1><p className="auth-sub">{t('courses.sub')}</p>
      {error ? <p className="form-error">{error}</p> : null}
      <div className="catalog-grid">
        {localizedCourses.map((course) => <article key={course.id} className="catalog-card">
          <span className="catalog-icon">{course.icon}</span><h3>{course.title}</h3><p>{course.description}</p>
          <div className="catalog-meta"><span>{t('common.percentComplete', { pct: course.progressPct })}</span><span>{t('common.lessonsCount', { count: course.lessonCount })}</span></div>
          <div className="catalog-actions"><Link className="btn btn--primary" href={`/dashboard/my-courses/${course.slug}`}>{t('courses.continue')}</Link></div>
        </article>)}
      </div>
      {!error && localizedCourses.length === 0 ? <p className="auth-sub">{t('courses.empty')}</p> : null}
    </div></div>
  );
}
