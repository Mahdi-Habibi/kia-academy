'use client';

import { useId } from 'react';

/** Kia Academy mark — soft diamond with winding S pathway. */
export function BrandMark({
  className = 'brand-mark',
  size,
  title = 'Kia Academy',
}: {
  className?: string;
  /** Pixel size; omit to size via CSS (width/height 100%). */
  size?: number;
  title?: string;
}) {
  const uid = useId().replace(/:/g, '');
  const maskId = `kia-logo-cut-${uid}`;
  const dim = size ? { width: size, height: size } : undefined;

  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      role="img"
      aria-hidden={title ? undefined : true}
      focusable="false"
      {...dim}
    >
      {title ? <title>{title}</title> : null}
      <defs>
        <mask id={maskId}>
          <rect width="64" height="64" fill="#fff" />
          <path
            fill="#000"
            d="M33.5 5c-3.2 5.5-4.2 12-2.2 18 1.8 5.2 6.5 9 10.2 13.5 3.8 4.6 6.5 10.2 4.8 16.2-1.2 4.2-4.5 7.5-8.5 9.2 5.5-1 10.2-4.5 12.5-9.5 3.2-6.8 1.5-14.5-3.2-20-4-4.8-9.8-8-12.5-13.8C32.8 14 33 9.2 35.2 5.2 34.6 5 34 5 33.5 5zm-11 9.5c-3.5 5.8-4.2 13-1.2 19 2.5 5.2 7.8 8.8 11.5 13.5 3.2 4 5 9 3.2 14-1 2.8-3 5-5.5 6.5 6-.5 11.2-4 13.8-9.2 3.2-6.2 2-13.8-2.5-19-4-4.5-9.5-7.5-12-13-2-4.2-1.8-9 .8-13-3-.4-6-.6-8.6-.8z"
          />
        </mask>
      </defs>
      <path
        className="brand-mark-shape"
        fill="currentColor"
        mask={`url(#${maskId})`}
        d="M32 2.5c9.2 0 18.5 5.2 23.8 13.2 5.5 8.2 6.8 19.2 2.8 28.2-4 9-13.2 15.8-23.2 16.5-10 .8-20.2-4.5-25.8-13.2C4 38.2 3.2 26.5 8.5 17.2 13.8 8 22.8 2.5 32 2.5z"
      />
    </svg>
  );
}
