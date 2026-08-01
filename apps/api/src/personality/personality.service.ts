import { BadRequestException, Injectable } from '@nestjs/common';
import {
  MINI_IPIP_CITATION,
  missingMiniIpipAnswers,
  scoreMiniIpip,
  type MiniIpipAnswers,
  type PersonalityLikert,
  type PersonalityResult,
} from '@kia-academy/shared';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PersonalityService {
  constructor(private readonly prisma: PrismaService) {}

  async submit(userId: string, rawAnswers: Record<string, number>): Promise<PersonalityResult> {
    const answers = this.normalizeAnswers(rawAnswers);
    const missing = missingMiniIpipAnswers(answers);
    if (missing.length) {
      throw new BadRequestException(`Incomplete answers: ${missing.join(', ')}`);
    }

    let scored: PersonalityResult;
    try {
      scored = scoreMiniIpip(answers);
    } catch (err) {
      throw new BadRequestException(err instanceof Error ? err.message : 'Invalid answers');
    }

    const record = await this.prisma.personalityResult.create({
      data: {
        userId,
        instrument: 'mini-ipip',
        answers: JSON.stringify(answers),
        scores: JSON.stringify(scored.scores),
      },
    });

    return {
      ...scored,
      id: record.id,
      citation: MINI_IPIP_CITATION,
      createdAt: record.createdAt.toISOString(),
    };
  }

  async latestForUser(userId: string): Promise<PersonalityResult | null> {
    const record = await this.prisma.personalityResult.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    if (!record) return null;
    return {
      id: record.id,
      instrument: 'mini-ipip',
      citation: MINI_IPIP_CITATION,
      answers: JSON.parse(record.answers) as MiniIpipAnswers,
      scores: JSON.parse(record.scores) as PersonalityResult['scores'],
      createdAt: record.createdAt.toISOString(),
    };
  }

  private normalizeAnswers(raw: Record<string, number>): MiniIpipAnswers {
    const out: MiniIpipAnswers = {};
    for (const [id, value] of Object.entries(raw ?? {})) {
      if (typeof value !== 'number' || !Number.isInteger(value) || value < 1 || value > 5) {
        throw new BadRequestException(`Invalid Likert value for ${id}`);
      }
      out[id] = value as PersonalityLikert;
    }
    return out;
  }
}
