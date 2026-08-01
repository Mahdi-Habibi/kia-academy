'use client';

import type { AssessmentAnswers } from '@kia-academy/shared';
import { useLanguage } from '@/context/LanguageProvider';
import { WizardRange } from '../WizardRange';

interface Props {
  answers: AssessmentAnswers;
  onChange: (partial: Partial<AssessmentAnswers>) => void;
}

export function PersonalityStage({ answers, onChange }: Props) {
  const { t } = useLanguage();

  return (
    <>
      <div className="q-title">{t('wizard.personality.title')}</div>
      <div className="q-sub">{t('wizard.personality.sub')}</div>
      <div className="slider-block">
        <div className="tag-label">{t('wizard.personality.workingStyle')}</div>
        <WizardRange
          mode="centered"
          min={0}
          max={100}
          value={answers.personality.teamwork}
          ariaLabel={t('wizard.personality.ariaWorkingStyle')}
          onChange={(teamwork) =>
            onChange({
              personality: {
                ...answers.personality,
                teamwork,
              },
            })
          }
        />
        <div className="slider-labels">
          <span>{t('wizard.personality.solo')}</span>
          <span>{t('wizard.personality.team')}</span>
        </div>
      </div>
      <div className="slider-block">
        <div className="tag-label">{t('wizard.personality.pace')}</div>
        <WizardRange
          mode="centered"
          min={0}
          max={100}
          value={answers.personality.pace}
          ariaLabel={t('wizard.personality.ariaPace')}
          onChange={(pace) =>
            onChange({
              personality: { ...answers.personality, pace },
            })
          }
        />
        <div className="slider-labels">
          <span>{t('wizard.personality.structured')}</span>
          <span>{t('wizard.personality.exploratory')}</span>
        </div>
      </div>
    </>
  );
}
