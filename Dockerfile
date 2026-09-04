FROM node:20-alpine AS builder

WORKDIR /app

# Copy only dependency files first (better caching)
COPY package.json package-lock.json ./

# Install dependencies deterministically
RUN npm ci

COPY . .

ARG VITE_API_BASE_URL
ARG VITE_API_REQUEST_TIMEOUT_MS=20000

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_API_REQUEST_TIMEOUT_MS=$VITE_API_REQUEST_TIMEOUT_MS

RUN npm run build

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
