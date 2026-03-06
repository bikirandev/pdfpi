# Stage 1: Build the application
# Node 24 LTS on Alpine for minimal vulnerability surface
FROM node:24-alpine AS build

WORKDIR /app

COPY package.json yarn.lock ./

# Skip Puppeteer's bundled Chromium download — Alpine uses system chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

RUN yarn install --frozen-lockfile

COPY . .

# Build the TypeScript application
RUN yarn build

# Stage 2: Run the application
FROM node:24-alpine AS runtime

WORKDIR /app

# Install system Chromium and required dependencies
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    font-noto-emoji

# Tell Puppeteer to use system Chromium instead of bundled download
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Copy only the necessary files from the build stage
COPY --from=build /app/package.json /app/yarn.lock ./
COPY --from=build /app/dist ./dist
COPY --from=build /app/public ./public
COPY --from=build /app/node_modules ./node_modules

# Expose the port the app runs on
EXPOSE 7301

# Runtime environment defaults
ENV NODE_ENV=production
ENV PORT=7301
ENV HOST=0.0.0.0

# Start the application
CMD ["yarn", "start"]
