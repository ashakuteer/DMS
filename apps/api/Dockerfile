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

# Copy source code and entrypoint
COPY . .
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x docker-entrypoint.sh

# Generate Prisma Client (ensure types are available for build)
RUN npx prisma generate

# Build the application
RUN npm run build

# Expose port (Railway will override this)
EXPOSE 3001

# Entrypoint always runs migrations before starting the app.
# Railway's startCommand overrides CMD but not ENTRYPOINT,
# so migrations are guaranteed to run regardless of Railway config.
ENTRYPOINT ["sh", "docker-entrypoint.sh"]
CMD ["node", "--max-old-space-size=512", "dist/src/main.js"]
