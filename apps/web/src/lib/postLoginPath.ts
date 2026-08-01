/**
 * Resolve where to send a user after login / when already authenticated on /login.
 * Prevents learner ↔ admin redirect loops when `next` points at `/admin`.
 */
export function resolvePostLoginPath(
  role: string | undefined,
  next: string | null | undefined,
): string {
  const raw = (next ?? '').trim();
  const target =
    raw.startsWith('/') && !raw.startsWith('//') && !raw.startsWith('/login') ? raw : '/dashboard';

  const isStaff = role === 'SUPER_ADMIN' || role === 'ADMIN';
  if (isStaff) {
    return target.startsWith('/admin') ? target : '/admin';
  }

  // Non-staff must never enter /admin — admin layout would bounce them to login.
  if (target === '/' || target.startsWith('/admin')) {
    return '/dashboard';
  }
  return target;
}
