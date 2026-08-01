'use client';

import {
  WIZARD_STAGES,
  type AssessmentAnswers,
  type ExamSubmitResult,
  type MiniIpipAnswers,
} from '@kia-academy/shared';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ExamPlayer } from '@/components/exam/ExamPlayer';
import { PersonalityTestPlayer } from '@/components/test/PersonalityTestPlayer';
import { TestBoard } from '@/components/test/TestBoard';
import { ProgressTrack } from '@/components/ui/ProgressTrack';
import { GoalStage } from '@/components/wizard/stages/GoalStage';
import { HoursStage } from '@/components/wizard/stages/HoursStage';
import { InterestsStage } from '@/components/wizard/stages/InterestsStage';
import { PersonalityStage } from '@/components/wizard/stages/PersonalityStage';
import { SkillsStage } from '@/components/wizard/stages/SkillsStage';
import { StyleStage } from '@/components/wizard/stages/StyleStage';
import { isWizardStageValid } from '@/components/wizard/wizardOptions';
import { useApp } from '@/context/AppProvider';
import { useLanguage } from '@/context/LanguageProvider';
import { api, ApiError } from '@/lib/api';
import type { ExamAttemptSession, ExamResponse } from '@kia-academy/shared';

type FlowPhase = 'board' | 'personality' | 'wizard' | 'exam';

interface UnifiedTestFlowProps {
  /** When true, starts at the timed exam (retake / gate entry). */
  readinessOnly?: boolean;
  /** Skip the board and jump into the personality → wizard → exam sequence. */
  skipBoard?: boolean;
  backHref?: string;
}

export function UnifiedTestFlow({
  readinessOnly = false,
  skipBoard = false,
}: UnifiedTestFlowProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const {
    answers,
    stageIndex,
    setAnswers,
    setStageIndex,
    completeWizard,
    roadmap,
    completeExam,
    resetReadinessTest,
  } = useApp();

  const initialPhase: FlowPhase = readinessOnly
    ? 'exam'
    : skipBoard
      ? 'personality'
      : 'board';

  const [phase, setPhase] = useState<FlowPhase>(initialPhase);
  const [transitioning, setTransitioning] = useState(false);
  const [session, setSession] = useState<ExamAttemptSession | null>(null);
  const [loadError, setLoadError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const wizardTotal = WIZARD_STAGES.length;
  const isLastWizardStage = stageIndex >= WIZARD_STAGES.length - 1;

  const patchAnswers = useCallback(
    (partial: Partial<AssessmentAnswers>) => {
      setAnswers({ ...answers, ...partial });
    },
    [answers, setAnswers],
  );

  const wizardValid = useMemo(
    () => isWizardStageValid(stageIndex, answers),
    [stageIndex, answers],
  );

  const bootExam = useCallback(async () => {
    setLoadError('');
    try {
      const next = await api.startExam(roadmap?.id);
      setSession(next);
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : t('common.errorFallback'));
    }
  }, [roadmap?.id, t]);

  useEffect(() => {
    if (phase !== 'exam') return;
    if (session) return;
    void bootExam();
  }, [phase, session, bootExam]);

  const enterPersonality = () => {
    setLoadError('');
    setPhase('personality');
  };

  const enterWizardPhase = () => {
    setStageIndex(0);
    setPhase('wizard');
  };

  const enterExamPhase = useCallback(async () => {
    setTransitioning(true);
    await completeWizard();
    resetReadinessTest();
    setSession(null);
    setPhase('exam');
    setTransitioning(false);
  }, [completeWizard, resetReadinessTest]);

  const handlePersonalitySubmit = async (personalityAnswers: MiniIpipAnswers) => {
    setSubmitting(true);
    setLoadError('');
    try {
      await api.submitPersonality(personalityAnswers);
      setSubmitting(false);
      enterWizardPhase();
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : t('common.errorFallback'));
      setSubmitting(false);
    }
  };

  const handleWizardNext = () => {
    if (!isLastWizardStage) {
      setStageIndex(stageIndex + 1);
      return;
    }
    void enterExamPhase();
  };

  const handleSave = async (examAnswers: Record<string, ExamResponse>) => {
    if (!session) return;
    await api.saveExamAnswers(session.attemptId, examAnswers);
  };

  const handleSubmit = async (examAnswers: Record<string, ExamResponse>) => {
    if (!session || submitting) return;
    setSubmitting(true);
    try {
      const result: ExamSubmitResult = await api.submitExam(session.attemptId, examAnswers);
      await completeExam(result);
      router.replace(`/readiness/results?testId=${encodeURIComponent(result.attemptId)}`);
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : t('common.errorFallback'));
      setSubmitting(false);
    }
  };

  const stageKey = WIZARD_STAGES[stageIndex]!;

  return (
    <div className={`unified-test-flow${transitioning ? ' unified-test-flow--transition' : ''}`}>
      {phase === 'board' && !readinessOnly && (
        <div className="unified-test-panel">
          <TestBoard onStart={enterPersonality} />
        </div>
      )}

      {phase === 'personality' && !readinessOnly && (
        <div className="unified-test-panel">
          {loadError && <p className="form-error">{loadError}</p>}
          <PersonalityTestPlayer
            onSubmit={handlePersonalitySubmit}
            onBack={() => setPhase('board')}
            submitting={submitting}
          />
        </div>
      )}

      {phase === 'wizard' && !readinessOnly && (
        <>
          <ProgressTrack
            total={wizardTotal}
            current={stageIndex}
            doneClass="test-seg"
            segClass="test-progress"
          />
          <div className="unified-test-panel" key={`wizard-${stageIndex}`}>
            <div className="stage-label">
              {t('wizard.stageLabel', {
                current: stageIndex + 1,
                name: t(`domain.wizardStages.${stageKey}`),
              })}
            </div>

            {stageIndex === 0 && <GoalStage answers={answers} onChange={patchAnswers} />}
            {stageIndex === 1 && <SkillsStage answers={answers} onChange={patchAnswers} />}
            {stageIndex === 2 && <PersonalityStage answers={answers} onChange={patchAnswers} />}
            {stageIndex === 3 && <InterestsStage answers={answers} onChange={patchAnswers} />}
            {stageIndex === 4 && <StyleStage answers={answers} onChange={patchAnswers} />}
            {stageIndex === 5 && <HoursStage answers={answers} onChange={patchAnswers} />}

            <div className="wizard-nav">
              <button
                type="button"
                className="btn-ghost"
                onClick={() =>
                  stageIndex > 0
                    ? setStageIndex(stageIndex - 1)
                    : setPhase('personality')
                }
              >
                {t('wizard.backPlain')}
              </button>
              <button
                type="button"
                className="btn-next"
                onClick={handleWizardNext}
                disabled={!wizardValid || transitioning}
              >
                {transitioning
                  ? t('exam.starting')
                  : isLastWizardStage
                    ? t('exam.startCta')
                    : t('wizard.continue')}
              </button>
            </div>
          </div>
        </>
      )}

      {phase === 'exam' && (
        <div className="unified-test-panel unified-test-panel--exam">
          {loadError && <p className="form-error">{loadError}</p>}
          {!session && !loadError && <p className="sub">{t('exam.loading')}</p>}
          {session && (
            <ExamPlayer
              session={session}
              onSaveAnswers={handleSave}
              onSubmit={handleSubmit}
              submitting={submitting}
            />
          )}
          {!session && loadError && (
            <button type="button" className="btn-next" onClick={() => void bootExam()}>
              {t('exam.retry')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
