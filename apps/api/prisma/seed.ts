import { PrismaClient, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  DEFAULT_ASSESSMENT_BANK,
  EXAM_QUESTION_BANK,
  MINI_IPIP_CITATION,
  MINI_IPIP_ITEMS,
  buildCourseCatalog,
  createDefaultSiteSettings,
  createSectionPermission,
  type CourseDbFile,
} from '@kia-academy/shared';

const prisma = new PrismaClient();

const SEED_PASSWORD = 'KiaAcademy123!';

function loadCourseDb(): CourseDbFile {
  const candidates = [
    join(__dirname, '../../../db.json'),
    join(process.cwd(), 'db.json'),
    join(process.cwd(), '../../db.json'),
  ];
  for (const path of candidates) {
    try {
      return JSON.parse(readFileSync(path, 'utf8')) as CourseDbFile;
    } catch {
      /* try next */
    }
  }
  throw new Error('Could not find db.json (expected at monorepo root)');
}

function moderatorAccess(
  stats: [boolean, boolean, boolean],
  settings: [boolean, boolean, boolean],
  courses: [boolean, boolean, boolean],
  challenges: [boolean, boolean, boolean],
  users: [boolean, boolean, boolean],
  payments: [boolean, boolean, boolean] = [false, false, false],
): Prisma.InputJsonValue {
  return JSON.parse(
    JSON.stringify({
      stats: createSectionPermission(...stats),
      settings: createSectionPermission(...settings),
      courses: createSectionPermission(...courses),
      challenges: createSectionPermission(...challenges),
      users: createSectionPermission(...users),
      payments: createSectionPermission(...payments),
    }),
  ) as Prisma.InputJsonValue;
}

