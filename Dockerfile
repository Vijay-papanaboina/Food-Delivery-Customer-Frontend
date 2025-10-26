# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Build arguments for API URLs
ARG VITE_API_BASE_URL=http://api.fooddelivery.local
ARG VITE_USER_API_URL=http://api.fooddelivery.local
ARG VITE_ORDER_API_URL=http://api.fooddelivery.local
ARG VITE_PAYMENT_API_URL=http://api.fooddelivery.local
ARG VITE_RESTAURANT_API_URL=http://api.fooddelivery.local
ARG VITE_DELIVERY_API_URL=http://api.fooddelivery.local
ARG VITE_NOTIFICATION_API_URL=http://api.fooddelivery.local
ARG VITE_STRIPE_PUBLISHABLE_KEY

# Set environment variables for build
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_USER_API_URL=$VITE_USER_API_URL \
    VITE_ORDER_API_URL=$VITE_ORDER_API_URL \
    VITE_PAYMENT_API_URL=$VITE_PAYMENT_API_URL \
    VITE_RESTAURANT_API_URL=$VITE_RESTAURANT_API_URL \
    VITE_DELIVERY_API_URL=$VITE_DELIVERY_API_URL \
    VITE_NOTIFICATION_API_URL=$VITE_NOTIFICATION_API_URL \
    VITE_STRIPE_PUBLISHABLE_KEY=$VITE_STRIPE_PUBLISHABLE_KEY

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --ignore-scripts && \
    npm cache clean --force

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

