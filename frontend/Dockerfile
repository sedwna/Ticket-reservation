FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --include=dev --no-audit --no-fund

COPY . .

RUN npm run lint
RUN npm run build

FROM nginx:alpine

LABEL org.opencontainers.image.title="Ticket Reservation Frontend"

COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx config for SPA routing with runtime service DNS resolution
RUN echo 'server { \
    listen 80; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { try_files $uri /index.html; } \
    location /api/ { \
        resolver 127.0.0.11 valid=30s; \
        proxy_pass http://backend:8080$request_uri; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; \
        proxy_set_header X-Forwarded-Proto $scheme; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
