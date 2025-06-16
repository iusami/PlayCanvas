# Multi-stage build for React + TypeScript + Vite application
# Optimized for both development and production deployment

# Stage 1: Base dependencies
FROM node:18-alpine AS deps
WORKDIR /app

# Install dependencies with package-lock for reproducible builds
COPY package*.json ./
RUN npm ci --only=production --silent && npm cache clean --force

# Stage 2: Development dependencies and build tools
FROM node:18-alpine AS dev-deps
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies including devDependencies
RUN npm ci --silent && npm cache clean --force

# Stage 3: Builder - Build the application
FROM dev-deps AS builder
WORKDIR /app

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Stage 4: Production runner with nginx
FROM nginx:alpine AS production
WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Copy built assets from builder stage
COPY --from=builder /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 && \
    chown -R nextjs:nodejs /usr/share/nginx/html

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

# Stage 5: Development environment
FROM dev-deps AS development
WORKDIR /app

# Install additional development tools
RUN apk add --no-cache git curl

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 && \
    chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Copy source code
COPY --chown=nextjs:nodejs . .

# Expose development port
EXPOSE 5173

# Health check for development
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:5173/ || exit 1

# Start development server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]