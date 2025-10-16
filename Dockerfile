FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN echo "Building with TypeScript compiler..." && npx tsc
RUN echo "=== Checking dist folder ===" && ls -laR dist/ | head -50

# Expose port
EXPOSE 3000

# Start script that pushes schema then starts the app  
CMD ["sh", "-c", "echo '=== Starting deployment ===' && echo 'DATABASE_URL:' $DATABASE_URL && echo '=== Pushing database schema ===' && npx prisma db push --accept-data-loss --skip-generate --force-reset || echo 'DB push failed, continuing...' && echo '=== Starting application ===' && node dist/main.js"]
