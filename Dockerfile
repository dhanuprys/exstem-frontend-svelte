# ── Stage 1: Install dependencies ─────────────────────────────────────
FROM node:22-alpine AS deps

WORKDIR /app

# Copy package manifests first for maximum layer caching
COPY package.json package-lock.json ./
RUN npm ci

# ── Stage 2: Build the SvelteKit app ─────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build produces /app/build via adapter-node
RUN npm run build

# Prune dev dependencies so only production deps remain
RUN npm prune --omit=dev

# ── Stage 3: Minimal production image ────────────────────────────────
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
