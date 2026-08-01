'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Compass,
  Gauge,
  Lock,
  Map as MapIcon,
  PlayCircle,
  Trophy,
} from 'lucide-react';
import type { ReadinessTestSummary } from '@kia-academy/shared';
import { buildRoadmapFromAnswers } from '@kia-academy/shared';
import { useApp } from '@/context/AppProvider';
import { useAuth } from '@/context/AuthProvider';
import { useLanguage } from '@/context/LanguageProvider';
import { moduleMessageKey } from '@/i18n/domain';
import { api, ApiError } from '@/lib/api';

export default function DashboardPage() {
  const router = useRouter();
  const { hasRoadmap, roadmap, answers, testCompleted, hydrated } = useApp();
  const { user, learnerState, loading: authLoading, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const { format } = useLanguage();
  const [testHistory, setTestHistory] = useState<ReadinessTestSummary[]>([]);
  const [historyError, setHistoryError] = useState('');
  const [nextLessonHref, setNextLessonHref] = useState<string | null>(null);

  const ownsRoadmap = hasRoadmap || Boolean(learnerState?.hasRoadmap);
  const ready = hydrated && !authLoading;

  useEffect(() => {
    if (!ready) return;
    if (!isAuthenticated) {
      router.replace(`/education?next=${encodeURIComponent('/dashboard')}`);
    }
  }, [ready, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    api
      .listReadinessTests()
      .then(setTestHistory)
      .catch((err) => {
        setHistoryError(err instanceof ApiError ? err.message : t('dashboard.testHistory.loadError'));
      });
  }, [isAuthenticated, t]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;

    (async () => {
      try {
        const courses = await api.listCourses();
        const enrolled = courses.filter((c) => c.enrolled);
        const target =
          enrolled.find((c) => c.progressPct < 100) ??
          enrolled[0] ??
          courses.find((c) => c.slug === 'javascript-core');

        if (!target || cancelled) return;

        const detail = await api.getCourse(target.slug);
        const nextLesson =
          detail.lessons.find((lesson) => !lesson.completed) ?? detail.lessons[0];
        if (nextLesson && !cancelled) {
          setNextLessonHref(`/learn/${target.slug}/${nextLesson.slug}`);
        }
      } catch {
        if (!cancelled) {
          setNextLessonHref('/learn/javascript-core/variables-and-types');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  if (!ready || !isAuthenticated) {
    return <div className="page-content auth-loading">{t('dashboard.loading')}</div>;
  }

  if (!ownsRoadmap) {
    return (
      <div className="page-content">
        <div className="container hub">
          <header className="page-head">
            <div>
              <h1>
                {user?.name
                  ? t('dashboard.welcomeNamed', { name: user.name.split(' ')[0] })
                  : t('dashboard.welcome')}
              </h1>
              <p>{t('dashboard.empty.sub')}</p>
            </div>
          </header>

          <div className="bento">
            <Link href="/assessment" className="tile tile--half tile--feature">
              <span className="t-icon t-icon--brand" aria-hidden="true">
                <Compass size={22} />
              </span>
              <b>{t('dashboard.empty.startAssessment.title')}</b>
              <span>{t('dashboard.empty.startAssessment.desc')}</span>
              <span className="t-status t-status--brand">
                {t('dashboard.empty.startAssessment.status')}
                <ArrowRight className="nav-arrow" size={14} aria-hidden="true" />
              </span>
            </Link>
            <Link href="/courses" className="tile tile--half">
              <span className="t-icon" aria-hidden="true">
                <BookOpen size={22} />
              </span>
              <b>{t('dashboard.empty.browseCourses.title')}</b>
              <span>{t('dashboard.empty.browseCourses.desc')}</span>
              <span className="t-status">{t('dashboard.empty.browseCourses.status')}</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const data = roadmap ?? buildRoadmapFromAnswers(answers);
  const nextCourse = data.modules[1]
    ? t(moduleMessageKey(data.modules[1]))
    : t('dashboard.fallbackNextCourse');
  const firstName = user?.name?.split(' ')[0] ?? t('dashboard.fallbackName');
  const lessonHref = nextLessonHref ?? '/learn/javascript-core/variables-and-types';
  const latestScore = testHistory[0]?.average;

  return (
    <div className="page-content">
      <div className="container hub">
        <header className="page-head">
          <div>
            <h1>{t('dashboard.welcomeBack', { name: firstName })}</h1>
            <p>{t('dashboard.hub.sub')}</p>
          </div>
          <Link href={lessonHref} className="btn btn--primary">
            <PlayCircle size={18} aria-hidden="true" />
            {t('dashboard.tile.next.title')}
          </Link>
        </header>

        <div className="bento">
          {/* continue learning — the single most important action */}
          <Link href={lessonHref} className="tile tile--half tile--resume">
            <span className="t-icon t-icon--onink" aria-hidden="true">
              <PlayCircle size={22} />
            </span>
            <span className="t-eyebrow">{t('dashboard.tile.next.status')}</span>
            <b>{nextCourse}</b>
            <span>{t('dashboard.tile.next.title')}</span>
            <span className="t-status t-status--onink">
              {t('dashboard.tile.next.title')}
              <ArrowRight className="nav-arrow" size={14} aria-hidden="true" />
            </span>
          </Link>

          <button
            type="button"
            className="tile tile--quarter"
            onClick={() => router.push('/roadmap')}
          >
            <span className="t-icon t-icon--brand" aria-hidden="true">
              <MapIcon size={22} />
            </span>
            <b>{t('dashboard.tile.roadmap.title')}</b>
            <span>{t('dashboard.tile.roadmap.desc')}</span>
            <span className="t-status t-status--brand">{t('dashboard.tile.roadmap.status')}</span>
          </button>

          <button
            type="button"
            className="tile tile--quarter"
            onClick={() => router.push('/readiness/results')}
          >
            <span
              className={`t-icon ${testCompleted ? 't-icon--mint' : ''}`}
              aria-hidden="true"
            >
              {testCompleted ? <CheckCircle2 size={22} /> : <Lock size={22} />}
            </span>
            <b>{t('dashboard.tile.test.title')}</b>
            {testCompleted && latestScore !== undefined ? (
              <span className="t-score mono ltr-isolate">{latestScore}%</span>
            ) : (
              <span>{t('dashboard.tile.test.desc')}</span>
            )}
            <span className={`t-status ${testCompleted ? 't-status--mint' : ''}`}>
              {testCompleted
                ? t('dashboard.tile.test.completed')
                : t('dashboard.tile.test.notStarted')}
            </span>
          </button>

          <button
            type="button"
            className="tile tile--third"
            onClick={() => router.push('/bootcamp')}
          >
            <span className="t-icon t-icon--amber" aria-hidden="true">
              <Trophy size={22} />
            </span>
            <b>{t('dashboard.tile.bootcamp.title')}</b>
            <span>{t('dashboard.tile.bootcamp.desc')}</span>
            <span className="t-status t-status--amber">{t('dashboard.tile.bootcamp.status')}</span>
          </button>

          <button
            type="button"
            className="tile tile--third"
            onClick={() => router.push('/courses')}
          >
            <span className="t-icon" aria-hidden="true">
              <BookOpen size={22} />
            </span>
            <b>{t('dashboard.tile.courses.title')}</b>
            <span>{t('dashboard.tile.courses.desc')}</span>
            <span className="t-status">{t('dashboard.tile.courses.status')}</span>
          </button>

          <button
            type="button"
            className="tile tile--third"
            onClick={() => router.push('/readiness')}
          >
            <span className="t-icon t-icon--mint" aria-hidden="true">
              <Gauge size={22} />
            </span>
            <b>{t('dashboard.tile.test.title')}</b>
            <span>{t('dashboard.tile.test.desc')}</span>
            <span className="t-status t-status--mint">{t('dashboard.tile.test.notStarted')}</span>
          </button>
        </div>

        <section className="test-history" aria-labelledby="test-history-heading">
          <h2 id="test-history-heading" className="section-heading">
            {t('dashboard.testHistory.title')}
          </h2>
          {historyError && <p className="form-error">{historyError}</p>}
          {!historyError && testHistory.length === 0 && (
            <p className="text-dim">{t('dashboard.testHistory.empty')}</p>
          )}
          {testHistory.length > 0 && (
            <div className="test-history-list">
              {testHistory.map((item) => (
                <div key={item.id} className="test-history-item">
                  <span className="test-history-date">{format.date(item.createdAt)}</span>
                  <span className="test-history-score mono ltr-isolate">{item.average}%</span>
                  <span
                    className={`chip ${item.passed ? 'chip--mint' : 'chip--amber'}`}
                  >
                    {item.passed
                      ? t('dashboard.testHistory.passed')
                      : t('dashboard.testHistory.needsWork')}
                  </span>
                  <Link href={`/readiness/results?testId=${item.id}`} className="link-quiet">
                    {t('dashboard.testHistory.view')}
                    <ArrowRight className="nav-arrow" size={13} aria-hidden="true" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
