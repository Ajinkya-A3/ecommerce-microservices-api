# Stage 1: Build the app
FROM node:18-alpine AS build

# Set working directory for build
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock)
COPY package*.json ./ 

# Install dependencies in build environment
RUN npm install --production

# Copy the rest of the application source code
COPY . .

# Stage 2: Production environment
FROM node:18-alpine AS production

# Set working directory for production
WORKDIR /app

# Copy only the necessary files from the build stage
COPY --from=build /app /app

# Expose the port the app runs on
EXPOSE 5000

# Set environment variable to production
ENV NODE_ENV=production

# Start the application
CMD ["npm", "start"]
