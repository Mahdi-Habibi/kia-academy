import type {
  AssessmentAnswers,
  AuthResponse,
  AuthTokens,
  AuthUser,
  ChallengeScoreResult,
  CheckoutDto,
  ContactFormDto,
  ContactFormResponse,
  CourseSummary,
  CreateChallengeDto,
  CreateCourseDto,
  CreateLessonDto,
  LearnerState,
  LessonDetail,
  LessonSummary,
  LoginDto,
  PaymentResponse,
  ExamAttemptSession,
  ExamResponse,
  ExamSubmitResult,
  MiniIpipAnswers,
  PersonalityResult,
  ReadinessResult,
  ReadinessScores,
  ReadinessTestSummary,
  RegisterDto,
  RoadmapResponse,
  SiteSettings,
  UpdateChallengeDto,
  UpdateCourseDto,
  UpdateLessonDto,
  UpdateSiteSettingsDto,
  UserRole,
  AdminStats,
  AdminCourse,
  AdminLesson,
  AdminChallenge,
  AdminContactMessage,
  AdminCreateUserDto,
  AdminUser,
  AdminPayment,
  SiteAdminAccessSettings,
  AssessmentBank,
  PersonalityBank,
  ReadinessBank,
  TestBankId,
  TestBankMeta,
  TestBankPayload,
} from '@kia-academy/shared';
import {
  buildRoadmapFromAnswers,
  computeReadinessResult,
  buildChallengeResult,
  createDefaultSiteSettings,
  mergeSiteSettings,
  DEFAULT_ASSESSMENT_BANK,
  MINI_IPIP_CITATION,
  MINI_IPIP_ITEMS,
  normalizeAdminAccess,
  EXAM_BLUEPRINT_VERSION,
  EXAM_DURATION_SEC,
  EXAM_QUESTION_BANK,
  buildExamOutcome,
  buildExamVerdict,
  gradeAttempt,
  scoreMiniIpip,
  toPublicExamQuestions,
} from '@kia-academy/shared';
import { ApiError } from '@/lib/apiError';
import { clearTokens, setAccessToken } from '@/lib/auth';

const DEMO_SESSION_KEY = 'kia-academy-demo-session';
const DEMO_STATE_KEY = 'kia-academy-demo-state';
const DEMO_SETTINGS_KEY = 'kia-academy-demo-settings';
const DEMO_TEST_BANKS_KEY = 'kia-academy-demo-test-banks';

const DEMO_LEARNER: AuthUser = {
  id: 'demo-learner',
  name: 'Alex R.',
  email: 'alex@kia.academy',
  phone: '09120000001',
  role: 'LEARNER',
  profileComplete: true,
};

const DEMO_ADMIN: AuthUser = {
  id: 'demo-admin',
  name: 'Kia Academy Super Admin',
  email: 'admin@kia.academy',
  phone: null,
  role: 'SUPER_ADMIN',
  profileComplete: true,
};

const DEMO_CREATED_AT = '2026-01-01T00:00:00.000Z';

let demoAdminUsers: AdminUser[] = [
  {
    id: DEMO_LEARNER.id,
    name: DEMO_LEARNER.name,
    email: DEMO_LEARNER.email,
    phone: DEMO_LEARNER.phone,
    role: DEMO_LEARNER.role,
    createdAt: DEMO_CREATED_AT,
  },
  {
    id: DEMO_ADMIN.id,
    name: DEMO_ADMIN.name,
    email: DEMO_ADMIN.email,
    phone: DEMO_ADMIN.phone,
    role: DEMO_ADMIN.role,
    createdAt: DEMO_CREATED_AT,
  },
];

interface DemoLesson {
  id: string;
  slug: string;
  title: string;
  durationMin: number;
  content: string;
  sortOrder: number;
  videoUrl: string | null;
}

interface DemoCourse {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon: string;
  trackKey: string | null;
  sortOrder: number;
  published: boolean;
  lessons: DemoLesson[];
}

interface DemoPersistedState {
  enrollments: string[];
  completedLessons: string[];
  hasRoadmap: boolean;
  roadmapEnrolled: boolean;
  readinessPaid: boolean;
  testCompleted: boolean;
  entitlements: string[];
  roadmapId: string | null;
  lastAnswers: AssessmentAnswers | null;
  payments: PaymentResponse[];
  examAttempt: {
    attemptId: string;
    startedAt: string;
    endsAt: string;
    answers: Record<string, ExamResponse>;
    status: 'IN_PROGRESS' | 'SUBMITTED' | 'EXPIRED';
    result?: ExamSubmitResult;
  } | null;
  personalityResult: PersonalityResult | null;
  roadmapModules: string[] | null;
  roadmapLevel: string | null;
}

function lessonKey(courseSlug: string, lessonSlug: string): string {
  return `${courseSlug}/${lessonSlug}`;
}

