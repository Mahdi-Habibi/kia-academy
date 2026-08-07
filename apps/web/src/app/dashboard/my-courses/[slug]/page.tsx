'use client';

import type { CourseAttachmentDto, CourseSummary, LessonSummary } from '@kia-academy/shared';
import { Loader2, Paperclip, Ticket } from 'lucide-react';
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
  const [course, setCourse] = useState<(CourseSummary & { lessons: LessonSummary[] }) | null>(
    null,
  );
  const [attachments, setAttachments] = useState<CourseAttachmentDto[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading || !slug) return;
    if (!isAuthenticated) {
      router.replace(`/education?next=${encodeURIComponent(`/dashboard/my-courses/${slug}`)}`);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await api.getCourse(slug);
        if (!data.enrolled) {
          router.replace(`/courses/${slug}`);
          return;
        }
        if (cancelled) return;
        setCourse(data);
        const files = await api.listCourseAttachments(slug).catch(() => []);
        if (!cancelled) setAttachments(files);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : t('courses.loadError'));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authLoading, isAuthenticated, router, slug, t]);

  const localizedCourse = useMemo(
    () => course && localizeCourse(course, locale),
    [course, locale],
  );
  const lessons = useMemo(
    () => course?.lessons.map((lesson) => localizeLesson(lesson, slug, locale)) ?? [],
    [course, locale, slug],
  );

  if (authLoading || (!localizedCourse && !error)) {
    return (
      <div className="page-content auth-loading">
        <Loader2 size={24} className="spin" /> {t('courses.loading')}
      </div>
    );
  }
  if (error) {
    return (
      <div className="page-content">
        <div className="container auth-shell">
          <p className="form-error">{error}</p>
        </div>
      </div>
    );
  }
  if (!localizedCourse) return null;

  return (
    <div className="page-content">
      <div className="container catalog-shell">
        <PageBackButton href="/dashboard/my-courses" />
        <h1>{localizedCourse.title}</h1>
        <p className="auth-sub">{localizedCourse.description}</p>
        <div className="catalog-actions" style={{ marginBottom: '1.25rem' }}>
          <Link
            className="btn btn--secondary"
            href={`/dashboard/tickets/new?course=${encodeURIComponent(localizedCourse.slug)}`}
          >
            <Ticket size={14} aria-hidden="true" />
            {t('panel.courses.createTicket')}
          </Link>
        </div>
        <section className="panel-section">
          <h2>
            <Paperclip size={16} className="inline-leading-icon" />
            {t('panel.courses.attachments')}
          </h2>
          {attachments.length === 0 ? (
            <p className="panel-muted">{t('panel.courses.noAttachments')}</p>
          ) : (
            <div className="panel-list">
              {attachments.map((file) => (
                <div key={file.id} className="panel-row">
                  <div className="panel-row__main">
                    <b>{file.title}</b>
                    <span>{file.fileName}</span>
                  </div>
                  <a
                    className="btn btn--secondary"
                    href={file.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t('panel.courses.download')}
                  </a>
                </div>
              ))}
            </div>
          )}
        </section>
        <div className="lesson-nav">
          {lessons.map((lesson) => (
            <Link
              key={lesson.id}
              href={`/learn/${localizedCourse.slug}/${lesson.slug}`}
              className="lesson-nav-item"
            >
              <span className="lesson-nav-title">{lesson.title}</span>
              <span className="lesson-nav-meta">
                {t('common.durationMin', { min: lesson.durationMin })}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