async function main() {
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@kia.academy' },
    update: {
      name: 'Kia Academy Super Admin',
      passwordHash,
      role: 'SUPER_ADMIN',
      profileComplete: true,
    },
    create: {
      name: 'Kia Academy Super Admin',
      email: 'admin@kia.academy',
      passwordHash,
      role: 'SUPER_ADMIN',
      profileComplete: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'moderator@kia.academy' },
    update: {
      name: 'Sample Moderator (Courses)',
      passwordHash,
      role: 'ADMIN',
      profileComplete: true,
      adminPanelAccess: moderatorAccess(
        [true, true, false],
        [false, false, false],
        [true, true, false],
        [false, false, false],
        [false, false, false],
      ),
    },
    create: {
      name: 'Sample Moderator (Courses)',
      email: 'moderator@kia.academy',
      passwordHash,
      role: 'ADMIN',
      profileComplete: true,
      adminPanelAccess: moderatorAccess(
        [true, true, false],
        [false, false, false],
        [true, true, false],
        [false, false, false],
        [false, false, false],
      ),
    },
  });

  await prisma.user.upsert({
    where: { email: 'moderator2@kia.academy' },
    update: {
      name: 'Sample Moderator (Challenges)',
      passwordHash,
      role: 'ADMIN',
      profileComplete: true,
      adminPanelAccess: moderatorAccess(
        [false, false, false],
        [false, false, false],
        [false, false, false],
        [true, true, false],
        [false, false, false],
      ),
    },
    create: {
      name: 'Sample Moderator (Challenges)',
      email: 'moderator2@kia.academy',
      passwordHash,
      role: 'ADMIN',
      profileComplete: true,
      adminPanelAccess: moderatorAccess(
        [false, false, false],
        [false, false, false],
        [false, false, false],
        [true, true, false],
        [false, false, false],
      ),
    },
  });

  const user = await prisma.user.upsert({
    where: { email: 'alex@kia.academy' },
    update: {
      name: 'Alex R.',
      passwordHash,
      profileComplete: true,
    },
    create: {
      name: 'Alex R.',
      email: 'alex@kia.academy',
      passwordHash,
      profileComplete: true,
      bootcampProfile: {
        create: {
          rank: 12,
          points: 340,
        },
      },
    },
    include: { bootcampProfile: true },
  });

  const catalog = buildCourseCatalog(loadCourseDb());
  const seededCourses: { id: string; slug: string }[] = [];

  for (const course of catalog) {
    const row = await prisma.course.upsert({
      where: { slug: course.slug },
      update: {
        title: course.title,
        description: course.description,
        icon: course.icon,
        trackKey: course.trackKey,
        sortOrder: course.sortOrder,
        published: true,
      },
      create: {
        slug: course.slug,
        title: course.title,
        description: course.description,
        icon: course.icon,
        trackKey: course.trackKey,
        sortOrder: course.sortOrder,
        published: true,
      },
    });
    seededCourses.push({ id: row.id, slug: row.slug });

    for (const lesson of course.lessons) {
      await prisma.lesson.upsert({
        where: {
          courseId_slug: {
            courseId: row.id,
            slug: lesson.slug,
          },
        },
        update: {
          title: lesson.title,
          content: lesson.content,
          durationMin: lesson.durationMin,
          sortOrder: lesson.sortOrder,
          videoUrl: lesson.videoUrl,
        },
        create: {
          courseId: row.id,
          slug: lesson.slug,
          title: lesson.title,
          content: lesson.content,
          durationMin: lesson.durationMin,
          sortOrder: lesson.sortOrder,
          videoUrl: lesson.videoUrl,
        },
      });
    }
  }

  const interviewBranding = await prisma.course.upsert({
    where: { slug: 'interview-branding' },
    update: {
      title: 'Interview & Personal Branding',
      description: 'Build a standout portfolio, resume, and interview story that gets you hired.',
      icon: 'briefcase',
      trackKey: 'web',
      sortOrder: 100,
    },
    create: {
      slug: 'interview-branding',
      title: 'Interview & Personal Branding',
      description: 'Build a standout portfolio, resume, and interview story that gets you hired.',
      icon: 'briefcase',
      trackKey: 'web',
      sortOrder: 100,
    },
  });

  const brandingLessons = [
    {
      slug: 'portfolio-story',
      title: 'Portfolio Story',
      durationMin: 14,
      sortOrder: 1,
      content: `# Portfolio Story

Your portfolio should tell a clear story: who you are, what you build, and why it matters.

## Checklist
- Hero section with role + value proposition
- 2–3 featured projects with outcomes
- Contact link and GitHub profile`,
    },
    {
      slug: 'interview-framework',
      title: 'Interview Framework',
      durationMin: 16,
      sortOrder: 2,
      content: `# Interview Framework

Use STAR (Situation, Task, Action, Result) to answer behavioral questions.

## Tips
- Lead with impact, not tools
- Quantify results when possible
- Prepare 3 project deep-dives`,
    },
  ];

  for (const lesson of brandingLessons) {
    await prisma.lesson.upsert({
      where: {
        courseId_slug: {
          courseId: interviewBranding.id,
          slug: lesson.slug,
        },
      },
      update: {
        title: lesson.title,
        content: lesson.content,
        durationMin: lesson.durationMin,
        sortOrder: lesson.sortOrder,
      },
      create: {
        courseId: interviewBranding.id,
        ...lesson,
      },
    });
  }

  const primaryCourse = seededCourses[0];
  if (primaryCourse) {
    await prisma.enrollment.upsert({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: primaryCourse.id,
        },
      },
      update: {},
      create: {
        userId: user.id,
        courseId: primaryCourse.id,
      },
    });
  }

  const entitlements = [
    { resourceType: 'readiness', resourceId: 'test', source: 'PURCHASE' as const },
    ...seededCourses.map((course) => ({
      resourceType: 'course' as const,
      resourceId: course.slug,
      source: 'FREE' as const,
    })),
  ];

  for (const entitlement of entitlements) {
    await prisma.entitlement.upsert({
      where: {
        userId_resourceType_resourceId: {
          userId: user.id,
          resourceType: entitlement.resourceType,
          resourceId: entitlement.resourceId,
        },
      },
      update: { source: entitlement.source },
      create: {
        userId: user.id,
        resourceType: entitlement.resourceType,
        resourceId: entitlement.resourceId,
        source: entitlement.source,
      },
    });
  }

  const now = new Date();
  const challengeEndsAt = new Date(now);
  challengeEndsAt.setDate(challengeEndsAt.getDate() + 30);

  await prisma.challenge.upsert({
    where: { slug: 'fizzbuzz' },
    update: {
      title: 'FizzBuzz Challenge',
      description:
        'Write a function that returns "Fizz" for multiples of 3, "Buzz" for multiples of 5, and "FizzBuzz" for both.',
      points: 120,
      startsAt: now,
      endsAt: challengeEndsAt,
      active: true,
      starterCode: `function fizzBuzz(n) {
  // Return "Fizz", "Buzz", "FizzBuzz", or the number as a string
}`,
    },
    create: {
      slug: 'fizzbuzz',
      title: 'FizzBuzz Challenge',
      description:
        'Write a function that returns "Fizz" for multiples of 3, "Buzz" for multiples of 5, and "FizzBuzz" for both.',
      points: 120,
      startsAt: now,
      endsAt: challengeEndsAt,
      active: true,
      starterCode: `function fizzBuzz(n) {
  // Return "Fizz", "Buzz", "FizzBuzz", or the number as a string
}`,
    },
  });

  console.log(`Seeded admin user: ${admin.name} (${admin.email})`);
  console.log(`  Password: ${SEED_PASSWORD}`);
  console.log('Seeded moderators: moderator@kia.academy (courses), moderator2@kia.academy (challenges)');
  console.log(`Seeded learner: ${user.name} (${user.email ?? 'alex@kia.academy'})`);
  console.log(`  Password: ${SEED_PASSWORD}`);
  console.log(
    `Seeded courses from db.json: ${seededCourses.map((c) => c.slug).join(', ')}, interview-branding`,
  );
  console.log(`Seeded challenge: fizzbuzz`);

  const jsCourse =
    seededCourses.find((c) => c.slug === 'javascript') ??
    seededCourses.find((c) => c.slug.includes('javascript'));
  if (jsCourse) {
    const existingAttachment = await prisma.courseAttachment.findFirst({
      where: { courseId: jsCourse.id, fileName: 'js-cheatsheet.pdf' },
    });
    if (!existingAttachment) {
      await prisma.courseAttachment.create({
        data: {
          courseId: jsCourse.id,
          title: 'JavaScript cheatsheet',
          fileName: 'js-cheatsheet.pdf',
          fileUrl: 'https://kia.academy/assets/sample-js-cheatsheet.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 245_000,
          sortOrder: 0,
        },
      });
    }
  }

  const competitionStarts = new Date();
  const competitionEnds = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await prisma.competition.upsert({
    where: { slug: 'spring-code-sprint' },
    create: {
      slug: 'spring-code-sprint',
      title: 'Spring Code Sprint',
      description: 'A timed algorithm sprint for Kia learners. Register to compete on the public board.',
      startsAt: competitionStarts,
      endsAt: competitionEnds,
      active: true,
    },
    update: {
      title: 'Spring Code Sprint',
      description: 'A timed algorithm sprint for Kia learners. Register to compete on the public board.',
      endsAt: competitionEnds,
      active: true,
    },
  });

  const existingMessage = await prisma.learnerMessage.findFirst({
    where: { userId: user.id, subject: 'Welcome to your learner panel' },
  });
  if (!existingMessage) {
    await prisma.learnerMessage.create({
      data: {
        userId: user.id,
        subject: 'Welcome to your learner panel',
        body: 'Your dashboard now includes finance history, tickets, progress, and bootcamp events. Open each section from the sidebar.',
        createdBy: admin.id,
      },
    });
  }

  console.log('Seeded competition, course attachments, and learner welcome message');

  const defaults = createDefaultSiteSettings();
  await prisma.siteSetting.upsert({
    where: { key: 'site' },
    create: { key: 'site', value: JSON.stringify(defaults) },
    update: {
      // Keep evolving defaults in sync for local/dev seeds (pricing + payment + access template).
      value: JSON.stringify(defaults),
    },
  });
  console.log('Seeded site settings');

  const testBanks = [
    {
      id: 'personality',
      payload: {
        version: 1,
        citation: MINI_IPIP_CITATION,
        items: MINI_IPIP_ITEMS.map((item) => ({ ...item })),
      },
    },
    {
      id: 'assessment',
      payload: structuredClone(DEFAULT_ASSESSMENT_BANK),
    },
    {
      id: 'readiness',
      payload: { version: 1, questions: structuredClone(EXAM_QUESTION_BANK) },
    },
  ] as const;

  for (const bank of testBanks) {
    await prisma.testBank.upsert({
      where: { id: bank.id },
      create: { id: bank.id, payload: JSON.stringify(bank.payload) },
      update: { payload: JSON.stringify(bank.payload) },
    });
  }
  console.log('Seeded test banks: personality, assessment, readiness');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
