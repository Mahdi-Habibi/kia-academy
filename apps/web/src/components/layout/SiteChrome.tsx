'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { DemoBanner } from '@/components/layout/DemoBanner';
import { Footer } from '@/components/layout/Footer';
import { TopBar } from '@/components/layout/TopBar';
import { useAuth } from '@/context/AuthProvider';

/**
 * Site chrome only after registration. Admin uses its own full-bleed shell.
 */
export function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, learnerState, loading } = useAuth();
  const isAdminRoute = Boolean(pathname?.startsWith('/admin'));
  const registered = Boolean(user?.profileComplete || learnerState?.profileComplete);
  const showChrome = !loading && registered && !isAdminRoute;

  return (
    <>
      {!isAdminRoute ? <DemoBanner /> : null}
      {showChrome ? <TopBar /> : null}
      <main
        className={`site-main${showChrome ? '' : ' site-main--guest'}${isAdminRoute ? ' site-main--admin' : ''}`}
      >
        {children}
      </main>
      {showChrome ? <Footer /> : null}
    </>
  );
}