function defaultCourses(): DemoCourse[] {
  return [
    {
      id: 'course-js',
      slug: 'javascript-core',
      title: 'JavaScript Core',
      description:
        'Master variables, functions, arrays, and async patterns with hands-on markdown lessons.',
      icon: 'code',
      trackKey: 'web',
      sortOrder: 1,
      published: true,
      lessons: [
        {
          id: 'lesson-js-1',
          slug: 'variables-and-types',
          title: 'Variables & Types',
          durationMin: 12,
          videoUrl: null,
          sortOrder: 1,
          content: `# Variables & Types

Learn how JavaScript stores data with \`let\`, \`const\`, and primitive types.

## Key concepts
- \`const\` for values that should not be reassigned
- \`let\` for values that change over time
- typeof checks for runtime type inspection

## Practice
Declare a \`const\` for your name and a \`let\` counter starting at zero.`,
        },
        {
          id: 'lesson-js-2',
          slug: 'functions-and-scope',
          title: 'Functions & Scope',
          durationMin: 15,
          videoUrl: null,
          sortOrder: 2,
          content: `# Functions & Scope

Functions encapsulate logic. Scope determines where variables are visible.

## Key concepts
- Function declarations vs arrow functions
- Block scope with \`let\`/\`const\`
- Returning values from functions

## Practice
Write a function \`greet(name)\` that returns a greeting string.`,
        },
        {
          id: 'lesson-js-3',
          slug: 'async-await',
          title: 'Async/Await',
          durationMin: 18,
          videoUrl: null,
          sortOrder: 3,
          content: `# Async/Await

Modern JavaScript uses Promises and \`async/await\` for non-blocking I/O.

## Key concepts
- Promises represent future values
- \`async\` functions always return a Promise
- \`await\` pauses until a Promise settles

## Practice
Fetch JSON from an API and log the first item.`,
        },
      ],
    },
    {
      id: 'course-interview',
      slug: 'interview-branding',
      title: 'Interview & Personal Branding',
      description: 'Build a standout portfolio, resume, and interview story that gets you hired.',
      icon: 'briefcase',
      trackKey: 'web',
      sortOrder: 2,
      published: true,
      lessons: [
        {
          id: 'lesson-iv-1',
          slug: 'portfolio-story',
          title: 'Portfolio Story',
          durationMin: 14,
          videoUrl: null,
          sortOrder: 1,
          content: `# Portfolio Story

Your portfolio should tell a clear story: who you are, what you build, and why it matters.

## Checklist
- Hero section with role + value proposition
- 2–3 featured projects with outcomes
- Contact link and GitHub profile`,
        },
        {
          id: 'lesson-iv-2',
          slug: 'interview-framework',
          title: 'Interview Framework',
          durationMin: 16,
          videoUrl: null,
          sortOrder: 2,
          content: `# Interview Framework

Use STAR (Situation, Task, Action, Result) to answer behavioral questions.

## Tips
- Lead with impact, not tools
- Quantify results when possible
- Prepare 3 project deep-dives`,
        },
      ],
    },
  ];
}

let courses = defaultCourses();
let challenges: AdminChallenge[] = [
  {
    id: 'challenge-fizzbuzz',
    slug: 'fizzbuzz',
    title: 'FizzBuzz Sprint',
    description: 'Implement classic FizzBuzz and climb the bootcamp leaderboard.',
    points: 100,
    startsAt: new Date(Date.now() - 86400000).toISOString(),
    endsAt: new Date(Date.now() + 7 * 86400000).toISOString(),
    active: true,
    starterCode: 'function fizzbuzz(n) {\n  \n}',
  },
];

function readSession(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(DEMO_SESSION_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

function writeSession(user: AuthUser | null): void {
  if (typeof window === 'undefined') return;
  if (!user) {
    sessionStorage.removeItem(DEMO_SESSION_KEY);
    clearTokens();
    return;
  }
  sessionStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(user));
  setAccessToken('demo-access-token');
}

function defaultState(): DemoPersistedState {
  return {
    enrollments: ['javascript-core'],
    completedLessons: [],
    hasRoadmap: true,
    roadmapEnrolled: false,
    readinessPaid: false,
    testCompleted: false,
    entitlements: [],
    roadmapId: 'demo-roadmap',
    lastAnswers: {
      goal: 'job',
      interests: ['web'],
      skills: { html: 'Beginner', css: 'Beginner', js: 'Never used', python: 'Never used' },
      hours: 8,
      style: 'building',
      personality: { teamwork: 60, pace: 55 },
    },
    payments: [],
    examAttempt: null,
    personalityResult: null,
    roadmapModules: null,
    roadmapLevel: null,
  };
}

function readState(): DemoPersistedState {
  if (typeof window === 'undefined') return defaultState();
  try {
    const raw = localStorage.getItem(DEMO_STATE_KEY);
    if (!raw) return defaultState();
    return { ...defaultState(), ...(JSON.parse(raw) as DemoPersistedState) };
  } catch {
    return defaultState();
  }
}

function writeState(state: DemoPersistedState): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(DEMO_STATE_KEY, JSON.stringify(state));
}

function requireUser(): AuthUser {
  const user = readSession();
  if (!user) throw new ApiError('Unauthorized', 401);
  return user;
}

function learnerStateFor(user: AuthUser): LearnerState {
  const state = readState();
  return {
    user,
    hasRoadmap: state.hasRoadmap,
    roadmapEnrolled: state.roadmapEnrolled,
    readinessPaid: state.readinessPaid,
    testCompleted: state.testCompleted,
    profileComplete: user.profileComplete,
    entitlements: state.entitlements,
    enrollments: state.enrollments,
  };
}

function toCourseSummary(course: DemoCourse): CourseSummary {
  const state = readState();
  const enrolled = state.enrollments.includes(course.slug);
  const completed = course.lessons.filter((l) =>
    state.completedLessons.includes(lessonKey(course.slug, l.slug)),
  ).length;
  const progressPct =
    course.lessons.length === 0 ? 0 : Math.round((completed / course.lessons.length) * 100);
  return {
    id: course.id,
    slug: course.slug,
    title: course.title,
    description: course.description,
    icon: course.icon,
    trackKey: course.trackKey,
    lessonCount: course.lessons.length,
    enrolled,
    progressPct,
  };
}

