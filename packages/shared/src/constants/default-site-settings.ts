import type { SiteSettings } from '../types/site-settings';
import {
  createSectionPermission,
  normalizeAdminAccess,
  normalizePaymentSettings,
} from '../types/site-settings';
import { MODULE_PRICES, TRACKS } from './tracks';
import { PRODUCT_PRICES } from '../types/payment';

const TRACK_ICONS: Record<string, string> = {
  web: '🌐',
  ai: '🤖',
  mobile: '📱',
  game: '🎮',
  data: '📊',
  backend: '🛠️',
};

const TRACK_DESCRIPTIONS: Record<string, string> = {
  web: 'Build websites and interactive UIs',
  ai: 'Machine learning and intelligent systems',
  mobile: 'iOS and Android apps',
  game: 'Interactive games and engines',
  data: 'Analysis, SQL, and visualization',
  backend: 'APIs, servers, and infrastructure',
};

export function createDefaultSiteSettings(): SiteSettings {
  return {
    general: {
      siteName: 'آکادمی کیا',
      tagline: 'Adaptive learning that maps to your goals',
      heroMinutes: 6,
      heroRoadmapsCount: 12400,
      heroMatchPercent: 94,
      supportEmail: 'support@kia.academy',
    },
    pricing: {
      readinessTestCents: PRODUCT_PRICES.READINESS_TEST,
      courseCents: PRODUCT_PRICES.COURSE,
      modulePrices: [...MODULE_PRICES],
      bundleDiscountPercent: 20,
    },
    tracks: Object.entries(TRACKS).map(([key, track]) => ({
      key,
      name: track.name,
      icon: TRACK_ICONS[key] ?? '📘',
      description: TRACK_DESCRIPTIONS[key] ?? '',
      modules: [...track.modules],
    })),
    readiness: {
      passThreshold: 60,
      passTitle: "You're ready for the next module",
      passMessage:
        'Your roadmap has been adjusted — the next module in your sequence is now unlocked.',
      failTitle: 'Almost there — one review module first',
      failMessage:
        "We'll slot in a short refresher before unlocking the next stage, so you start it feeling confident.",
    },
    bootcamp: {
      unlockScoreThreshold: 75,
      unlockCourseSlug: 'interview-branding',
      defaultRank: 12,
      defaultPoints: 340,
    },
    payment: {
      provider: 'dev',
      merchantId: '',
      apiKey: '',
      sandbox: true,
      displayName: '',
    },
    adminAccess: {
      stats: createSectionPermission(true, true, false),
      settings: createSectionPermission(false, false, false),
      courses: createSectionPermission(true, true, false),
      challenges: createSectionPermission(true, true, false),
      users: createSectionPermission(false, false, false),
      payments: createSectionPermission(true, false, false),
      tests: createSectionPermission(true, true, true),
    },
  };
}

export function mergeSiteSettings(
  base: SiteSettings,
  patch: Partial<{
    general: Partial<SiteSettings['general']>;
    pricing: Partial<SiteSettings['pricing']>;
    tracks: SiteSettings['tracks'];
    readiness: Partial<SiteSettings['readiness']>;
    bootcamp: Partial<SiteSettings['bootcamp']>;
    payment: Partial<SiteSettings['payment']>;
    adminAccess: Partial<SiteSettings['adminAccess']>;
  }>,
): SiteSettings {
  const merged = {
    general: { ...base.general, ...patch.general },
    pricing: {
      ...base.pricing,
      ...patch.pricing,
      modulePrices: patch.pricing?.modulePrices
        ? [...patch.pricing.modulePrices]
        : [...base.pricing.modulePrices],
    },
    tracks: patch.tracks
      ? patch.tracks.map((t) => ({ ...t, modules: [...t.modules] }))
      : base.tracks.map((t) => ({ ...t, modules: [...t.modules] })),
    readiness: { ...base.readiness, ...patch.readiness },
    bootcamp: { ...base.bootcamp, ...patch.bootcamp },
    payment: { ...base.payment, ...patch.payment },
    adminAccess: patch.adminAccess
      ? {
          stats: { ...base.adminAccess.stats, ...patch.adminAccess.stats },
          settings: { ...base.adminAccess.settings, ...patch.adminAccess.settings },
          courses: { ...base.adminAccess.courses, ...patch.adminAccess.courses },
          challenges: { ...base.adminAccess.challenges, ...patch.adminAccess.challenges },
          users: { ...base.adminAccess.users, ...patch.adminAccess.users },
          payments: { ...base.adminAccess.payments, ...patch.adminAccess.payments },
          tests: { ...base.adminAccess.tests, ...patch.adminAccess.tests },
        }
      : base.adminAccess,
  };
  return {
    ...merged,
    payment: normalizePaymentSettings(merged.payment),
    adminAccess: normalizeAdminAccess(merged.adminAccess),
  };
}
