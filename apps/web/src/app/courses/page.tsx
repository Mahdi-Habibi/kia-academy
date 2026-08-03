'use client';

import type { CourseSummary } from '@kia-academy/shared';
import { BookOpen, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PageBackButton } from '@/components/layout/PageBackButton';
import { useLanguage } from '@/context/LanguageProvider';
import { api, ApiError } from '@/lib/api';
import { PublicCoursesPage } from './public-page';

function EmptyCoursesMessage() {
  const { t } = useLanguage();
  const text = t('courses.empty');
  const linkWord = t('courses.emptyAssessmentLink');
  const idx = text.toLowerCase().indexOf(linkWord.toLowerCase());

  if (idx === -1) {
    return (
      <p className="auth-sub">
        {text} <Link href="/assessment">{linkWord}</Link>
      </p>
    );
  }

  return (
    <p className="auth-sub">
      {text.slice(0, idx)}
      <Link href="/assessment">{text.slice(idx, idx + linkWord.length)}</Link>
      {text.slice(idx + linkWord.length)}
    </p>
  );
}

export default function CoursesPage() {
  return <PublicCoursesPage />;
}
