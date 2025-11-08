# Build stage
FROM oven/bun:latest AS builder

WORKDIR /app

# Copy package files
COPY package.json bun.lock bunfig.toml ./
COPY build.ts ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source files
COPY src ./src
COPY tsconfig.json ./
COPY components.json ./

# Build the application
RUN bun run build

# Production stage
FROM nginx:alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Copy built files from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

