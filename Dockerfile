# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package management files
# Including .npmrc in case there are private registry configurations
COPY package*.json .npmrc* ./

# Install all dependencies (including devDependencies required for the build)
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the SvelteKit application
RUN npm run build

# Remove development dependencies to keep the production image lean
RUN npm prune --omit=dev


# Stage 2: Production
FROM node:22-alpine AS production

WORKDIR /app

# Set environment variables for production
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# Copy necessary build artifacts from the builder stage
COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Expose the port that the application listens on
EXPOSE 3000

# Run the SvelteKit node server
CMD ["node", "build/index.js"]
