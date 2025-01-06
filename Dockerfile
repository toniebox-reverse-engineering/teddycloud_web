# Build stage
FROM node:20-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=build /app/dist /usr/share/nginx/html/web

# Configure nginx to handle SPA routing
RUN echo 'server { \
    listen 80; \
    location /web { \
        alias /usr/share/nginx/html/web; \
        try_files $uri $uri/ /web/index.html; \
    } \
    location / { \
        return 301 /web; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
