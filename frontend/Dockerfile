# syntax=docker/dockerfile:1

# --- Stage 1: build the SPA ---
FROM node:22-alpine AS build
WORKDIR /app

# Install dependencies (use lockfile if present, otherwise plain install)
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Build
COPY . .
RUN npm run build

# --- Stage 2: serve with nginx ---
FROM nginx:alpine AS runtime

# Default backend target (overridable at runtime via -e BACKEND_ADDR=host:port)
ENV BACKEND_ADDR=backend:8080

# Restrict envsubst to ONLY ${BACKEND_ADDR} so nginx runtime vars
# ($host, $remote_addr, $uri, ...) in the template are left intact.
ENV NGINX_ENVSUBST_FILTER=BACKEND_ADDR

# Static assets
COPY --from=build /app/dist /usr/share/nginx/html

# nginx template; nginx:alpine runs envsubst over /etc/nginx/templates/*.template
# into /etc/nginx/conf.d/ at container start.
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template

EXPOSE 80
