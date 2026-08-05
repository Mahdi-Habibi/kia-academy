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
import {
  buildRoadmapFromAnswers,
  computeOverallTestScore,
  type LearnerTestReport,
  type ReadinessTestSummary,
} from '@kia-academy/shared';
import { useApp } from '@/context/AppProvider';
import { useAuth } from '@/context/AuthProvider';
import { useLanguage } from '@/context/LanguageProvider';
import { moduleMessageKey } from '@/i18n/domain';
import { api, ApiError } from '@/lib/api';

function resolveDashboardTestScore(
  report: LearnerTestReport | null,
  examAverage: number | undefined,
  historyAverage: number | undefined,
): number | null {
  // Prefer the combined three-test score when personality + readiness exist;
  // otherwise fall back to the real readiness exam average from report/history.
  const overall = report ? computeOverallTestScore(report) : null;
  if (overall != null && report?.personality && report.readiness) return overall;
  if (typeof examAverage === 'number' && Number.isFinite(examAverage)) return examAverage;
  if (report?.readiness && Number.isFinite(report.readiness.average)) {
    return report.readiness.average;
  }
  if (typeof historyAverage === 'number' && Number.isFinite(historyAverage)) {
    return historyAverage;
  }
  return overall;
}

export default function DashboardPage() {
  const router = useRouter();
  const { hasRoadmap, roadmap, answers, testCompleted, hydrated, examResult } = useApp();
  const { user, learnerState, loading: authLoading, isAuthenticated } = useAuth();
  const { t, format } = useLanguage();
  const [testHistory, setTestHistory] = useState<ReadinessTestSummary[]>([]);
  const [testReport, setTestReport] = useState<LearnerTestReport | null>(null);
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
    let cancelled = false;
    Promise.all([api.listReadinessTests(), api.getTestReport().catch(() => null)])
      .then(([history, report]) => {
        if (cancelled) return;
        setTestHistory(history);
        setTestReport(report);
      })
      .catch((err) => {
        if (!cancelled) {
          setHistoryError(
            err instanceof ApiError ? err.message : t('dashboard.testHistory.loadError'),
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, t, testCompleted, examResult?.attemptId]);

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

  const latestExamScore =
    examResult?.average ??
    testReport?.readiness?.average ??
    testHistory[0]?.average;
  const latestScore = resolveDashboardTestScore(
    testReport,
    examResult?.average,
    testHistory[0]?.average,
  );
  const testsDone = Boolean(
    testCompleted || testReport?.readiness || latestExamScore != null,
  );

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
            onClick={() =>
              router.push(testsDone ? '/readiness/results' : '/assessment')
            }
          >
            <span
              className={`t-icon ${testsDone ? 't-icon--mint' : ''}`}
              aria-hidden="true"
            >
              {testsDone ? <CheckCircle2 size={22} /> : <Lock size={22} />}
            </span>
            <b>{t('dashboard.tile.test.title')}</b>
            {testsDone && latestScore != null ? (
              <span className="t-score mono ltr-isolate">
                {format.number(latestScore)}%
              </span>
            ) : (
              <span>{t('dashboard.tile.test.desc')}</span>
            )}
            <span className={`t-status ${testsDone ? 't-status--mint' : ''}`}>
              {testsDone
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
            onClick={() => router.push('/dashboard/my-courses')}
          >
            <span className="t-icon" aria-hidden="true">
              <BookOpen size={22} />
            </span>
            <b>{t('nav.myCourses')}</b>
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
            <b>{t('dashboard.tile.retake.title')}</b>
            <span>{t('dashboard.tile.retake.desc')}</span>
            <span className="t-status t-status--mint">
              {latestExamScore != null
                ? t('dashboard.tile.retake.lastScore', {
                    score: format.number(latestExamScore),
                  })
                : t('dashboard.tile.retake.status')}
            </span>
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
                  <span className="test-history-score mono ltr-isolate">
                    {format.number(item.average)}%
                  </span>
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
