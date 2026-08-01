# syntax=docker/dockerfile:1

# Match .nvmrc (Node 22). Node 25+ slim images no longer ship `corepack` on PATH
# (exit 127), so install/activate pnpm explicitly.
FROM node:22-bookworm-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm install -g corepack@0.34.6 \
  && corepack enable \
  && corepack prepare pnpm@11.13.0 --activate
WORKDIR /app

# Install workspace dependencies (native modules: bcrypt, prisma)
FROM base AS deps
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
# Schema required during install: root postinstall runs `prisma generate`
COPY apps/api/prisma apps/api/prisma
COPY apps/web/package.json apps/web/
RUN pnpm install --frozen-lockfile

# Build shared, API, and web
FROM deps AS builder
COPY packages/shared packages/shared
COPY apps/api apps/api
COPY apps/web apps/web
RUN pnpm --filter @kia-academy/shared build
RUN pnpm --filter @kia-academy/api exec prisma generate
RUN pnpm --filter @kia-academy/api build

ARG NEXT_PUBLIC_API_URL=
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ARG API_PROXY_TARGET=http://api:3001
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV API_PROXY_TARGET=$API_PROXY_TARGET
ENV DOCKER_BUILD=true
RUN pnpm --filter @kia-academy/web build

# Production API image
FROM base AS api
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates postgresql-client \
  && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
WORKDIR /app
COPY --from=builder /app/package.json /app/pnpm-workspace.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY docker/api-entrypoint.sh /entrypoint.sh
RUN sed -i 's/\r$//' /entrypoint.sh && chmod +x /entrypoint.sh
WORKDIR /app/apps/api
EXPOSE 3001
HEALTHCHECK --interval=15s --timeout=5s --start-period=40s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:3001/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
ENTRYPOINT ["/entrypoint.sh"]

# Production web image (Next.js standalone)
FROM base AS web
ENV NODE_ENV=production
WORKDIR /app
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:3000').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "apps/web/server.js"]
