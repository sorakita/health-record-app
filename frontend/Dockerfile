FROM node:22-alpine AS deps

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install

FROM node:22-alpine AS builder

WORKDIR /app
COPY --from=deps /app/frontend/node_modules ./frontend/node_modules
COPY frontend ./frontend
COPY docs ./docs
WORKDIR /app/frontend
ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:8709
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
RUN npm run build

FROM node:22-alpine AS runner

ENV NODE_ENV=production
WORKDIR /app

COPY --from=builder /app/frontend/.next ./frontend/.next
COPY --from=builder /app/frontend/public ./frontend/public
COPY --from=builder /app/frontend/package.json ./frontend/package.json
COPY --from=builder /app/frontend/node_modules ./frontend/node_modules
COPY --from=builder /app/docs ./docs

WORKDIR /app/frontend
EXPOSE 3709

CMD ["npm", "run", "start"]
