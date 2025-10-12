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
RUN echo "Building with TypeScript compiler..." && npx tsc -p tsconfig.build.json
RUN echo "=== Checking dist folder ===" && ls -laR dist/ | head -50

# Expose port
EXPOSE 3000

# Start script that pushes schema then starts the app
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && ls -la /app && ls -la /app/dist && node dist/main.js"]
