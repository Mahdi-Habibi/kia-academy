'use client';

import Link from 'next/link';
import { BookOpen, Loader2, Sparkles, GraduationCap, Users, Clock, Award } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { PageBackButton } from '@/components/layout/PageBackButton';
import { useAuth } from '@/context/AuthProvider';
import { useLanguage } from '@/context/LanguageProvider';
import { api, ApiError } from '@/lib/api';
import type { CourseSummary } from '@kia-academy/shared';

export function PublicCoursesPage() {
  const { t, lang } = useLanguage();
  const { isAuthenticated } = useAuth();
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'available' | 'enrolled'>('all');

  useEffect(() => {
    api
      .listCourses()
      .then(setCourses)
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : t('courses.loadError'));
      })
      .finally(() => setLoading(false));
  }, [t]);

  const filteredCourses = useMemo(() => {
    switch (filter) {
      case 'available':
        return courses.filter((c) => !c.enrolled);
      case 'enrolled':
        return courses.filter((c) => c.enrolled);
      default:
        return courses;
    }
  }, [courses, filter]);

  if (loading) {
    return (
      <div className="page-content auth-loading">
        <Loader2 size={24} className="spin" /> {t('courses.loading')}
      </div>
    );
  }

  const isPersian = lang === 'fa';

  return (
    <div className="page-content" dir={isPersian ? 'rtl' : 'ltr'}>
      <div className="container catalog-shell">
        <PageBackButton href="/" />

        {/* Hero Section */}
        <div style={{ marginBottom: '3rem' }}>
          <span className="eyebrow">
            <BookOpen size={14} className="inline-leading-icon" />
            {t('publicCourses.eyebrow')}
          </span>
          <h1 style={{ marginBottom: '0.5rem' }}>{t('publicCourses.title')}</h1>
          <p className="auth-sub" style={{ marginBottom: '1.5rem', fontSize: '1.05rem' }}>
            {t('publicCourses.sub')}
          </p>

          {/* Persian-specific context message */}
          {isPersian && (
            <div
              style={{
                padding: '1rem',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                borderRight: isPersian ? '4px solid rgb(99, 102, 241)' : 'none',
                borderLeft: isPersian ? 'none' : '4px solid rgb(99, 102, 241)',
                borderRadius: '0.5rem',
                marginBottom: '1.5rem',
              }}
            >
              <p style={{ margin: '0', fontSize: '0.95rem', lineHeight: '1.6' }}>
                <strong>💡 نکته:</strong> دوره‌های آکادمی کیا برای یادگیرندگان فارسی‌زبان از ایران طراحی‌شده‌اند. تمام محتوا
                ویدیویی، اسناد و پشتیبانی منتور به فارسی موجود است.
              </p>
            </div>
          )}
        </div>

        {error && (
          <p style={{ color: '#ef4444', marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '0.5rem' }}>
            {error}
          </p>
        )}

        {/* Filter Tabs */}
        {courses.length > 0 && (
          <div
            style={{
              display: 'flex',
              gap: '1rem',
              marginBottom: '2rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              flexWrap: 'wrap',
              paddingBottom: '1rem',
            }}
          >
            {[
              { key: 'all' as const, label: isPersian ? 'همه دوره‌ها' : 'All courses' },
              { key: 'available' as const, label: isPersian ? 'برای خرید' : 'Available' },
              { key: 'enrolled' as const, label: isPersian ? 'دوره‌های من' : 'My courses' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.375rem',
                  border: 'none',
                  backgroundColor: filter === tab.key ? 'rgb(99, 102, 241)' : 'transparent',
                  color: filter === tab.key ? 'white' : 'rgba(255, 255, 255, 0.7)',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: filter === tab.key ? '600' : '400',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  if (filter !== tab.key) {
                    (e.target as HTMLButtonElement).style.backgroundColor = 'rgba(99, 102, 241, 0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (filter !== tab.key) {
                    (e.target as HTMLButtonElement).style.backgroundColor = 'transparent';
                  }
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Course Grid */}
        {filteredCourses.length > 0 ? (
          <div className="catalog-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            {filteredCourses.map((course) => (
              <article
                key={course.id}
                className="catalog-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '1.5rem',
                  borderRadius: '0.75rem',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget;
                  el.style.borderColor = 'rgba(99, 102, 241, 0.5)';
                  el.style.backgroundColor = 'rgba(99, 102, 241, 0.05)';
                  el.style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget;
                  el.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  el.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                  el.style.transform = 'translateY(0)';
                }}
              >
                {/* Course Icon & Status Badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '2.5rem', display: 'inline-block' }}>{course.icon || '📘'}</span>
                  {course.enrolled ? (
                    <span style={{ padding: '0.25rem 0.75rem', backgroundColor: 'rgb(34, 197, 94)', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '600' }}>
                      {isPersian ? 'ثبت‌نام شده' : 'Enrolled'}
                    </span>
                  ) : (
                    <span style={{ padding: '0.25rem 0.75rem', backgroundColor: 'rgba(99, 102, 241, 0.3)', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '600', color: 'rgb(147, 150, 255)' }}>
                      {isPersian ? 'دردسترس' : 'Available'}
                    </span>
                  )}
                </div>

                {/* Course Title & Description */}
                <h3 style={{ marginBottom: '0.5rem', fontSize: '1.25rem', fontWeight: '600' }}>{course.title}</h3>
                <p style={{ marginBottom: '1rem', fontSize: '0.95rem', color: 'rgba(255, 255, 255, 0.7)', lineHeight: '1.5', flexGrow: 1 }}>
                  {course.description}
                </p>

                {/* Course Metadata */}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    marginBottom: '1rem',
                    paddingBottom: '1rem',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    fontSize: '0.9rem',
                    color: 'rgba(255, 255, 255, 0.6)',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <GraduationCap size={16} />
                    {t('common.lessonsCount', { count: course.lessonCount })}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {course.enrolled ? (
                      <>
                        <Award size={16} />
                        {t('common.percentComplete', { pct: course.progressPct })}
                      </>
                    ) : (
                      <>
                        <Clock size={16} />
                        {isPersian ? 'برای یادگیری' : 'For learning'}
                      </>
                    )}
                  </span>
                </div>

                {/* Actions */}
                <div className="catalog-actions" style={{ display: 'flex', gap: '0.75rem', flexDirection: 'column' }}>
                  <Link
                    href={`/courses/${course.slug}`}
                    style={{
                      padding: '0.75rem 1rem',
                      backgroundColor: 'transparent',
                      border: '1px solid rgb(99, 102, 241)',
                      color: 'rgb(147, 150, 255)',
                      borderRadius: '0.375rem',
                      textDecoration: 'none',
                      textAlign: 'center',
                      fontWeight: '500',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget;
                      el.style.backgroundColor = 'rgba(99, 102, 241, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget;
                      el.style.backgroundColor = 'transparent';
                    }}
                  >
                    {t('publicCourses.viewIntro')}
                  </Link>
                  {!isAuthenticated && !course.enrolled && (
                    <Link
                      href={`/courses/${course.slug}?buy=1`}
                      style={{
                        padding: '0.75rem 1rem',
                        backgroundColor: 'rgb(99, 102, 241)',
                        color: 'white',
                        borderRadius: '0.375rem',
                        textDecoration: 'none',
                        textAlign: 'center',
                        fontWeight: '500',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => {
                        const el = e.currentTarget;
                        el.style.backgroundColor = 'rgb(79, 82, 205)';
                      }}
                      onMouseLeave={(e) => {
                        const el = e.currentTarget;
                        el.style.backgroundColor = 'rgb(99, 102, 241)';
                      }}
                    >
                      {t('publicCourses.buy')}
                    </Link>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div
            style={{
              padding: '3rem 1.5rem',
              textAlign: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '0.75rem',
              border: '1px dashed rgba(255, 255, 255, 0.1)',
            }}
          >
            <BookOpen size={48} style={{ marginBottom: '1rem', color: 'rgba(99, 102, 241, 0.5)', margin: '0 auto 1rem' }} />
            <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>
              {isPersian
                ? filter === 'enrolled'
                  ? 'هنوز در دوره‌ای ثبت‌نام نکرده‌اید'
                  : 'درحال‌حاضر دوره‌ای موجود نیست'
                : filter === 'enrolled'
                  ? 'No courses yet'
                  : 'No available courses'}
            </p>
            <p style={{ color: 'rgba(255, 255, 255, 0.5)', marginBottom: '1.5rem' }}>
              {isPersian ? 'بزودی دوره‌های جدیدی اضافه می‌شود.' : 'New courses coming soon.'}
            </p>
            {!isAuthenticated && (
              <Link
                href="/assessment"
                style={{
                  display: 'inline-block',
                  padding: '0.75rem 1.5rem',
                  backgroundColor: 'rgb(99, 102, 241)',
                  color: 'white',
                  borderRadius: '0.375rem',
                  textDecoration: 'none',
                  fontWeight: '500',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.backgroundColor = 'rgb(79, 82, 205)';
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.backgroundColor = 'rgb(99, 102, 241)';
                }}
              >
                {isPersian ? 'شروع ارزیابی رایگان' : 'Start free assessment'}
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
