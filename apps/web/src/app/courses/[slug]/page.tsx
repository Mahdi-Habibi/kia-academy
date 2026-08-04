'use client';

import Link from 'next/link';
import { BookOpen, CreditCard, Loader2, Sparkles, Users, Clock, BadgeCheck } from 'lucide-react';
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
  const { t, lang } = useLanguage();
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
  const isPersian = lang === 'fa';

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
    <div className="page-content" dir={isPersian ? 'rtl' : 'ltr'}>
      <div className="container catalog-shell">
        <PageBackButton href="/courses" />

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <span className="eyebrow">
            <BookOpen size={14} className="inline-leading-icon" />
            {t('publicCourses.introEyebrow')}
          </span>
          <h1 style={{ marginBottom: '0.75rem' }}>{course.title}</h1>
          <p className="auth-sub" style={{ fontSize: '1.05rem', marginBottom: '1.5rem', lineHeight: '1.6' }}>
            {course.description}
          </p>
        </div>

        {/* Persian-specific CTA if applicable */}
        {isPersian && course.enrolled && (
          <div
            style={{
              padding: '1rem',
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              borderRight: '4px solid rgb(34, 197, 94)',
              borderRadius: '0.5rem',
              marginBottom: '1.5rem',
            }}
          >
            <p style={{ margin: '0', fontSize: '0.95rem' }}>
              <BadgeCheck style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} size={16} />
              <strong>شما در این دوره ثبت‌نام شده‌اید.</strong> می‌توانید از
              <Link href="/dashboard" style={{ color: 'rgb(34, 197, 94)', marginLeft: '0.25rem', marginRight: '0.25rem', textDecoration: 'underline' }}>
                پنل خود
              </Link>
              شروع کنید.
            </p>
          </div>
        )}

        {/* Main Content Section */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isPersian ? '1fr 380px' : '380px 1fr',
            gap: '2rem',
            marginBottom: '2rem',
          }}
        >
          {/* Left: Course Details */}
          <div>
            {/* Course Stats */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
                marginBottom: '2rem',
              }}
            >
              <div
                style={{
                  padding: '1rem',
                  backgroundColor: 'rgba(99, 102, 241, 0.1)',
                  borderRadius: '0.5rem',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <BookOpen size={18} style={{ color: 'rgb(99, 102, 241)' }} />
                  <span style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                    {isPersian ? 'درس‌ها' : 'Lessons'}
                  </span>
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'rgb(99, 102, 241)' }}>{lessonCount}</div>
              </div>
              <div
                style={{
                  padding: '1rem',
                  backgroundColor: 'rgba(147, 51, 234, 0.1)',
                  borderRadius: '0.5rem',
                  border: '1px solid rgba(147, 51, 234, 0.2)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Clock size={18} style={{ color: 'rgb(147, 51, 234)' }} />
                  <span style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                    {isPersian ? 'مدت دوره' : 'Duration'}
                  </span>
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'rgb(147, 51, 234)' }}>
                  {isPersian ? '۸-۱۲ هفته' : '8-12 wks'}
                </div>
              </div>
            </div>

            {/* Course Overview */}
            <div
              style={{
                padding: '1.5rem',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '0.75rem',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                marginBottom: '2rem',
              }}
            >
              <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: '600' }}>
                {isPersian ? 'درباره این دوره' : 'About this course'}
              </h3>
              <p style={{ color: 'rgba(255, 255, 255, 0.8)', lineHeight: '1.6', marginBottom: '1rem' }}>
                {isPersian
                  ? 'این دوره برای یادگیرندگان ایرانی طراحی شده است و تمام محتوا، ویدیوها و پشتیبانی منتور به فارسی موجود است.'
                  : 'This course is designed for Iranian learners with full support in Persian.'}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.9rem' }}>
                <Users size={16} />
                <span>{isPersian ? 'پشتیبانی منتور شامل است' : 'Mentor support included'}</span>
              </div>
            </div>

            {/* Preview Lessons */}
            <div
              style={{
                padding: '1.5rem',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '0.75rem',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={18} style={{ color: 'rgb(147, 51, 234)' }} />
                {t('publicCourses.previewTitle')}
              </h3>
              <ul style={{ listStyle: 'none', padding: '0', margin: '0' }}>
                {previewLessons.length > 0 ? (
                  previewLessons.map((lesson) => (
                    <li
                      key={lesson.id}
                      style={{
                        padding: '0.75rem 0',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.75rem',
                      }}
                    >
                      <Sparkles size={16} style={{ color: 'rgb(147, 51, 234)', marginTop: '0.25rem', flexShrink: 0 }} />
                      <span style={{ color: 'rgba(255, 255, 255, 0.9)' }}>{lesson.title}</span>
                    </li>
                  ))
                ) : (
                  <li style={{ padding: '0.75rem 0', color: 'rgba(255, 255, 255, 0.5)' }}>
                    {isPersian ? 'پیش‌نمایش دردسترس نیست' : 'No preview available'}
                  </li>
                )}
              </ul>
              {previewLessons.length > 0 && (
                <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '0' }}>
                  {isPersian ? '+ درس‌های بیشتری منتظر شماست' : '+ more lessons await'}
                </p>
              )}
            </div>
          </div>

          {/* Right: Purchase Panel (Sticky on desktop) */}
          <div style={{ position: 'sticky', top: '2rem', height: 'fit-content' }}>
            <div
              style={{
                padding: '2rem',
                backgroundColor: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                borderRadius: '0.75rem',
                backdropFilter: 'blur(10px)',
              }}
            >
              {/* Status or Price */}
              {course.enrolled ? (
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '0.85rem', color: 'rgb(34, 197, 94)', fontWeight: '600', marginBottom: '0.5rem' }}>
                    <BadgeCheck style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} size={16} />
                    {isPersian ? 'شما ثبت‌نام کرده‌اید' : 'You\'re enrolled'}
                  </div>
                  <p style={{ color: 'rgba(255, 255, 255, 0.7)', margin: '0', fontSize: '0.9rem' }}>
                    {isPersian ? 'شروع یادگیری از پنل خود' : 'Start learning from your dashboard'}
                  </p>
                </div>
              ) : (
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '0.5rem', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.05em' }}>
                    {isPersian ? 'قیمت' : 'Price'}
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.25rem' }}>
                    {isPersian ? '۲۹۹,۰۰۰' : '$49'}
                    <span style={{ fontSize: '1rem', color: 'rgba(255, 255, 255, 0.6)', marginLeft: isPersian ? '0.5rem' : '0', marginRight: isPersian ? '0' : '0.5rem' }}>
                      {isPersian ? 'تومان' : 'USD'}
                    </span>
                  </div>
                  <p style={{ color: 'rgba(255, 255, 255, 0.5)', margin: '0', fontSize: '0.85rem' }}>
                    {isPersian ? 'دسترسی دائم · فقط یک‌بار پرداخت' : 'One-time purchase · lifetime access'}
                  </p>
                </div>
              )}

              {/* Divider */}
              <div style={{ height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.1)', margin: '1.5rem 0' }} />

              {/* What You Get */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ marginBottom: '0.75rem', fontSize: '0.9rem', fontWeight: '600', color: 'rgba(255, 255, 255, 0.8)' }}>
                  {isPersian ? 'شامل:' : 'Includes:'}
                </h4>
                <ul style={{ listStyle: 'none', padding: '0', margin: '0', fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                  <li style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: 'rgb(34, 197, 94)' }}>✓</span>
                    {lessonCount} {isPersian ? 'درس ویدیویی' : 'video lessons'}
                  </li>
                  <li style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: 'rgb(34, 197, 94)' }}>✓</span>
                    {isPersian ? 'اسناد و منابع به فارسی' : 'Persian resources'}
                  </li>
                  <li style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: 'rgb(34, 197, 94)' }}>✓</span>
                    {isPersian ? 'پشتیبانی منتور' : 'Mentor support'}
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: 'rgb(34, 197, 94)' }}>✓</span>
                    {isPersian ? 'دسترسی مادام‌العمر' : 'Lifetime access'}
                  </li>
                </ul>
              </div>

              {/* Action Button */}
              {!course.enrolled && (
                <>
                  {isAuthenticated ? (
                    <Link
                      href={`/checkout?product=COURSE&slugs=${encodeURIComponent(course.slug)}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        padding: '1rem 1.5rem',
                        backgroundColor: 'rgb(99, 102, 241)',
                        color: 'white',
                        borderRadius: '0.5rem',
                        textDecoration: 'none',
                        fontWeight: '600',
                        width: '100%',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        fontSize: '1rem',
                      }}
                      onMouseEnter={(e) => {
                        const el = e.currentTarget as HTMLElement;
                        el.style.backgroundColor = 'rgb(79, 82, 205)';
                        el.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        const el = e.currentTarget as HTMLElement;
                        el.style.backgroundColor = 'rgb(99, 102, 241)';
                        el.style.transform = 'translateY(0)';
                      }}
                    >
                      <CreditCard size={18} />
                      {t('publicCourses.buy')}
                    </Link>
                  ) : (
                    <Link
                      href={`/login?next=${encodeURIComponent(`/checkout?product=COURSE&slugs=${encodeURIComponent(course.slug)}`)}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        padding: '1rem 1.5rem',
                        backgroundColor: 'rgb(99, 102, 241)',
                        color: 'white',
                        borderRadius: '0.5rem',
                        textDecoration: 'none',
                        fontWeight: '600',
                        width: '100%',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        fontSize: '1rem',
                      }}
                      onMouseEnter={(e) => {
                        const el = e.currentTarget as HTMLElement;
                        el.style.backgroundColor = 'rgb(79, 82, 205)';
                        el.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        const el = e.currentTarget as HTMLElement;
                        el.style.backgroundColor = 'rgb(99, 102, 241)';
                        el.style.transform = 'translateY(0)';
                      }}
                    >
                      <CreditCard size={18} />
                      {isPersian ? 'ورود و خرید' : 'Sign in to buy'}
                    </Link>
                  )}
                  <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.5)', textAlign: 'center', margin: '1rem 0 0' }}>
                    {isPersian ? '۳۰ روز گارانتی برگشت پول' : '30-day money-back guarantee'}
                  </p>
                </>
              )}

              {course.enrolled && (
                <Link
                  href="/dashboard"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '1rem 1.5rem',
                    backgroundColor: 'rgb(34, 197, 94)',
                    color: 'white',
                    borderRadius: '0.5rem',
                    textDecoration: 'none',
                    fontWeight: '600',
                    width: '100%',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontSize: '1rem',
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.backgroundColor = 'rgb(22, 163, 74)';
                    el.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.backgroundColor = 'rgb(34, 197, 94)';
                    el.style.transform = 'translateY(0)';
                  }}
                >
                  {isPersian ? 'ادامه یادگیری' : 'Continue learning'}
                </Link>
              )}
            </div>
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
