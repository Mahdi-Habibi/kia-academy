import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="page-content">
      <div className="container">
        <h1>Page not found</h1>
        <p className="auth-sub">That route is not part of this Kia Academy build.</p>
        <Link href="/" className="cta-primary">
          Back home
        </Link>
      </div>
    </div>
  );
}
