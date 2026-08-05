'use client';

import type { CourseSummary, LessonSummary } from '@kia-academy/shared';
import { BookOpen, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { PageBackButton } from '@/components/layout/PageBackButton';
import { useAuth } from '@/context/AuthProvider';
import { useLanguage } from '@/context/LanguageProvider';
import { api, ApiError } from '@/lib/api';
import { localizeCourse, localizeLesson } from '@/lib/courseLocalization';

export default function CoursePage() {
  const { slug } = useParams<{ slug: string }>();
  const { t, locale } = useLanguage();
  const { isAuthenticated } = useAuth();
  const [course, setCourse] = useState<(CourseSummary & { lessons: LessonSummary[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slug) return;
    api.getCourse(slug).then(setCourse).catch((err) => setError(err instanceof ApiError ? err.message : t('courses.loadError'))).finally(() => setLoading(false));
  }, [slug, t]);

  const localizedCourse = useMemo(() => course && localizeCourse(course, locale), [course, locale]);
  const lessons = useMemo(() => course?.lessons.map((lesson) => localizeLesson(lesson, slug, locale)) ?? [], [course, locale, slug]);

  if (loading) return <div className="page-content auth-loading"><Loader2 size={24} className="spin" /> {t('courses.loading')}</div>;
  if (error || !localizedCourse) return <div className="page-content"><div className="container auth-shell"><PageBackButton href="/courses" /><p className="form-error">{error || t('courses.loadError')}</p></div></div>;

  const checkout = `/checkout?product=COURSE&slugs=${encodeURIComponent(localizedCourse.slug)}`;
  const purchaseHref = isAuthenticated ? checkout : `/login?next=${encodeURIComponent(checkout)}`;

  return (
    <div className="page-content">
      <div className="container catalog-shell">
        <PageBackButton href="/courses" />
        <span className="eyebrow"><BookOpen size={14} className="inline-leading-icon" />{t('publicCourses.introEyebrow')}</span>
        <h1>{localizedCourse.title}</h1>
        <p className="auth-sub">{localizedCourse.description}</p>
        <div className="catalog-card" style={{ maxWidth: 760 }}>
          <div className="catalog-meta"><span>{t('common.lessonsCount', { count: localizedCourse.lessonCount })}</span><span>{t('publicCourses.sessionsLocked')}</span></div>
          <h3>{t('publicCourses.previewTitle')}</h3>
          <div className="lesson-nav">
            {lessons.slice(0, 3).map((lesson) => <span key={lesson.id} className="lesson-nav-item"><span className="lesson-nav-title">{lesson.title}</span><span className="lesson-nav-meta">{t('common.durationMin', { min: lesson.durationMin })}</span></span>)}
          </div>
          <p>{t('publicCourses.introBody')}</p>
          <div className="catalog-actions">
            {localizedCourse.enrolled ? <Link href={`/dashboard/my-courses/${localizedCourse.slug}`} className="btn btn--primary">{t('courses.continue')}</Link> : <Link href={purchaseHref} className="btn btn--primary">{t('publicCourses.buy')}</Link>}
          </div>
        </div>
      </div>
    </div>
  );
}
