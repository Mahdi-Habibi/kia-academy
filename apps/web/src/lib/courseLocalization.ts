import type { CourseSummary, LessonSummary } from '@kia-academy/shared';
import type { Locale } from '@/i18n/locales';

type LocalizedCourse = {
  title: string;
  description: string;
  lessons: Record<string, string>;
};

const persianCourses: Record<string, LocalizedCourse> = {
  'javascript-core': {
    title: 'مبانی جاوااسکریپت',
    description: 'متغیرها، توابع، آرایه‌ها و الگوهای async را با درس‌های عملی یاد بگیرید.',
    lessons: {
      'variables-and-types': 'متغیرها و نوع‌ها',
      'functions-and-scope': 'توابع و حوزهٔ دسترسی',
      'async-await': 'Async/Await',
    },
  },
  'interview-branding': {
    title: 'مصاحبه و برندسازی شخصی',
    description: 'یک رزومه، نمونه‌کار و روایت مصاحبهٔ اثرگذار بسازید.',
    lessons: {
      'portfolio-story': 'داستان نمونه‌کار',
      'interview-framework': 'چارچوب مصاحبه',
    },
  },
};

export function localizeCourse<T extends CourseSummary>(course: T, locale: Locale): T {
  if (locale !== 'fa') return course;
  const translation = persianCourses[course.slug];
  return translation ? { ...course, title: translation.title, description: translation.description } : course;
}

export function localizeLesson<T extends LessonSummary>(
  lesson: T,
  courseSlug: string,
  locale: Locale,
): T {
  if (locale !== 'fa') return lesson;
  const title = persianCourses[courseSlug]?.lessons[lesson.slug];
  return title ? { ...lesson, title } : lesson;
}
