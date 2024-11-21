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
#COPY --from=build /app/public ./public
COPY --from=build /app/node_modules ./node_modules

# Expose the port the app runs on
EXPOSE 7301

# Start the Next.js application
CMD ["yarn", "start"]
