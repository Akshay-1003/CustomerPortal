FROM node:20-alpine

WORKDIR /app

# Copy only dependency files first (better caching)
COPY ../package.json package-lock.json ./

# Install dependencies deterministically
RUN npm ci

# Copy rest of the app
COPY .. .

# Expose Vite port
EXPOSE 5174

# Run dev server
CMD ["npm", "run", "dev", "--", "--host", "--port", "5174"]