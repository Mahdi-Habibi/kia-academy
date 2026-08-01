'use client';

import type { AssessmentAnswers, Goal } from '@kia-academy/shared';
import { useLanguage } from '@/context/LanguageProvider';
import { OptCard } from '../OptCard';
import { GOAL_OPTIONS } from '../wizardOptions';

interface Props {
  answers: AssessmentAnswers;
  onChange: (partial: Partial<AssessmentAnswers>) => void;
}

export function GoalStage({ answers, onChange }: Props) {
  const { t } = useLanguage();

  return (
    <>
      <div className="q-title">{t('wizard.goal.title')}</div>
      <div className="q-sub">{t('wizard.goal.sub')}</div>
      <div className="option-grid">
        {GOAL_OPTIONS.map(([val, icon]) => (
          <OptCard
            key={val}
            icon={icon}
            title={t(`wizard.goal.${val}.title`)}
            desc={t(`wizard.goal.${val}.desc`)}
            selected={answers.goal === val}
            onSelect={() => onChange({ goal: val as Goal })}
          />
        ))}
      </div>
    </>
  );
}
