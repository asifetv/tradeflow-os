FROM node:18-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm install

COPY . .

RUN npm run build

FROM node:18-alpine

WORKDIR /app

# Copy standalone build output (includes server.js at root)
COPY --from=builder /app/.next/standalone ./

# Copy static assets
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

ENV NODE_ENV=production

# Clear any inherited entrypoint and run server directly
ENTRYPOINT []
CMD ["node", "server.js"]
