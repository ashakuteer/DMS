# -----------------------
# Base Image
# -----------------------
FROM node:22-alpine AS base
RUN npm install -g pnpm

# -----------------------
# Install Dependencies
# -----------------------
FROM base AS dependencies
WORKDIR /app

COPY package.json pnpm-lock.yaml* ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/

RUN pnpm install --no-frozen-lockfile

# -----------------------
# Build Stage
# -----------------------
FROM base AS build
WORKDIR /app

# Copy full source code
COPY . .

# Copy node_modules from dependencies stage
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/apps/api/node_modules ./apps/api/node_modules

# Move into api folder
WORKDIR /app/apps/api

# ✅ Ensure prisma folder exists
RUN ls prisma

# ✅ Generate Prisma Client
RUN pnpm prisma generate

# ✅ Build API
RUN pnpm build

# -----------------------
# Production Stage
# -----------------------
FROM base AS deploy
WORKDIR /app

# Copy built files
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/apps/api/node_modules ./node_modules
COPY --from=build /app/apps/api/prisma ./prisma
COPY --from=build /app/apps/api/package.json ./package.json

# Railway provides PORT automatically
EXPOSE 3001

CMD ["node", "dist/main.js"]