function delay<T>(value: T, ms = 80): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(value), ms);
  });
}

function authResponse(user: AuthUser): AuthResponse {
  writeSession(user);
  return { user, accessToken: 'demo-access-token', expiresIn: 3600 };
}

export const demoApi = {
  async register(dto: RegisterDto): Promise<AuthResponse> {
    return delay(
      authResponse({
        id: `demo-${Date.now()}`,
        name: dto.name,
        email: dto.email,
        phone: null,
        role: 'LEARNER',
        profileComplete: true,
      }),
    );
  },

  async login(dto: LoginDto): Promise<AuthResponse> {
    const email = dto.email.trim().toLowerCase();
    const adminEmail = (DEMO_ADMIN.email ?? '').toLowerCase();
    const learnerEmail = (DEMO_LEARNER.email ?? '').toLowerCase();
    if (email === adminEmail) {
      return delay(authResponse(DEMO_ADMIN));
    }
    if (email === learnerEmail || email.includes('@')) {
      return delay(
        authResponse({
          ...DEMO_LEARNER,
          email: dto.email,
          name: email === learnerEmail ? DEMO_LEARNER.name : dto.email.split('@')[0],
        }),
      );
    }
    throw new ApiError('Invalid credentials', 401);
  },

  async requestOtp(dto: { phone: string }): Promise<{ phone: string; expiresInSeconds: number; devCode?: string }> {
    const phone = dto.phone;
    return delay({ phone, expiresInSeconds: 300, devCode: '123456' });
  },

  async verifyOtp(dto: { phone: string; code: string }): Promise<AuthResponse> {
    if (dto.code !== '123456') throw new ApiError('Invalid verification code', 401);
    return delay(
      authResponse({
        id: `demo-phone-${dto.phone}`,
        name: '',
        email: null,
        phone: dto.phone,
        role: 'LEARNER',
        profileComplete: false,
      }),
    );
  },

  async completeProfile(dto: {
    firstName: string;
    lastName: string;
    city: string;
    email: string;
  }): Promise<AuthResponse> {
    const user = requireUser();
    const next: AuthUser = {
      ...user,
      name: `${dto.firstName} ${dto.lastName}`.trim(),
      email: dto.email,
      profileComplete: true,
    };
    return delay(authResponse(next));
  },

  async logout(): Promise<void> {
    writeSession(null);
    await delay(undefined);
  },

  async refresh(): Promise<AuthTokens> {
    const user = readSession();
    if (!user) throw new ApiError('Unauthorized', 401);
    setAccessToken('demo-access-token');
    return delay({ accessToken: 'demo-access-token', expiresIn: 3600 });
  },

  async me(): Promise<LearnerState> {
    return delay(learnerStateFor(requireUser()));
  },

  async checkout(dto: CheckoutDto): Promise<PaymentResponse> {
    requireUser();
    const state = readState();
    const settings = readDemoSettings();
    let amountCents = 0;
    if (dto.productType === 'COURSE') amountCents = settings.pricing.courseCents;
    else if (dto.productType === 'ROADMAP_BUNDLE') {
      const answers = state.lastAnswers ?? defaultState().lastAnswers!;
      const roadmap = buildRoadmapFromAnswers(answers, false, 'local', {
        tracks: settings.tracks,
        pricing: settings.pricing,
      });
      amountCents = roadmap.pricing.discounted;
    }
    const payment: PaymentResponse = {
      id: `pay-${Date.now()}`,
      productType: dto.productType,
      amountCents,
      currency: 'irr',
      status: 'COMPLETED',
    };
    state.payments = [payment, ...state.payments];
    if (dto.productType === 'ROADMAP_BUNDLE') {
      state.roadmapEnrolled = true;
      state.hasRoadmap = true;
    }
    writeState(state);
    return delay(payment);
  },

  async confirmPayment(id: string): Promise<PaymentResponse> {
    requireUser();
    const found = readState().payments.find((p) => p.id === id);
    if (!found) throw new ApiError('Payment not found', 404);
    return delay({ ...found, status: 'COMPLETED' });
  },

  async getPayment(id: string): Promise<PaymentResponse> {
    requireUser();
    const mine = await this.myPayments();
    const found = mine.find((p) => p.id === id);
    if (!found) throw new ApiError('Payment not found', 404);
    return delay(found);
  },

  async myPayments(): Promise<PaymentResponse[]> {
    requireUser();
    return delay(readState().payments);
  },

  async listCourses(): Promise<CourseSummary[]> {
    return delay(courses.filter((c) => c.published).map(toCourseSummary));
  },

  async getCourse(slug: string): Promise<CourseSummary & { lessons: LessonSummary[] }> {
    const course = courses.find((c) => c.slug === slug);
    if (!course) throw new ApiError('Course not found', 404);
    const state = readState();
    const lessons: LessonSummary[] = course.lessons.map((l) => ({
      id: l.id,
      slug: l.slug,
      title: l.title,
      durationMin: l.durationMin,
      completed: state.completedLessons.includes(lessonKey(slug, l.slug)),
      hasVideo: Boolean(l.videoUrl),
    }));
    return delay({ ...toCourseSummary(course), lessons });
  },

  async getLesson(courseSlug: string, lessonSlug: string): Promise<LessonDetail> {
    const course = courses.find((c) => c.slug === courseSlug);
    if (!course) throw new ApiError('Course not found', 404);
    const index = course.lessons.findIndex((l) => l.slug === lessonSlug);
    if (index < 0) throw new ApiError('Lesson not found', 404);
    const lesson = course.lessons[index];
    const state = readState();
    return delay({
      id: lesson.id,
      slug: lesson.slug,
      title: lesson.title,
      durationMin: lesson.durationMin,
      completed: state.completedLessons.includes(lessonKey(courseSlug, lessonSlug)),
      hasVideo: Boolean(lesson.videoUrl),
      content: lesson.content,
      videoUrl: lesson.videoUrl,
      courseSlug,
      courseTitle: course.title,
      prevSlug: index > 0 ? course.lessons[index - 1].slug : null,
      nextSlug: index < course.lessons.length - 1 ? course.lessons[index + 1].slug : null,
    });
  },

  async enrollCourse(slug: string): Promise<void> {
    requireUser();
    const course = courses.find((c) => c.slug === slug);
    if (!course) throw new ApiError('Course not found', 404);
    const state = readState();
    if (!state.enrollments.includes(slug)) {
      state.enrollments = [...state.enrollments, slug];
      writeState(state);
    }
    await delay(undefined);
  },

  async completeLesson(courseSlug: string, lessonSlug: string): Promise<void> {
    requireUser();
    const key = lessonKey(courseSlug, lessonSlug);
    const state = readState();
    if (!state.completedLessons.includes(key)) {
      state.completedLessons = [...state.completedLessons, key];
      writeState(state);
    }
    await delay(undefined);
  },

  async submitPersonality(answers: MiniIpipAnswers): Promise<PersonalityResult> {
    requireUser();
    const bank = readDemoTestBank('personality').bank as PersonalityBank;
    const scored = scoreMiniIpip(answers, {
      id: `personality-${Date.now()}`,
      createdAt: new Date().toISOString(),
      items: bank.items,
    });
    const state = readState();
    state.personalityResult = { ...scored, citation: bank.citation };
    writeState(state);
    return delay(state.personalityResult);
  },

  async latestPersonality(): Promise<PersonalityResult | null> {
    requireUser();
    return delay(readState().personalityResult);
  },

  async saveRoadmap(answers: AssessmentAnswers): Promise<RoadmapResponse> {
    requireUser();
    const state = readState();
    state.lastAnswers = answers;
    state.hasRoadmap = true;
    state.roadmapId = `roadmap-${Date.now()}`;
    writeState(state);
    const settings = readDemoSettings();
    return delay(
      buildRoadmapFromAnswers(answers, state.roadmapEnrolled, state.roadmapId, {
        tracks: settings.tracks,
        pricing: settings.pricing,
      }),
    );
  },

  async getRoadmap(id: string): Promise<RoadmapResponse> {
    requireUser();
    const state = readState();
    const answers = state.lastAnswers ?? defaultState().lastAnswers!;
    const settings = readDemoSettings();
    return delay(
      buildRoadmapFromAnswers(answers, state.roadmapEnrolled, id, {
        tracks: settings.tracks,
        pricing: settings.pricing,
      }),
    );
  },

  async enrollRoadmap(roadmapId: string): Promise<RoadmapResponse> {
    requireUser();
    const state = readState();
    state.roadmapEnrolled = true;
    state.hasRoadmap = true;
    state.roadmapId = roadmapId;
    writeState(state);
    const answers = state.lastAnswers ?? defaultState().lastAnswers!;
    const settings = readDemoSettings();
    return delay(
      buildRoadmapFromAnswers(answers, true, roadmapId, {
        tracks: settings.tracks,
        pricing: settings.pricing,
      }),
    );
  },

  async startExam(roadmapId?: string): Promise<ExamAttemptSession> {
    requireUser();
    const state = readState();
    const now = Date.now();
    const bankQuestions = (readDemoTestBank('readiness').bank as ReadinessBank).questions;
    if (
      state.examAttempt &&
      state.examAttempt.status === 'IN_PROGRESS' &&
      new Date(state.examAttempt.endsAt).getTime() > now
    ) {
      return delay({
        attemptId: state.examAttempt.attemptId,
        blueprintVersion: EXAM_BLUEPRINT_VERSION,
        durationSec: EXAM_DURATION_SEC,
        startedAt: state.examAttempt.startedAt,
        endsAt: state.examAttempt.endsAt,
        roadmapId: roadmapId ?? state.roadmapId,
        questions: toPublicExamQuestions(bankQuestions),
        savedAnswers: state.examAttempt.answers,
        status: 'IN_PROGRESS',
      });
    }

    const startedAt = new Date();
    const endsAt = new Date(startedAt.getTime() + EXAM_DURATION_SEC * 1000);
    const attemptId = `demo-exam-${startedAt.getTime()}`;
    state.examAttempt = {
      attemptId,
      startedAt: startedAt.toISOString(),
      endsAt: endsAt.toISOString(),
      answers: {},
      status: 'IN_PROGRESS',
    };
    writeState(state);

    return delay({
      attemptId,
      blueprintVersion: EXAM_BLUEPRINT_VERSION,
      durationSec: EXAM_DURATION_SEC,
      startedAt: startedAt.toISOString(),
      endsAt: endsAt.toISOString(),
      roadmapId: roadmapId ?? state.roadmapId,
      questions: toPublicExamQuestions(bankQuestions),
      savedAnswers: {},
      status: 'IN_PROGRESS',
    });
  },

  async saveExamAnswers(
    attemptId: string,
    answers: Record<string, ExamResponse>,
  ): Promise<{ ok: true; remainingSec: number }> {
    requireUser();
    const state = readState();
    if (!state.examAttempt || state.examAttempt.attemptId !== attemptId) {
      throw new ApiError('Exam attempt not found', 404);
    }
    state.examAttempt.answers = { ...state.examAttempt.answers, ...answers };
    writeState(state);
    const remainingSec = Math.max(
      0,
      Math.floor((new Date(state.examAttempt.endsAt).getTime() - Date.now()) / 1000),
    );
    return delay({ ok: true, remainingSec });
  },

  async submitExam(
    attemptId: string,
    answers?: Record<string, ExamResponse>,
  ): Promise<ExamSubmitResult> {
    requireUser();
    const state = readState();
    if (!state.examAttempt || state.examAttempt.attemptId !== attemptId) {
      throw new ApiError('Exam attempt not found', 404);
    }
    if (state.examAttempt.result) {
      return delay(state.examAttempt.result);
    }

    const merged = { ...state.examAttempt.answers, ...(answers ?? {}) };
    const bankQuestions = (readDemoTestBank('readiness').bank as ReadinessBank).questions;
    const graded = gradeAttempt(bankQuestions, merged);
    const modules =
      state.roadmapModules ??
      buildRoadmapFromAnswers(
        state.lastAnswers ?? defaultState().lastAnswers!,
        true,
        state.roadmapId ?? 'demo-roadmap',
      ).modules;
    const level = state.roadmapLevel ?? 'absoluteBeginner';
    const outcome = buildExamOutcome({
      passed: graded.passed,
      average: graded.average,
      percentages: graded.percentages,
      roadmap: {
        id: state.roadmapId ?? 'demo-roadmap',
        modules,
        level,
      },
    });
    state.roadmapModules = outcome.roadmapModules;
    state.roadmapLevel = outcome.levelAfter || level;
    const verdict = buildExamVerdict({
      passed: graded.passed,
      average: graded.average,
      outcome,
    });
    const result: ExamSubmitResult = {
      attemptId,
      average: graded.average,
      passed: graded.passed,
      domainScores: graded.domainScores,
      percentages: graded.percentages,
      outcome,
      verdict,
      submittedAt: new Date().toISOString(),
    };
    state.examAttempt = {
      ...state.examAttempt,
      answers: merged,
      status: 'SUBMITTED',
      result,
    };
    state.testCompleted = true;
    writeState(state);
    return delay(result);
  },

  async getExamAttempt(
    attemptId: string,
  ): Promise<ExamAttemptSession | ExamSubmitResult> {
    requireUser();
    const state = readState();
    if (!state.examAttempt || state.examAttempt.attemptId !== attemptId) {
      throw new ApiError('Exam attempt not found', 404);
    }
    if (state.examAttempt.result) return delay(state.examAttempt.result);
    return delay({
      attemptId,
      blueprintVersion: EXAM_BLUEPRINT_VERSION,
      durationSec: EXAM_DURATION_SEC,
      startedAt: state.examAttempt.startedAt,
      endsAt: state.examAttempt.endsAt,
      roadmapId: state.roadmapId,
      questions: toPublicExamQuestions(
        (readDemoTestBank('readiness').bank as ReadinessBank).questions,
      ),
      savedAnswers: state.examAttempt.answers,
      status: state.examAttempt.status,
    });
  },

  async saveReadinessTest(scores: ReadinessScores): Promise<ReadinessResult> {
    requireUser();
    const state = readState();
    // Preparations (readiness) test is free after the first assessment.
    const settings = readDemoSettings();
    const result = computeReadinessResult(scores, settings.readiness);
    state.testCompleted = true;
    writeState(state);
    return delay(result);
  },

  async listReadinessTests(): Promise<ReadinessTestSummary[]> {
    requireUser();
    const state = readState();
    if (!state.testCompleted) return delay([]);
    return delay([
      {
        id: state.examAttempt?.attemptId ?? 'demo-readiness',
        createdAt: new Date().toISOString(),
        average: state.examAttempt?.result?.average ?? 72,
        passed: state.examAttempt?.result?.passed ?? true,
      },
    ]);
  },

  async getReadinessTest(id: string): Promise<
    ReadinessResult & { id: string; createdAt: string; outcome?: ExamSubmitResult['outcome'] }
  > {
    requireUser();
    const state = readState();
    if (!state.testCompleted) throw new ApiError('Test not found', 404);
    if (state.examAttempt?.result) {
      const result = state.examAttempt.result;
      return delay({
        id,
        createdAt: result.submittedAt,
        percentages: result.percentages,
        average: result.average,
        passed: result.passed,
        verdict: {
          icon: result.verdict.icon,
          title: result.verdict.title.en,
          message: result.verdict.message.en,
          unlockTitle: result.verdict.unlockTitle.en,
          unlockSub: result.verdict.unlockSub.en,
          variant: result.verdict.variant,
        },
        outcome: result.outcome,
      });
    }
    const settings = readDemoSettings();
    const result = computeReadinessResult({}, settings.readiness);
    return delay({
      id,
      createdAt: new Date().toISOString(),
      ...result,
    });
  },

  async submitContactForm(_dto: ContactFormDto): Promise<ContactFormResponse> {
    return delay({ ok: true, message: 'Message received' });
  },

  async submitChallenge(code: string): Promise<ChallengeScoreResult> {
    requireUser();
    const settings = readDemoSettings();
    return delay(buildChallengeResult(code, settings.bootcamp));
  },

  async adminStats(): Promise<AdminStats> {
    requireUser();
    const state = readState();
    return delay({
      users: 2,
      courses: courses.length,
      lessons: courses.reduce((n, c) => n + c.lessons.length, 0),
      enrollments: state.enrollments.length,
      payments: state.payments.length,
      revenueCents: state.payments.reduce((n, p) => n + p.amountCents, 0),
      challenges: challenges.length,
      activeChallenges: challenges.filter((c) => c.active).length,
    });
  },

  async adminListCourses(): Promise<AdminCourse[]> {
    requireUser();
    return delay(
      courses.map((c) => ({
        id: c.id,
        slug: c.slug,
        title: c.title,
        description: c.description,
        icon: c.icon,
        trackKey: c.trackKey,
        sortOrder: c.sortOrder,
        published: c.published,
        lessonCount: c.lessons.length,
        lessons: c.lessons.map(
          (l): AdminLesson => ({
            id: l.id,
            slug: l.slug,
            title: l.title,
            content: l.content,
            videoUrl: l.videoUrl,
            durationMin: l.durationMin,
            sortOrder: l.sortOrder,
          }),
        ),
      })),
    );
  },

  async adminCreateCourse(dto: CreateCourseDto): Promise<AdminCourse> {
    requireUser();
    const course: DemoCourse = {
      id: `course-${Date.now()}`,
      slug: dto.slug,
      title: dto.title,
      description: dto.description,
      icon: dto.icon ?? '📘',
      trackKey: dto.trackKey ?? null,
      sortOrder: dto.sortOrder ?? courses.length + 1,
      published: dto.published ?? true,
      lessons: (dto.lessons ?? []).map((l, i) => ({
        id: `lesson-${Date.now()}-${i}`,
        slug: l.slug,
        title: l.title,
        content: l.content,
        durationMin: l.durationMin ?? 10,
        sortOrder: l.sortOrder ?? i + 1,
        videoUrl: null,
      })),
    };
    courses = [...courses, course];
    return delay({
      id: course.id,
      slug: course.slug,
      title: course.title,
      description: course.description,
      icon: course.icon,
      trackKey: course.trackKey,
      sortOrder: course.sortOrder,
      published: course.published,
      lessonCount: course.lessons.length,
      lessons: course.lessons,
    });
  },

  async adminUpdateCourse(slug: string, dto: UpdateCourseDto): Promise<AdminCourse> {
    requireUser();
    const index = courses.findIndex((c) => c.slug === slug);
    if (index < 0) throw new ApiError('Course not found', 404);
    const current = courses[index];
    const updated: DemoCourse = {
      ...current,
      ...dto,
      trackKey: dto.trackKey === undefined ? current.trackKey : dto.trackKey,
      lessons: current.lessons,
    };
    courses = courses.map((c, i) => (i === index ? updated : c));
    return delay({
      id: updated.id,
      slug: updated.slug,
      title: updated.title,
      description: updated.description,
      icon: updated.icon,
      trackKey: updated.trackKey,
      sortOrder: updated.sortOrder,
      published: updated.published,
      lessonCount: updated.lessons.length,
      lessons: updated.lessons,
    });
  },

  async adminDeleteCourse(slug: string): Promise<void> {
    requireUser();
    courses = courses.filter((c) => c.slug !== slug);
    await delay(undefined);
  },

  async adminCreateLesson(courseSlug: string, dto: CreateLessonDto): Promise<AdminLesson> {
    requireUser();
    const course = courses.find((c) => c.slug === courseSlug);
    if (!course) throw new ApiError('Course not found', 404);
    const lesson: DemoLesson = {
      id: `lesson-${Date.now()}`,
      slug: dto.slug,
      title: dto.title,
      content: dto.content,
      durationMin: dto.durationMin ?? 10,
      sortOrder: dto.sortOrder ?? course.lessons.length + 1,
      videoUrl: null,
    };
    course.lessons = [...course.lessons, lesson];
    return delay(lesson);
  },

  async adminUpdateLesson(
    courseSlug: string,
    lessonSlug: string,
    dto: UpdateLessonDto,
  ): Promise<AdminLesson> {
    requireUser();
    const course = courses.find((c) => c.slug === courseSlug);
    if (!course) throw new ApiError('Course not found', 404);
    const index = course.lessons.findIndex((l) => l.slug === lessonSlug);
    if (index < 0) throw new ApiError('Lesson not found', 404);
    const current = course.lessons[index];
    if (dto.slug && dto.slug !== lessonSlug && course.lessons.some((l) => l.slug === dto.slug)) {
      throw new ApiError('Lesson slug already exists', 409);
    }
    const updated: DemoLesson = { ...current, ...dto };
    course.lessons = course.lessons.map((l, i) => (i === index ? updated : l));
    return delay(updated);
  },

  async adminDeleteLesson(courseSlug: string, lessonSlug: string): Promise<void> {
    requireUser();
    const course = courses.find((c) => c.slug === courseSlug);
    if (!course) throw new ApiError('Course not found', 404);
    course.lessons = course.lessons.filter((l) => l.slug !== lessonSlug);
    await delay(undefined);
  },

  async adminUploadLessonVideo(
    courseSlug: string,
    lessonSlug: string,
    file: File,
  ): Promise<AdminLesson> {
    requireUser();
    const course = courses.find((c) => c.slug === courseSlug);
    if (!course) throw new ApiError('Course not found', 404);
    const index = course.lessons.findIndex((l) => l.slug === lessonSlug);
    if (index < 0) throw new ApiError('Lesson not found', 404);
    const videoUrl = await fileToDataUrl(file);
    const updated = { ...course.lessons[index], videoUrl };
    course.lessons = course.lessons.map((l, i) => (i === index ? updated : l));
    return delay(updated);
  },

  async adminDeleteLessonVideo(courseSlug: string, lessonSlug: string): Promise<AdminLesson> {
    requireUser();
    const course = courses.find((c) => c.slug === courseSlug);
    if (!course) throw new ApiError('Course not found', 404);
    const index = course.lessons.findIndex((l) => l.slug === lessonSlug);
    if (index < 0) throw new ApiError('Lesson not found', 404);
    const updated = { ...course.lessons[index], videoUrl: null };
    course.lessons = course.lessons.map((l, i) => (i === index ? updated : l));
    return delay(updated);
  },

  async adminListChallenges(): Promise<AdminChallenge[]> {
    requireUser();
    return delay(challenges);
  },

  async adminCreateChallenge(dto: CreateChallengeDto): Promise<AdminChallenge> {
    requireUser();
    const challenge: AdminChallenge = {
      id: `challenge-${Date.now()}`,
      slug: dto.slug,
      title: dto.title,
      description: dto.description,
      points: dto.points ?? 50,
      startsAt: dto.startsAt,
      endsAt: dto.endsAt,
      active: dto.active ?? true,
      starterCode: dto.starterCode ?? '',
    };
    challenges = [...challenges, challenge];
    return delay(challenge);
  },

  async adminUpdateChallenge(slug: string, dto: UpdateChallengeDto): Promise<AdminChallenge> {
    requireUser();
    const index = challenges.findIndex((c) => c.slug === slug);
    if (index < 0) throw new ApiError('Challenge not found', 404);
    const updated = { ...challenges[index], ...dto };
    challenges = challenges.map((c, i) => (i === index ? updated : c));
    return delay(updated);
  },

  async adminDeleteChallenge(slug: string): Promise<void> {
    requireUser();
    challenges = challenges.filter((c) => c.slug !== slug);
    await delay(undefined);
  },

  async adminListUsers(): Promise<AdminUser[]> {
    requireUser();
    return delay(demoAdminUsers.map((u) => ({ ...u })));
  },

  async adminCreateUser(dto: AdminCreateUserDto): Promise<AdminUser> {
    requireUser();
    const email = dto.email.trim().toLowerCase();
    if (!email.includes('@')) throw new ApiError('Invalid email', 400);
    if (!dto.password || dto.password.length < 8) {
      throw new ApiError('Password must be at least 8 characters', 400);
    }
    if (demoAdminUsers.some((u) => (u.email ?? '').toLowerCase() === email)) {
      throw new ApiError('Email already registered', 409);
    }
    const phone = dto.phone?.trim() || null;
    if (phone && demoAdminUsers.some((u) => u.phone === phone)) {
      throw new ApiError('Phone already registered', 409);
    }
    const role = dto.role ?? 'LEARNER';
    const created: AdminUser = {
      id: `demo-user-${Date.now()}`,
      name: dto.name.trim(),
      email,
      phone,
      role,
      createdAt: new Date().toISOString(),
      adminPanelAccess:
        role === 'ADMIN'
          ? normalizeAdminAccess(readDemoSettings().adminAccess)
          : null,
    };
    demoAdminUsers = [created, ...demoAdminUsers];
    return delay({ ...created });
  },

  async adminListPayments(): Promise<AdminPayment[]> {
    requireUser();
    const state = readState();
    if (state.payments.length === 0) {
      state.payments = [
        {
          id: 'demo-pay-1',
          productType: 'ROADMAP_BUNDLE',
          amountCents: 2_490_000,
          currency: 'irr',
          status: 'COMPLETED',
        },
      ];
      writeState(state);
    }
    const user = DEMO_LEARNER;
    return delay(
      state.payments.map((p) => ({
        id: p.id,
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        productType: p.productType,
        productRef: null,
        amountCents: p.amountCents,
        currency: p.currency,
        status: p.status,
        createdAt: DEMO_CREATED_AT,
      })),
    );
  },

  async adminUpdateUserRole(userId: string, role: UserRole): Promise<AdminUser> {
    requireUser();
    const index = demoAdminUsers.findIndex((u) => u.id === userId);
    if (index < 0) throw new ApiError('User not found', 404);
    const updated: AdminUser = {
      ...demoAdminUsers[index],
      role,
      adminPanelAccess:
        role === 'ADMIN'
          ? demoAdminUsers[index].adminPanelAccess ??
            normalizeAdminAccess(readDemoSettings().adminAccess)
          : null,
    };
    demoAdminUsers = demoAdminUsers.map((u, i) => (i === index ? updated : u));
    return delay({ ...updated });
  },

  async adminUpdateUserAccess(
    userId: string,
    adminPanelAccess: SiteAdminAccessSettings,
  ): Promise<AdminUser> {
    requireUser();
    const index = demoAdminUsers.findIndex((u) => u.id === userId);
    if (index < 0) throw new ApiError('User not found', 404);
    const updated: AdminUser = {
      ...demoAdminUsers[index],
      role: 'ADMIN',
      adminPanelAccess: normalizeAdminAccess(adminPanelAccess),
    };
    demoAdminUsers = demoAdminUsers.map((u, i) => (i === index ? updated : u));
    return delay({ ...updated });
  },

  async adminListContactMessages(): Promise<AdminContactMessage[]> {
    requireUser();
    return delay([]);
  },

  async adminMarkContactRead(id: string): Promise<AdminContactMessage> {
    requireUser();
    return delay({
      id,
      name: 'Demo',
      email: 'demo@kia.academy',
      subject: 'Demo message',
      message: 'Demo',
      readAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });
  },

  async getSettings(): Promise<SiteSettings> {
    return delay(readDemoSettings());
  },

  async adminGetSettings(): Promise<SiteSettings> {
    requireUser();
    return delay(readDemoSettings());
  },

  async adminUpdateSettings(dto: UpdateSiteSettingsDto): Promise<SiteSettings> {
    requireUser();
    const next = mergeSiteSettings(readDemoSettings(), dto);
    writeDemoSettings(next);
    return delay(next);
  },

  async getPersonalityBank(): Promise<PersonalityBank> {
    return delay(readDemoTestBank('personality').bank as PersonalityBank);
  },

  async getAssessmentBank(): Promise<AssessmentBank> {
    return delay(readDemoTestBank('assessment').bank as AssessmentBank);
  },

  async adminListTestBanks(): Promise<TestBankMeta[]> {
    requireUser();
    return delay(
      (['personality', 'assessment', 'readiness'] as TestBankId[]).map((id) => {
        const payload = readDemoTestBank(id);
        const count =
          id === 'personality'
            ? (payload.bank as PersonalityBank).items.length
            : id === 'assessment'
              ? (payload.bank as AssessmentBank).questions.length
              : (payload.bank as ReadinessBank).questions.length;
        return { id, updatedAt: new Date().toISOString(), questionCount: count };
      }),
    );
  },

  async adminGetTestBank(id: TestBankId): Promise<TestBankPayload> {
    requireUser();
    return delay(readDemoTestBank(id));
  },

  async adminSaveTestBank(id: TestBankId, bank: unknown): Promise<TestBankPayload> {
    requireUser();
    const payload = { id, bank } as TestBankPayload;
    writeDemoTestBank(payload);
    return delay(payload);
  },

  async adminResetTestBank(id: TestBankId): Promise<TestBankPayload> {
    requireUser();
    const payload = defaultDemoTestBank(id);
    writeDemoTestBank(payload);
    return delay(payload);
  },
};

