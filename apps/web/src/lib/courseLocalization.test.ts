import type { CourseSummary, LessonSummary } from '@kia-academy/shared';
import { describe, expect, it } from 'vitest';
import { localizeCourse, localizeLesson } from '@/lib/courseLocalization';

const sampleCourse: CourseSummary = {
  id: '1',
  slug: 'javascript-core',
  title: 'JavaScript Core',
  description: 'Learn variables, functions, arrays, and async patterns.',
  icon: '📘',
  trackKey: 'frontend',
  lessonCount: 3,
  enrolled: false,
  progressPct: 0,
};

const sampleLesson: LessonSummary = {
  id: 'l1',
  slug: 'variables-and-types',
  title: 'Variables and Types',
  durationMin: 12,
  completed: false,
};

describe('courseLocalization', () => {
  it('keeps English course and lesson content for en locale', () => {
    expect(localizeCourse(sampleCourse, 'en').title).toBe(sampleCourse.title);
    expect(localizeLesson(sampleLesson, 'javascript-core', 'en').title).toBe(sampleLesson.title);
  });

  it('applies Persian course and lesson titles for fa locale', () => {
    const course = localizeCourse(sampleCourse, 'fa');
    expect(course.title).toBe('مبانی جاوااسکریپت');
    expect(course.description).toContain('متغیرها');

    const lesson = localizeLesson(sampleLesson, 'javascript-core', 'fa');
    expect(lesson.title).toBe('متغیرها و نوع‌ها');
  });
});
