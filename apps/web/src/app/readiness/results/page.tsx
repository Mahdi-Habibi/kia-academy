'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import {
  EXAM_DOMAINS,
  computeReadinessResult,
  type ExamOutcome,
  type ExamSubmitResult,
  type ReadinessResult,
} from '@pathwise/shared';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { PageBackButton } from '@/components/layout/PageBackButton';
import { RadarChart } from '@/components/readiness/RadarChart';
import { useApp } from '@/context/AppProvider';
import { useLanguage } from '@/context/LanguageProvider';
import { moduleMessageKey } from '@/i18n/domain';
import { api, ApiError } from '@/lib/api';

function pickLocale(
  text: { fa: string; en: string } | string,
  locale: string,
): string {
  if (typeof text === 'string') return text;
  return locale === 'fa' ? text.fa : text.en;
}

function ReadinessResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const testId = searchParams.get('testId');
  const { t, locale } = useLanguage();
  const {
    readinessScores,
    readinessResult,
    examResult,
    testCompleted,
    hydrated,
    roadmap,
  } = useApp();
  const [historical, setHistorical] = useState<
    (ReadinessResult & { id: string; createdAt: string; outcome?: ExamOutcome }) | null
  >(null);
  const [loadError, setLoadError] = useState('');

  const hasScores = Object.keys(readinessScores).length > 0;
  const localFallback = useMemo(
    () => readinessResult ?? (hasScores ? computeReadinessResult(readinessScores) : null),
    [readinessResult, readinessScores, hasScores],
  );

  useEffect(() => {
    if (!testId) return;
    let cancelled = false;
    api
      .getReadinessTest(testId)
      .then((res) => {
        if (!cancelled) setHistorical(res);
      })
      .catch(async () => {
        try {
          const exam = await api.getExamAttempt(testId);
          if (cancelled) return;
          if ('attemptId' in exam && 'outcome' in exam) {
            const submit = exam as ExamSubmitResult;
            setHistorical({
              id: submit.attemptId,
              createdAt: submit.submittedAt,
              percentages: submit.percentages,
              average: submit.average,
              passed: submit.passed,
              verdict: {
                icon: submit.verdict.icon,
                title: pickLocale(submit.verdict.title, locale),
                message: pickLocale(submit.verdict.message, locale),
                unlockTitle: pickLocale(submit.verdict.unlockTitle, locale),
                unlockSub: pickLocale(submit.verdict.unlockSub, locale),
                variant: submit.verdict.variant,
              },
              outcome: submit.outcome,
            });
          }
        } catch (err) {
          if (!cancelled) {
            setLoadError(err instanceof ApiError ? err.message : t('common.errorFallback'));
          }
        }
      });
    return () => {
      cancelled = true;
    };
  }, [testId, t, locale]);

  useEffect(() => {
    if (!hydrated || testId) return;
    if (!testCompleted && !hasScores && !readinessResult && !examResult) {
      router.replace('/readiness');
    }
  }, [hydrated, testCompleted, hasScores, readinessResult, examResult, router, testId]);

  const activeExam = examResult;
  const result = testId
    ? historical
    : activeExam
      ? {
          percentages: activeExam.percentages,
          average: activeExam.average,
          passed: activeExam.passed,
          verdict: {
            icon: activeExam.verdict.icon,
            title: pickLocale(activeExam.verdict.title, locale),
            message: pickLocale(activeExam.verdict.message, locale),
            unlockTitle: pickLocale(activeExam.verdict.unlockTitle, locale),
            unlockSub: pickLocale(activeExam.verdict.unlockSub, locale),
            variant: activeExam.verdict.variant,
          },
          outcome: activeExam.outcome,
        }
      : localFallback
        ? { ...localFallback, outcome: undefined as ExamOutcome | undefined }
        : null;

  if (testId && loadError) {
    return (
      <div className="page-content">
        <div className="container results">
          <p className="form-error">{loadError}</p>
          <button type="button" className="cta-secondary" onClick={() => router.push('/dashboard')}>
            {t('readiness.results.backDashboard')}
          </button>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="page-content">
        <div className="container results">
          <p className="sub">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  const outcome = 'outcome' in result ? result.outcome : undefined;
  const domainKeys = EXAM_DOMAINS.some((d) => result.percentages[d] != null)
    ? EXAM_DOMAINS
    : (Object.keys(result.percentages) as string[]);

  const verdictStyle = result.passed
    ? {
        borderColor: 'var(--emerald)',
        background: 'var(--emerald-dim)',
        border: '1px solid var(--emerald)',
      }
    : {
        borderColor: 'var(--amber)',
        background: 'var(--amber-dim)',
        border: '1px solid var(--amber)',
      };

  const roadmapId = outcome?.roadmapId ?? roadmap?.id;
  const roadmapHref = roadmapId
    ? `/roadmap?roadmapId=${encodeURIComponent(roadmapId)}`
    : '/roadmap';

  return (
    <div className="page-content">
      <div className="container results exam-results">
        <PageBackButton
          href={testId ? '/dashboard' : '/readiness'}
          label={testId ? t('readiness.results.backDashboard') : t('readiness.results.backTest')}
        />
        <div className="results-tag">{t('exam.results.tag')}</div>
        <h2>{t('exam.results.title')}</h2>
        <p className="sub">{t('exam.results.sub')}</p>

        <div className="results-summary-card">
          <div className="results-avg">
            <span className="results-avg-label">{t('readiness.results.average')}</span>
            <strong className="results-avg-value">{result.average}%</strong>
          </div>
          <div className="results-pass-chip" data-passed={result.passed ? 'true' : 'false'}>
            {result.passed ? t('readiness.results.passed') : t('readiness.results.needsWork')}
          </div>
        </div>

        <div className="results-grid">
          <RadarChart percentages={result.percentages} domains={domainKeys} />
          <div className="score-list">
            {domainKeys.map((m) => (
              <div key={m} className="score-row">
                <div className="score-label">
                  {EXAM_DOMAINS.includes(m as (typeof EXAM_DOMAINS)[number])
                    ? t(`exam.domains.${m}` as 'exam.domains.digitalOps')
                    : m}
                </div>
                <div className="score-bar-track">
                  <div
                    className="score-bar-fill"
                    style={{ width: `${result.percentages[m] ?? 0}%` }}
                  />
                </div>
                <div className="score-pct">{result.percentages[m] ?? 0}%</div>
              </div>
            ))}
          </div>
        </div>

        {outcome && (
          <section className="exam-outcome">
            <h3>{t('exam.results.outcomeTitle')}</h3>
            <p className="sub">{t('exam.results.outcomeSub')}</p>
            {outcome.passed ? (
              <ul className="exam-outcome-list">
                {outcome.modulesUnlocked.map((mod) => (
                  <li key={mod}>
                    <span className="exam-outcome-badge exam-outcome-badge--ok">
                      {t('exam.results.unlocked')}
                    </span>
                    {t(moduleMessageKey(mod))}
                  </li>
                ))}
                {outcome.levelAfter !== outcome.levelBefore && (
                  <li>
                    <span className="exam-outcome-badge exam-outcome-badge--ok">
                      {t('exam.results.levelUp')}
                    </span>
                    {t('exam.results.levelChange', {
                      from: outcome.levelBefore,
                      to: outcome.levelAfter,
                    })}
                  </li>
                )}
              </ul>
            ) : (
              <ul className="exam-outcome-list">
                {outcome.refreshersInserted.length === 0 ? (
                  <li>{t('exam.results.noRefreshers')}</li>
                ) : (
                  outcome.refreshersInserted.map((mod) => (
                    <li key={mod}>
                      <span className="exam-outcome-badge exam-outcome-badge--warn">
                        {t('exam.results.refresher')}
                      </span>
                      {t(moduleMessageKey(mod))}
                    </li>
                  ))
                )}
              </ul>
            )}
            {outcome.roadmapModules.length > 0 && (
              <div className="exam-outcome-path">
                <h4>{t('exam.results.updatedPath')}</h4>
                <ol>
                  {outcome.roadmapModules.map((mod) => (
                    <li key={mod}>{t(moduleMessageKey(mod))}</li>
                  ))}
                </ol>
              </div>
            )}
          </section>
        )}

        <div className="verdict-card" style={verdictStyle}>
          <div className="vi">{result.verdict.icon}</div>
          <h4>{result.verdict.title}</h4>
          <p>{result.verdict.message}</p>
        </div>
        <div className="unlock-cta">
          <div>
            <h5>{result.verdict.unlockTitle}</h5>
            <p>{result.verdict.unlockSub}</p>
          </div>
          <div className="results-actions">
            <button type="button" className="cta-primary" onClick={() => router.push(roadmapHref)}>
              {t('readiness.results.viewRoadmap')}
            </button>
            <button type="button" className="cta-secondary" onClick={() => router.push('/dashboard')}>
              {t('readiness.results.backDashboard')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReadinessResultsPage() {
  return (
    <RequireAuth nextPath="/readiness/results" learnerFlow>
      <Suspense
        fallback={
          <div className="page-content auth-loading">
            {/* loading text filled by inner content */}
          </div>
        }
      >
        <ReadinessResultsContent />
      </Suspense>
    </RequireAuth>
  );
}
