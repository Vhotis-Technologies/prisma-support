# Multi-stage: Vite build, then nginx for the SPA (React Router fallback).
FROM node:22-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .

# Baked at build time. Staging desk: staging.desk.prismavalet.com → API staging.support.prismavalet.com.
ARG VITE_API_URL=http://localhost:8002
ARG VITE_WS_URL=ws://localhost:8002
ARG VITE_BASE=/
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WS_URL=$VITE_WS_URL
ENV VITE_BASE=$VITE_BASE

RUN npm run build

FROM nginx:1.27-alpine AS production

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
