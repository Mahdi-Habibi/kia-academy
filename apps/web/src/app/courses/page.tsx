'use client';

import type { CourseSummary } from '@pathwise/shared';
import { BookOpen, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PageBackButton } from '@/components/layout/PageBackButton';
import { useLanguage } from '@/context/LanguageProvider';
import { api, ApiError } from '@/lib/api';

function EmptyCoursesMessage() {
  const { t } = useLanguage();
  const text = t('courses.empty');
  const linkWord = t('courses.emptyAssessmentLink');
  const idx = text.toLowerCase().indexOf(linkWord.toLowerCase());

  if (idx === -1) {
    return (
      <p className="auth-sub">
        {text} <Link href="/assessment">{linkWord}</Link>
      </p>
    );
  }

  return (
    <p className="auth-sub">
      {text.slice(0, idx)}
      <Link href="/assessment">{text.slice(idx, idx + linkWord.length)}</Link>
      {text.slice(idx + linkWord.length)}
    </p>
  );
}

export default function CoursesPage() {
  const router = useRouter();
  const { t } = useLanguage();
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

  const handleEnroll = async (slug: string) => {
    try {
      await api.enrollCourse(slug);
      const updated = await api.listCourses();
      setCourses(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('courses.enrollError'));
    }
  };

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
        <PageBackButton href="/dashboard" />
        <span className="eyebrow">
          <BookOpen size={14} className="inline-leading-icon" />
          {t('courses.eyebrow')}
        </span>
        <h1>{t('courses.title')}</h1>
        <p className="auth-sub">{t('courses.sub')}</p>

        {error && <p className="form-error">{error}</p>}

        <div className="catalog-grid">
          {courses.map((course) => (
            <article key={course.id} className="catalog-card">
              <span className="catalog-icon">{course.icon || '📘'}</span>
              <h3>{course.title}</h3>
              <p>{course.description}</p>
              <div className="catalog-meta">
                <span>{t('common.lessonsCount', { count: course.lessonCount })}</span>
                {course.enrolled && (
                  <span className="catalog-progress">
                    {t('common.percentComplete', { pct: course.progressPct })}
                  </span>
                )}
              </div>
              <div className="catalog-actions">
                {course.enrolled ? (
                  <button
                    type="button"
                    className="btn-next"
                    onClick={() =>
                      router.push(
                        course.slug === 'interview-branding'
                          ? `/learn/${course.slug}/portfolio-story`
                          : `/learn/${course.slug}/variables-and-types`,
                      )
                    }
                  >
                    {t('courses.continue')}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn-outline-full"
                    onClick={() => handleEnroll(course.slug)}
                  >
                    {t('courses.enroll')}
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>

        {courses.length === 0 && <EmptyCoursesMessage />}
      </div>
    </div>
  );
}
