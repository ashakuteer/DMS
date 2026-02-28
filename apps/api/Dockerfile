# Use official Node image
FROM node:20-alpine

# Install OpenSSL (required for Prisma)
RUN apk add --no-cache openssl

# Set working directory
WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy rest of the project
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Expose port (change if needed)
EXPOSE 3000

# Start app
CMD ["npm", "start"]
