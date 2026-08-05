'use client';

import type { CourseSummary, LessonSummary } from '@kia-academy/shared';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { PageBackButton } from '@/components/layout/PageBackButton';
import { useAuth } from '@/context/AuthProvider';
import { useLanguage } from '@/context/LanguageProvider';
import { api, ApiError } from '@/lib/api';
import { localizeCourse, localizeLesson } from '@/lib/courseLocalization';

export default function MyCourseDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { t, locale } = useLanguage();
  const [course, setCourse] = useState<(CourseSummary & { lessons: LessonSummary[] }) | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading || !slug) return;
    if (!isAuthenticated) { router.replace(`/login?next=${encodeURIComponent(`/dashboard/my-courses/${slug}`)}`); return; }
    api.getCourse(slug).then((data) => {
      if (!data.enrolled) { router.replace(`/courses/${slug}`); return; }
      setCourse(data);
    }).catch((err) => setError(err instanceof ApiError ? err.message : t('courses.loadError')));
  }, [authLoading, isAuthenticated, router, slug, t]);

  const localizedCourse = useMemo(() => course && localizeCourse(course, locale), [course, locale]);
  const lessons = useMemo(() => course?.lessons.map((lesson) => localizeLesson(lesson, slug, locale)) ?? [], [course, locale, slug]);
  if (authLoading || !localizedCourse && !error) return <div className="page-content auth-loading"><Loader2 size={24} className="spin" /> {t('courses.loading')}</div>;
  if (error) return <div className="page-content"><div className="container auth-shell"><p className="form-error">{error}</p></div></div>;
  if (!localizedCourse) return null;

  return <div className="page-content"><div className="container catalog-shell">
    <PageBackButton href="/dashboard/my-courses" /><h1>{localizedCourse.title}</h1><p className="auth-sub">{localizedCourse.description}</p>
    <div className="lesson-nav">{lessons.map((lesson) => <Link key={lesson.id} href={`/learn/${localizedCourse.slug}/${lesson.slug}`} className="lesson-nav-item"><span className="lesson-nav-title">{lesson.title}</span><span className="lesson-nav-meta">{t('common.durationMin', { min: lesson.durationMin })}</span></Link>)}</div>
  </div></div>;
}
