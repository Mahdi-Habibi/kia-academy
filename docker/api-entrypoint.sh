#!/bin/sh
set -e

cd /app/apps/api

DB_HOST="${DB_HOST:-postgres}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-kia-academy}"

echo "Waiting for PostgreSQL at ${DB_HOST}:${DB_PORT}..."
attempt=0
max_attempts=30
until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" >/dev/null 2>&1; do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge "$max_attempts" ]; then
    echo "PostgreSQL is not reachable after ${max_attempts} attempts."
    exit 1
  fi
  echo "  attempt ${attempt}/${max_attempts}..."
  sleep 2
done

echo "Running database migrations..."
npx prisma migrate deploy

if [ "${SEED_DATABASE:-false}" = "true" ]; then
  echo "Seeding database..."
  npx prisma db seed
fi

echo "Starting Kia Academy API..."
exec node dist/main.js
