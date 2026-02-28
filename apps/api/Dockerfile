# NestJS API Dockerfile
FROM node:22-alpine AS base

# Install pnpm
RUN npm install -g pnpm

FROM base AS dependencies
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --no-frozen-lockfile

FROM base AS build
WORKDIR /app
COPY . .
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/apps/api/node_modules ./apps/api/node_modules

# Generate Prisma client
WORKDIR /app/apps/api
RUN pnpm prisma:generate

# Build the application
RUN pnpm build

FROM base AS deploy
WORKDIR /app

# Copy built application
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/apps/api/node_modules ./node_modules
COPY --from=build /app/apps/api/prisma ./prisma
COPY --from=build /app/apps/api/package.json ./package.json

# Expose port
EXPOSE 3001

# Start the application
CMD ["node", "dist/src/main.js"]
