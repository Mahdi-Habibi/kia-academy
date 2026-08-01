'use client';

import type { AssessmentAnswers, LearningStyle } from '@kia-academy/shared';
import { useLanguage } from '@/context/LanguageProvider';
import { OptCard } from '../OptCard';
import { STYLE_OPTIONS } from '../wizardOptions';

interface Props {
  answers: AssessmentAnswers;
  onChange: (partial: Partial<AssessmentAnswers>) => void;
}

export function StyleStage({ answers, onChange }: Props) {
  const { t } = useLanguage();

  return (
    <>
      <div className="q-title">{t('wizard.style.title')}</div>
      <div className="q-sub">{t('wizard.style.sub')}</div>
      <div className="option-grid">
        {STYLE_OPTIONS.map(([val, icon]) => (
          <OptCard
            key={val}
            icon={icon}
            title={t(`wizard.style.${val}.title`)}
            desc={t(`wizard.style.${val}.desc`)}
            selected={answers.style === val}
            onSelect={() => onChange({ style: val as LearningStyle })}
          />
        ))}
      </div>
    </>
  );
}
