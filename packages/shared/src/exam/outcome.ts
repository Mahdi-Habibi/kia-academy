import {
  EXAM_DOMAINS,
  type ExamDomainId,
  type ExamOutcome,
} from './types';

const DOMAIN_REFRESHER_NAME: Record<ExamDomainId, string> = {
  digitalOps: 'Refresher: Digital workplace',
  logicalReasoning: 'Refresher: Logical thinking',
  techReading: 'Refresher: Tech reading',
  codeSense: 'Refresher: Code basics',
  problemSolving: 'Refresher: Problem solving',
};

export function buildExamOutcome(args: {
  passed: boolean;
  average: number;
  percentages: Record<string, number>;
  roadmap: { id: string; modules: string[]; level: string } | null;
  weakThreshold?: number;
}): ExamOutcome {
  const weakThreshold = args.weakThreshold ?? 50;

  const weakDomains = EXAM_DOMAINS.filter(
    (domain) => (args.percentages[domain] ?? 0) < weakThreshold,
  );

  const domainScores = Object.fromEntries(
    EXAM_DOMAINS.map((domain) => [domain, args.percentages[domain] ?? 0]),
  ) as Record<ExamDomainId, number>;

  if (!args.roadmap) {
    return {
      passed: args.passed,
      average: args.average,
      domainScores,
      weakDomains,
      refreshersInserted: [],
      modulesUnlocked: [],
      levelBefore: '',
      levelAfter: '',
      roadmapId: null,
      roadmapModules: [],
    };
  }

  const { roadmap } = args;
  const levelBefore = roadmap.level;

  if (args.passed) {
    const modulesUnlocked = [roadmap.modules[0]].filter(Boolean);
    const levelAfter =
      args.average >= 85 && roadmap.level === 'absoluteBeginner'
        ? 'confidentBeginner'
        : roadmap.level;

    return {
      passed: true,
      average: args.average,
      domainScores,
      weakDomains,
      refreshersInserted: [],
      modulesUnlocked,
      levelBefore,
      levelAfter,
      roadmapId: roadmap.id,
      roadmapModules: [...roadmap.modules],
    };
  }

  const refreshersInserted: string[] = [];
  const seen = new Set<string>();
  for (const domain of weakDomains) {
    const name = DOMAIN_REFRESHER_NAME[domain];
    if (!seen.has(name)) {
      seen.add(name);
      refreshersInserted.push(name);
    }
  }

  const roadmapModules = [
    ...refreshersInserted,
    ...roadmap.modules.filter((m) => !seen.has(m)),
  ];

  return {
    passed: false,
    average: args.average,
    domainScores,
    weakDomains,
    refreshersInserted,
    modulesUnlocked: [],
    levelBefore,
    levelAfter: roadmap.level,
    roadmapId: roadmap.id,
    roadmapModules,
  };
}
