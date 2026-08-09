# syntax=docker/dockerfile:1

FROM node:24-bookworm-slim AS build
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

ENV NITRO_TELEMETRY_DISABLED=1
ARG NUXT_APP_BASE_URL="/"
ARG NUXT_PUBLIC_API_BASE="/api"
ARG NUXT_PUBLIC_RESUME_UPLOAD_MAX_BYTES="10485760"
ARG NUXT_PUBLIC_SHOW_DEMO_LOGIN="false"
ENV NUXT_APP_BASE_URL=${NUXT_APP_BASE_URL}
ENV NUXT_PUBLIC_API_BASE=${NUXT_PUBLIC_API_BASE}
ENV NUXT_PUBLIC_RESUME_UPLOAD_MAX_BYTES=${NUXT_PUBLIC_RESUME_UPLOAD_MAX_BYTES}
ENV NUXT_PUBLIC_SHOW_DEMO_LOGIN=${NUXT_PUBLIC_SHOW_DEMO_LOGIN}

COPY package*.json prisma.config.ts ./
COPY backend/prisma ./backend/prisma
RUN npm ci --include=dev --ignore-scripts --no-audit --no-fund --loglevel=notice

COPY backend ./backend
COPY Frontend ./Frontend
RUN npm run gcp:build

FROM node:24-bookworm-slim AS runtime
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PORT=8080
ENV STATIC_DIR=/app/Frontend/.output/public

COPY package*.json prisma.config.ts ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/backend/dist ./backend/dist
COPY --from=build /app/backend/prisma ./backend/prisma
COPY --from=build /app/Frontend/.output/public ./Frontend/.output/public

EXPOSE 8080
CMD ["npm", "run", "gcp:start"]
