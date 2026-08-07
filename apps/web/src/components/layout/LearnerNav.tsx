'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  ChevronDown,
  ClipboardList,
  LayoutDashboard,
  MessageSquare,
  Ticket,
  Trophy,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '@/context/LanguageProvider';

type NavLeaf = {
  id: string;
  href: string;
  label: string;
  exact?: boolean;
};

type NavItem =
  | (NavLeaf & { icon: LucideIcon; children?: undefined })
  | {
      id: string;
      label: string;
      icon: LucideIcon;
      children: NavLeaf[];
    };

function pathActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function LearnerNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname() || '/dashboard';
  const { t } = useLanguage();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const nav = useMemo((): NavItem[] => {
    return [
      {
        id: 'dashboard',
        label: t('panel.nav.dashboard'),
        icon: LayoutDashboard,
        children: [
          {
            id: 'dash-home',
            href: '/dashboard',
            label: t('panel.nav.overview'),
            exact: true,
          },
          {
            id: 'dash-finance',
            href: '/dashboard/finance',
            label: t('panel.nav.finance'),
          },
          {
            id: 'dash-orders',
            href: '/dashboard/finance#orders',
            label: t('panel.nav.orders'),
          },
          {
            id: 'dash-purchases',
            href: '/dashboard/purchases',
            label: t('panel.nav.purchases'),
          },
          {
            id: 'dash-results',
            href: '/dashboard/results',
            label: t('panel.nav.results'),
          },
          {
            id: 'dash-bootcamps',
            href: '/dashboard/bootcamps',
            label: t('panel.nav.enrolledBootcamps'),
          },
          {
            id: 'dash-competitions',
            href: '/dashboard/competitions',
            label: t('panel.nav.registeredCompetitions'),
          },
          {
            id: 'dash-progress',
            href: '/dashboard/progress',
            label: t('panel.nav.progress'),
          },
          {
            id: 'dash-todos',
            href: '/dashboard/todos',
            label: t('panel.nav.todos'),
          },
        ],
      },
      {
        id: 'my-courses',
        href: '/dashboard/my-courses',
        label: t('panel.nav.myCourses'),
        icon: BookOpen,
      },
      {
        id: 'tickets',
        label: t('panel.nav.tickets'),
        icon: Ticket,
        children: [
          {
            id: 'tickets-new',
            href: '/dashboard/tickets/new',
            label: t('panel.nav.newTicket'),
            exact: true,
          },
          {
            id: 'tickets-list',
            href: '/dashboard/tickets',
            label: t('panel.nav.previousTickets'),
            exact: true,
          },
        ],
      },
      {
        id: 'messages',
        href: '/dashboard/messages',
        label: t('panel.nav.messages'),
        icon: MessageSquare,
      },
      {
        id: 'profile',
        href: '/dashboard/profile',
        label: t('panel.nav.profile'),
        icon: UserRound,
      },
      {
        id: 'events',
        href: '/dashboard/events',
        label: t('panel.nav.events'),
        icon: Trophy,
      },
    ];
  }, [t]);

  useEffect(() => {
    const next: Record<string, boolean> = {};
    for (const item of nav) {
      if (item.children) {
        const hit = item.children.some((child) => pathActive(pathname, child.href, child.exact));
        const nested =
          item.id === 'dashboard'
            ? pathname.startsWith('/dashboard') &&
              !pathname.startsWith('/dashboard/my-courses') &&
              !pathname.startsWith('/dashboard/tickets') &&
              !pathname.startsWith('/dashboard/messages') &&
              !pathname.startsWith('/dashboard/profile') &&
              !pathname.startsWith('/dashboard/events')
            : item.id === 'tickets'
              ? pathname.startsWith('/dashboard/tickets')
              : false;
        if (hit || nested) next[item.id] = true;
      }
    }
    setOpenGroups((prev) => ({ ...prev, ...next }));
  }, [pathname, nav]);

  return (
    <div className="learner-nav">
      {nav.map((item) => {
        const Icon = item.icon;
        if (item.children) {
          const open = openGroups[item.id] ?? false;
          const groupActive = item.children.some((child) =>
            pathActive(pathname, child.href, child.exact),
          );
          return (
            <div
              key={item.id}
              className={`learner-nav-group${groupActive ? ' learner-nav-group--active' : ''}`}
            >
              <button
                type="button"
                className="learner-nav-group-btn"
                aria-expanded={open}
                onClick={() => setOpenGroups((prev) => ({ ...prev, [item.id]: !open }))}
              >
                <span className="learner-nav-label">
                  <Icon size={16} aria-hidden="true" />
                  {item.label}
                </span>
                <ChevronDown
                  size={14}
                  className={`learner-nav-chevron${open ? ' learner-nav-chevron--open' : ''}`}
                  aria-hidden="true"
                />
              </button>
              {open ? (
                <div className="learner-nav-children">
                  {item.children.map((child) => {
                    const active = pathActive(pathname, child.href, child.exact);
                    return (
                      <Link
                        key={child.id}
                        href={child.href}
                        className={`top-nav-link learner-nav-link${active ? ' is-active' : ''}`}
                        onClick={onNavigate}
                      >
                        <ClipboardList size={13} aria-hidden="true" />
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        }

        const active = pathActive(pathname, item.href, item.exact);
        return (
          <Link
            key={item.id}
            href={item.href}
            className={`top-nav-link learner-nav-link${active ? ' is-active' : ''}`}
            onClick={onNavigate}
          >
            <Icon size={16} aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
