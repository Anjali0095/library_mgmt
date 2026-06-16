# 1. Dependencies stage

FROM node:20-alpine AS deps
WORKDIR /app

COPY package*.json ./
RUN npm install

# 2. Builder stage

FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_PUBLIC_API_URL=http://localhost:5000/api
RUN npm run build

# 3. Runner stage

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/app/public ./public

RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 3000
CMD ["node_modules/.bin/next", "start", "-p", "3000"]

