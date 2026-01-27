# Build stage for React frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build frontend
RUN npm run build

# Production stage - Nginx to serve static files
FROM nginx:alpine

# Copy built assets from frontend-builder
COPY --from=frontend-builder /app/dist /usr/share/nginx/html

# Copy nginx configuration (create this file separately)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
