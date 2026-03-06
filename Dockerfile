# Stage 1: Build the application
# Use the official Node.js 20 image as the base image
FROM node:22 AS build

# Set the working directory
WORKDIR /app

# Copy package.json and yarn.lock
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --legacy-peer-deps

# Copy the rest of the application code
COPY . .

# Install Puppeteer and download the required Chrome browser
RUN npx puppeteer browsers install chrome

# Build the Next.js application
RUN yarn build

# Stage 2: Run the application
# Use a smaller Node.js runtime image for the final stage
FROM node:22-slim AS runtime

# Set the working directory
WORKDIR /app

# Copy only the necessary files from the build stage
COPY --from=build /app/package.json /app/yarn.lock ./
COPY --from=build /app/dist ./dist
COPY --from=build /app/public ./public
COPY --from=build /app/node_modules ./node_modules

# Ensure Puppeteer cache is included in the final image
COPY --from=build /root/.cache/puppeteer /root/.cache/puppeteer

# Install Chromium dependencies
RUN apt-get update && apt-get install -y \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxi6 \
    libxtst6 \
    libcups2 \
    libxrandr2 \
    libasound2 \
    libpangocairo-1.0-0 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libepoxy0 \
    libgbm1 \
    libgtk-3-0 \
    libdrm2 \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Expose the port the app runs on (overridable via PORT env)
EXPOSE ${PORT:-7301}

# Runtime environment defaults
ENV NODE_ENV=production
ENV PORT=7301
ENV HOST=0.0.0.0

# Start the application
CMD ["yarn", "start"]
