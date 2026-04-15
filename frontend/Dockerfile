# Multi-stage build for Next.js frontend

# Stage 1: Dependencies
FROM node:18-alpine as dependencies

WORKDIR /app

COPY package*.json ./

RUN npm install

# Stage 2: Builder
FROM node:18-alpine as builder

WORKDIR /app

COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

# Build the Next.js application
RUN npm run build

# Stage 3: Runtime
FROM node:18-alpine as runtime

WORKDIR /app

# Install only production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy built application from builder
COPY --from=builder /app/.next ./.next
# Note: public directory is optional in Next.js
# COPY --from=builder /app/public ./public

# Set environment variables
ENV NODE_ENV=production \
    PORT=3000

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start Next.js application
CMD ["npm", "start"]
