FROM node:20

# Set working directory
WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Copy Prisma schema before install (needed for postinstall hook)
COPY prisma ./prisma/

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy all other source files
COPY . .

# Ensure Prisma Client is generated (redundant if in postinstall, but safe)
RUN npx prisma generate

# Expose Next.js dev port
EXPOSE 3000

# Run the dev server
CMD ["npm", "run", "dev"]
