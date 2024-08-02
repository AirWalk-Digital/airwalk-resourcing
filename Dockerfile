# Stage 1: Build
FROM node:18.18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all project files
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1

# Build the application
ARG ASSET_PREFIX
ARG BASE_PATH
ENV ASSET_PREFIX=${ASSET_PREFIX}
ENV BASE_PATH=${BASE_PATH}
RUN npm run build

# Stage 2: Run
FROM node:18.18-alpine AS runner

# Set working directory
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy only the necessary files from the build stage
COPY --from=builder /app/package*.json ./
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/middleware.ts ./

# Expose the port the app runs on
USER nextjs

EXPOSE 3000

ENV ASSET_PREFIX=${ASSET_PREFIX}
ENV BASE_PATH=${BASE_PATH}

# Command to run the app
CMD ["node", "server.js"]
