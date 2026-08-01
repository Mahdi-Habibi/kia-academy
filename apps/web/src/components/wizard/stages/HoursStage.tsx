'use client';

import type { AssessmentAnswers } from '@kia-academy/shared';
import { useLanguage } from '@/context/LanguageProvider';
import { HOURS_MAX, HOURS_MIN } from '../wizardOptions';
import { WizardRange } from '../WizardRange';

interface Props {
  answers: AssessmentAnswers;
  onChange: (partial: Partial<AssessmentAnswers>) => void;
}

export function HoursStage({ answers, onChange }: Props) {
  const { t } = useLanguage();

  return (
    <>
      <div className="q-title">{t('wizard.hours.title')}</div>
      <div className="q-sub">{t('wizard.hours.sub')}</div>
      <div className="slider-block">
        <div className="tag-label">{t('wizard.hours.label', { hours: answers.hours })}</div>
        <WizardRange
          mode="progress"
          min={HOURS_MIN}
          max={HOURS_MAX}
          value={answers.hours}
          ariaLabel={t('wizard.hours.aria')}
          onChange={(hours) => onChange({ hours })}
        />
        <div className="slider-labels">
          <span>{HOURS_MIN}h</span>
          <span>{HOURS_MAX}h</span>
        </div>
      </div>
    </>
  );
}