function defaultDemoTestBank(id: TestBankId): TestBankPayload {
  if (id === 'personality') {
    return {
      id,
      bank: {
        version: 1,
        citation: MINI_IPIP_CITATION,
        items: MINI_IPIP_ITEMS.map((item) => ({ ...item })),
      },
    };
  }
  if (id === 'assessment') {
    return { id, bank: structuredClone(DEFAULT_ASSESSMENT_BANK) };
  }
  return {
    id,
    bank: { version: 1, questions: structuredClone(EXAM_QUESTION_BANK) },
  };
}

function readDemoTestBank(id: TestBankId): TestBankPayload {
  if (typeof window === 'undefined') return defaultDemoTestBank(id);
  try {
    const raw = localStorage.getItem(DEMO_TEST_BANKS_KEY);
    if (!raw) return defaultDemoTestBank(id);
    const all = JSON.parse(raw) as Partial<Record<TestBankId, TestBankPayload>>;
    return all[id] ?? defaultDemoTestBank(id);
  } catch {
    return defaultDemoTestBank(id);
  }
}

function writeDemoTestBank(payload: TestBankPayload): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(DEMO_TEST_BANKS_KEY);
    const all = raw
      ? (JSON.parse(raw) as Partial<Record<TestBankId, TestBankPayload>>)
      : {};
    all[payload.id] = payload;
    localStorage.setItem(DEMO_TEST_BANKS_KEY, JSON.stringify(all));
  } catch {
    /* ignore */
  }
}

