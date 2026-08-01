'use client';

import type { AssessmentAnswers, Interest } from '@kia-academy/shared';
import { useLanguage } from '@/context/LanguageProvider';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { OptCard } from '../OptCard';
import { INTEREST_OPTIONS } from '../wizardOptions';

interface Props {
  answers: AssessmentAnswers;
  onChange: (partial: Partial<AssessmentAnswers>) => void;
}

export function InterestsStage({ answers, onChange }: Props) {
  const { t } = useLanguage();
  const { settings } = useSiteSettings();

  const options =
    settings.tracks.length > 0
      ? settings.tracks.map((track) => ({
          val: track.key as Interest,
          icon: track.icon || '📘',
          title: track.name,
          desc: track.description,
        }))
      : INTEREST_OPTIONS.map(([val, icon]) => ({
          val,
          icon,
          title: t(`wizard.interests.${val}.title`),
          desc: t(`wizard.interests.${val}.desc`),
        }));

  const toggleInterest = (val: Interest) => {
    const interests = [...answers.interests];
    const idx = interests.indexOf(val);
    if (idx > -1) {
      interests.splice(idx, 1);
    } else {
      if (interests.length >= 2) interests.shift();
      interests.push(val);
    }
    onChange({ interests });
  };

  return (
    <>
      <div className="q-title">{t('wizard.interests.title')}</div>
      <div className="q-sub">{t('wizard.interests.sub')}</div>
      <div className="option-grid">
        {options.map((opt) => (
          <OptCard
            key={opt.val}
            icon={opt.icon}
            title={opt.title}
            desc={opt.desc}
            selected={answers.interests.includes(opt.val)}
            onSelect={() => toggleInterest(opt.val)}
          />
        ))}
      </div>
    </>
  );
}
