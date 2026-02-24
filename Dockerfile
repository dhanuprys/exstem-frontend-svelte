# ── Stage 1: Build the SvelteKit app ─────────────────────────────────
FROM node:22-slim AS builder

WORKDIR /app

# Copy everything needed for npm ci + build
COPY package.json package-lock.json svelte.config.js vite.config.ts tsconfig.json ./

RUN npm ci

# Copy the rest of the source code explicitly to avoid COPY . . shadowing node_modules
COPY src ./src
COPY static ./static
COPY components.json eslint.config.js ./

RUN npm run build

# Prune dev dependencies so only production deps remain
RUN npm prune --omit=dev

# ── Stage 2: Minimal production image ────────────────────────────────
FROM node:22-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV ORIGIN=http://localhost:3000

# Security: run as non-root
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser

# Copy only what's needed to run
COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

USER appuser

EXPOSE 3000

CMD ["node", "build"]
