# Step 1: Base image (Node.js environment)
FROM node:18

# Step 2: Set working directory inside container
WORKDIR /app

# Step 3: Copy dependency files first
COPY package*.json ./

# Step 4: Install dependencies
RUN npm install

# Step 5: Copy all source code
COPY . .

# Step 6: Expose port (User Service runs on 3001)
EXPOSE 3001

# Step 7: Start the application
CMD ["node", "server.js"]