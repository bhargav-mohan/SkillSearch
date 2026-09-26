############################
# Build frontend
############################
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/frontend/package.json ./packages/frontend/

RUN npm install --workspace=packages/frontend

COPY packages/frontend ./packages/frontend

# Optional: set the backend API URL for production cross-domain deployment
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build --workspace=packages/frontend

############################
# Serve with nginx
############################
FROM nginx:alpine AS production

COPY --from=builder /app/packages/frontend/dist /usr/share/nginx/html

# SPA routing: send all requests to index.html
RUN printf 'server {\n  listen 80;\n  location / {\n    root /usr/share/nginx/html;\n    try_files $uri /index.html;\n  }\n}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 80
