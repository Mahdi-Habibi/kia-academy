import { MINI_IPIP_CITATION, MINI_IPIP_ITEMS } from './bank';
import {
  BIG_FIVE_TRAITS,
  type BigFiveTrait,
  type BigFiveTraitScore,
  type MiniIpipAnswers,
  type PersonalityLikert,
  type PersonalityResult,
} from './types';

const LIKERT_MIN = 1;
const LIKERT_MAX = 5;
/** Four items per trait → raw sum range. */
const RAW_MIN = 4;
const RAW_MAX = 20;

export function isPersonalityLikert(value: unknown): value is PersonalityLikert {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= LIKERT_MIN &&
    value <= LIKERT_MAX
  );
}

/** Returns missing item ids, or empty when the answer sheet is complete. */
export function missingMiniIpipAnswers(answers: MiniIpipAnswers): string[] {
  return MINI_IPIP_ITEMS.filter((item) => !isPersonalityLikert(answers[item.id])).map(
    (item) => item.id,
  );
}

function scoredValue(response: PersonalityLikert, reverse: boolean): number {
  return reverse ? LIKERT_MAX + LIKERT_MIN - response : response;
}

function toPercent(raw: number): number {
  return Math.round(((raw - RAW_MIN) / (RAW_MAX - RAW_MIN)) * 100);
}

/**
 * Score a completed Mini-IPIP answer sheet.
 * Throws if any item is missing or out of range.
 */
export function scoreMiniIpip(
  answers: MiniIpipAnswers,
  opts?: { id?: string; createdAt?: string },
): PersonalityResult {
  const missing = missingMiniIpipAnswers(answers);
  if (missing.length) {
    throw new Error(`Incomplete Mini-IPIP answers: missing ${missing.join(', ')}`);
  }

  const rawByTrait: Record<BigFiveTrait, number> = {
    extraversion: 0,
    agreeableness: 0,
    conscientiousness: 0,
    neuroticism: 0,
    openness: 0,
  };

  for (const item of MINI_IPIP_ITEMS) {
    const response = answers[item.id]!;
    rawByTrait[item.trait] += scoredValue(response, item.reverse);
  }

  const scores = {} as Record<BigFiveTrait, BigFiveTraitScore>;
  for (const trait of BIG_FIVE_TRAITS) {
    const raw = rawByTrait[trait];
    scores[trait] = { trait, raw, percent: toPercent(raw) };
  }

  return {
    id: opts?.id ?? 'local',
    instrument: 'mini-ipip',
    citation: MINI_IPIP_CITATION,
    scores,
    answers: { ...answers },
    createdAt: opts?.createdAt ?? new Date().toISOString(),
  };
}
