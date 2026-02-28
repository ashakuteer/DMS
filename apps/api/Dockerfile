# Use Node.js LTS version
FROM node:20-alpine

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Set working directory
WORKDIR /app

# Copy production package.json (without workspace dependencies)
COPY package.production.json ./package.json

# Copy prisma schema BEFORE npm install (needed for postinstall script)
COPY prisma ./prisma

# Install dependencies (postinstall will run prisma generate)
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Remove dev dependencies to reduce image size
RUN npm prune --production

# Expose port (Railway will override this)
EXPOSE 3001

# Set Node memory limit and start command
ENV NODE_OPTIONS="--max-old-space-size=512"
CMD ["sh", "-c", "npx prisma db push --schema=prisma/schema.prisma --accept-data-loss && node dist/src/main.js"]

