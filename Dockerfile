# Multi-stage build for Next.js standalone deployment
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build Next.js (standalone mode)
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Azure uses PORT env variable, default to 8080
ENV PORT=8080

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone output - Next.js creates nested folder with package name
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# Copy static files to the nested project folder
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./adaptive-traffic-monitoring/.next/static

# Copy public assets to the nested project folder
COPY --from=builder --chown=nextjs:nodejs /app/public ./adaptive-traffic-monitoring/public

USER nextjs

EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:8080/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Run from the nested project directory where server.js is located
WORKDIR /app/adaptive-traffic-monitoring
CMD ["node", "server.js"]
