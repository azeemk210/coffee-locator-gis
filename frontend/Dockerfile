# Simplified Next.js Frontend Dockerfile for Development/Production

FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci || npm install

# Copy application code
COPY . .

# Build the Next.js application with proper PostCSS/Tailwind processing
RUN npm run build

# Set environment variables
ENV NODE_ENV=production \
    PORT=3000

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start Next.js application with built production bundle
CMD ["npm", "start"]