function readDemoSettings(): SiteSettings {
  if (typeof window === 'undefined') return createDefaultSiteSettings();
  try {
    const raw = localStorage.getItem(DEMO_SETTINGS_KEY);
    if (!raw) return createDefaultSiteSettings();
    return mergeSiteSettings(createDefaultSiteSettings(), JSON.parse(raw) as SiteSettings);
  } catch {
    return createDefaultSiteSettings();
  }
}

function writeDemoSettings(settings: SiteSettings): void {
  if (typeof window === 'undefined') return;
  // Never persist payment secrets in browser storage (demo/Pages only).
  const sanitized: SiteSettings = {
    ...settings,
    payment: {
      ...settings.payment,
      apiKey: '',
    },
  };
  localStorage.setItem(DEMO_SETTINGS_KEY, JSON.stringify(sanitized));
}


function fileToDataUrl(file: File): Promise<string> {
  const maxBytes = 25 * 1024 * 1024;
  if (file.size > maxBytes) {
    return Promise.reject(new ApiError('Demo mode supports videos up to 25 MB', 400));
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new ApiError('Failed to read video file', 400));
    reader.readAsDataURL(file);
  });
}

/** Ensure a signed-in demo session exists for browsing the full static site. */
export function ensureDemoSession(): AuthUser {
  const existing = readSession();
  if (existing) return existing;
  writeSession(DEMO_LEARNER);
  return DEMO_LEARNER;
}
