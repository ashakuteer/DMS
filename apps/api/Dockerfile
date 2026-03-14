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

# Generate Prisma Client (ensure types are available for build)
RUN npx prisma generate

# Build the application
RUN npm run build

# Expose port (Railway will override this)
EXPOSE 3001

# Run DB migrations then start the application.
# prisma CLI is available because we do not prune devDependencies —
# this ensures `prisma migrate deploy` works at container startup.
CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy --schema=prisma/schema.prisma && node dist/src/main.js"]
