import type { Goal, Interest, LearningStyle, SkillLevel } from '@kia-academy/shared';

export const SKILL_TOPIC_KEYS = [
  ['HTML/CSS', 'htmlCss'],
  ['JavaScript', 'javascript'],
  ['Python', 'python'],
] as const;

export const SKILL_LEVELS: SkillLevel[] = ['Never used', 'Beginner', 'Comfortable'];
export const HOURS_MIN = 3;
export const HOURS_MAX = 40;

/** Value key + icon only — display labels come from t() in stage components. */
export const GOAL_OPTIONS = [
  ['job', '💼'],
  ['startup', '🚀'],
  ['freelance', '🧭'],
  ['fun', '🎨'],
] as const satisfies ReadonlyArray<readonly [Goal, string]>;

export const INTEREST_OPTIONS = [
  ['web', '🌐'],
  ['ai', '🤖'],
  ['mobile', '📱'],
  ['game', '🎮'],
  ['data', '📊'],
  ['backend', '🛠️'],
] as const satisfies ReadonlyArray<readonly [Interest, string]>;

export const STYLE_OPTIONS = [
  ['video', '🎬'],
  ['reading', '📖'],
  ['building', '🧩'],
] as const satisfies ReadonlyArray<readonly [LearningStyle, string]>;

export function isWizardStageValid(
  stageIndex: number,
  answers: {
    goal: Goal | null;
    skills: Record<string, SkillLevel>;
    interests: Interest[];
    style: LearningStyle | null;
  },
): boolean {
  if (stageIndex === 0) return !!answers.goal;
  if (stageIndex === 1) return Object.keys(answers.skills).length === 3;
  if (stageIndex === 3) return answers.interests.length >= 1;
  if (stageIndex === 4) return !!answers.style;
  return true;
}
