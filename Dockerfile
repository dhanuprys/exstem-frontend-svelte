# ── Stage 1: Build the SvelteKit app ─────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package manifests first for maximum layer caching
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code and build
COPY . .
RUN npm run build

# Prune dev dependencies so only production deps remain
RUN npm prune --omit=dev

# ── Stage 2: Minimal production image ────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV ORIGIN=http://localhost:3000

# Security: run as non-root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy only what's needed to run
COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

USER appuser

EXPOSE 3000

CMD ["node", "build"]
