import type { NextConfig } from 'next';
import path from 'node:path';

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=()',
  },
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
];

const isDockerBuild = process.env.DOCKER_BUILD === 'true';
const isGitHubPages = process.env.GITHUB_PAGES === 'true';
const apiProxyTarget = (process.env.API_PROXY_TARGET ?? 'http://localhost:3001').replace(/\/$/, '');

/** Project-site path — must match the GitHub repo name (Pages URL /<repo>/). */
const githubPagesBasePath = (process.env.NEXT_BASE_PATH ?? '/pathwise').replace(/\/$/, '') || '';

const nextConfig: NextConfig = {
  transpilePackages: ['@kia-academy/shared'],
  ...(isGitHubPages
    ? {
        output: 'export' as const,
        basePath: githubPagesBasePath,
        assetPrefix: githubPagesBasePath,
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : isDockerBuild
      ? {
          output: 'standalone' as const,
          outputFileTracingRoot: path.join(process.cwd(), '../..'),
        }
      : {}),
  ...(!isGitHubPages
    ? {
        async rewrites() {
          return [
            {
              source: '/api/:path*',
              destination: `${apiProxyTarget}/api/:path*`,
            },
          ];
        },
        async headers() {
          return [
            {
              source: '/:path*',
              headers: securityHeaders,
            },
          ];
        },
      }
    : {}),
};

export default nextConfig;
