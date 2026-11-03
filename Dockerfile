# -------------------------------------------------------------
# Stage 1: Build the React Application
# -------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci || npm install

# Copy application source code
COPY . .

# Build argument for backend API URL
ARG VITE_API_URL=http://localhost:4000/api/v1
ENV VITE_API_URL=${VITE_API_URL}

# Run TypeScript compilation and Vite production build
RUN npm run build

# -------------------------------------------------------------
# Stage 2: Serve with NGINX
# -------------------------------------------------------------
FROM nginx:alpine

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy build artifacts from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration (SPA routing fallback)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx server
CMD ["nginx", "-g", "daemon off;"]

