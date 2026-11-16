# Use an official Node.js runtime as a parent image
FROM node:22-alpine

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy the rest of your application code
COPY . .

# Expose the port the app will run on
EXPOSE 3030

# Run the application
CMD ["node", "index.js"]