# Stage 1: Dependencies
FROM node:18-alpine as dependencies
WORKDIR /app
COPY package*.json ./
RUN npm install

# Stage 2: Builder
FROM node:18-alpine as builder
WORKDIR /app

# --- ADD THESE LINES HERE ---
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
# ----------------------------

COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Stage 3: Runtime
FROM node:18-alpine as runtime
WORKDIR /app

# Optional: keep it here too if your code needs it at runtime
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

COPY package*.json ./
RUN npm install --omit=dev
COPY --from=builder /app/.next ./.next
#COPY --from=builder /app/public ./public 

ENV NODE_ENV=production PORT=3000
EXPOSE 3000

CMD ["npm", "start"]