import { Injectable } from '@nestjs/common';
import type { BootcampState, LeaderboardEntry } from '@kia-academy/shared';
import { PrismaService } from '../prisma/prisma.service';

const STATIC_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, name: 'Priya M.', score: 890 },
  { rank: 2, name: 'Diego F.', score: 845 },
  { rank: 3, name: 'Sam K.', score: 810 },
  { rank: 4, name: 'Yuki T.', score: 610 },
  { rank: 12, name: 'You', score: 340, isMe: true },
];

@Injectable()
export class BootcampService {
  constructor(private readonly prisma: PrismaService) {}

  getLeaderboard(): LeaderboardEntry[] {
    return STATIC_LEADERBOARD;
  }

  async getState(userId: string): Promise<BootcampState> {
    let rank = 12;
    let points = 340;

    const profile = await this.prisma.bootcampProfile.findUnique({
      where: { userId },
    });
    if (profile) {
      rank = profile.rank;
      points = profile.points;
    }

    return {
      rank,
      points,
      leaderboard: this.getLeaderboard(),
      cardTimerSeconds: 2 * 3600 + 14 * 60 + 8,
    };
  }
}
