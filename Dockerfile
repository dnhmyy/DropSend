# build stage
FROM node:20-alpine AS base

# dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm ci

# build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# gen prisma client
RUN npx prisma generate
RUN npm run build

# runner stage
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# create dirs for uploads and sqlite
RUN mkdir -p /app/uploads /app/data
RUN chown -R nextjs:nodejs /app/uploads /app/data

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# use local persistent storage for sqlite
ENV DATABASE_URL="file:/app/data/prod.db"

USER nextjs

EXPOSE 8001
ENV PORT=8001
ENV HOSTNAME="0.0.0.0"

# run migrations and start
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && node server.js"]
