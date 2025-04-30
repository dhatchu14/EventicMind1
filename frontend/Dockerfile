FROM node:16

# Set the working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Build the React app for production
RUN npm run build

# Install a simple web server to serve the build files
RUN npm install -g serve

# Expose the port
EXPOSE 3000

# Serve the built app using serve
CMD ["serve", "-s", "build", "-l", "3000"]
