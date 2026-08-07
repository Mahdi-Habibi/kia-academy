import { Injectable } from '@nestjs/common';
import type { LearnerProgressSummary } from '@kia-academy/shared';
import { CoursesService } from '../courses/courses.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProgressService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly coursesService: CoursesService,
  ) {}

  async getSummary(userId: string): Promise<LearnerProgressSummary> {
    const [courses, latestExam, bootcamp] = await Promise.all([
      this.coursesService.listMyCourses(userId),
      this.prisma.readinessTest.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: { average: true },
      }),
      this.prisma.bootcampProfile.findUnique({
        where: { userId },
        select: { points: true },
      }),
    ]);

    const examAverage = latestExam?.average ?? null;
    const bootcampPoints = bootcamp?.points ?? 0;

    const points = [
      ...courses.map((course) => ({
        label: course.title,
        value: course.progressPct,
        kind: 'course' as const,
      })),
      ...(examAverage != null
        ? [{ label: 'Readiness', value: examAverage, kind: 'exam' as const }]
        : []),
      {
        label: 'Bootcamp',
        value: Math.min(100, Math.round(bootcampPoints / 10)),
        kind: 'bootcamp' as const,
      },
    ];

    return {
      courses: courses.map((course) => ({
        slug: course.slug,
        title: course.title,
        progressPct: course.progressPct,
      })),
      examAverage,
      bootcampPoints,
      points,
    };
  }
}
