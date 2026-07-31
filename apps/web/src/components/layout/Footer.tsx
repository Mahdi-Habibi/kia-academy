'use client';

import Link from 'next/link';
import { BookOpen, ClipboardCheck, Map, Trophy } from 'lucide-react';
import { useLanguage } from '@/context/LanguageProvider';

export function Footer() {
  const { t } = useLanguage();
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div className="footer-main">
          <div className="footer-brand">
            <Link href="/dashboard" className="footer-logo" aria-label={t('nav.homeAria')}>
              <span className="footer-logo-mark" aria-hidden="true" />
              {t('common.brand')}
            </Link>
            <p>{t('nav.footer.blurb')}</p>
            <span className="footer-tagline">{t('nav.footer.tagline')}</span>
          </div>

          <nav className="footer-nav-group" aria-label={t('nav.footer.learning')}>
            <h2>{t('nav.footer.learning')}</h2>
            <Link href="/assessment">
              <Map size={15} aria-hidden="true" />
              {t('nav.footer.freeAssessment')}
            </Link>
            <Link href="/courses">
              <BookOpen size={15} aria-hidden="true" />
              {t('nav.footer.courseLibrary')}
            </Link>
            <Link href="/readiness">
              <ClipboardCheck size={15} aria-hidden="true" />
              {t('nav.footer.readinessTest')}
            </Link>
          </nav>

          <nav className="footer-nav-group" aria-label={t('nav.footer.explore')}>
            <h2>{t('nav.footer.explore')}</h2>
            <Link href="/dashboard">{t('nav.dashboard')}</Link>
            <Link href="/roadmap">{t('nav.footer.myRoadmap')}</Link>
            <Link href="/bootcamp">
              <Trophy size={15} aria-hidden="true" />
              {t('nav.footer.bootcampArena')}
            </Link>
          </nav>

          <nav className="footer-nav-group" aria-label={t('nav.footer.legal')}>
            <h2>{t('nav.footer.legal')}</h2>
            <Link href="/contact">{t('nav.footer.contact')}</Link>
            <Link href="/privacy">{t('nav.footer.privacy')}</Link>
            <Link href="/terms">{t('nav.footer.terms')}</Link>
          </nav>
        </div>

        <div className="footer-bottom">
          <span>{t('nav.footer.copyright', { year })}</span>
          <span className="footer-status">
            <i aria-hidden="true" />
            {t('nav.footer.status')}
          </span>
        </div>
      </div>
    </footer>
  );
}
