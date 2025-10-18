# syntax=docker/dockerfile:1

# ---- Build stage ----
FROM node:18-alpine AS builder
WORKDIR /app

# Install dependencies first (better cache)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the project (client + server)
RUN npm run build

# Prepare deploy folder and install only production deps for runtime
RUN node scripts/prepare-deploy.js \
    && cd dist \
    && npm ci --omit=dev

# ---- Runtime stage ----
FROM node:18-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000

# Copy ready-to-run app from build stage
COPY --from=builder /app/dist /app/

# Expose application port
EXPOSE 5000

# Default command
CMD ["node","index.js"]
