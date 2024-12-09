# Use an official Node.js image for building the app
FROM node:18 AS build

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock)
COPY package*.json ./

# Install dependencies 
RUN npm install

# Copy the rest of the application files
COPY . .

# Build the project (generate the dist folder)
RUN npm run build

# Use a minimal web server (serve) to serve the static files
FROM node:18-alpine

# Install the 'serve' package globally
RUN npm install -g serve

# Set the working directory to the build folder
WORKDIR /app

# Copy the built files from the build stage into the current directory
COPY --from=build /app/dist /app/dist

# Expose the port that the app will be served on
EXPOSE 5079

# Run the 'serve' command to serve the static files from the dist folder
CMD ["serve", "-s", "dist", "-l", "5079"]
