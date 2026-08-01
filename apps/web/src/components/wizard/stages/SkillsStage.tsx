'use client';

import type { AssessmentAnswers } from '@kia-academy/shared';
import { useLanguage } from '@/context/LanguageProvider';
import { skillLevelMessageKey } from '@/i18n/domain';
import { SKILL_LEVELS, SKILL_TOPIC_KEYS } from '../wizardOptions';

interface Props {
  answers: AssessmentAnswers;
  onChange: (partial: Partial<AssessmentAnswers>) => void;
}

export function SkillsStage({ answers, onChange }: Props) {
  const { t } = useLanguage();

  return (
    <>
      <div className="q-title">{t('wizard.skills.title')}</div>
      <div className="q-sub">{t('wizard.skills.sub')}</div>
      {SKILL_TOPIC_KEYS.map(([topic, topicKey]) => (
        <div key={topic} className="tag-group">
          <div className="tag-label">{t(`wizard.skills.topic.${topicKey}`)}</div>
          <div className="tag-row">
            {SKILL_LEVELS.map((level) => (
              <button
                key={level}
                type="button"
                className={`tag${answers.skills[topic] === level ? ' selected' : ''}`}
                onClick={() =>
                  onChange({
                    skills: { ...answers.skills, [topic]: level },
                  })
                }
              >
                {t(skillLevelMessageKey(level))}
              </button>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
