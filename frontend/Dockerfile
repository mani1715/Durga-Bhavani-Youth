FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci || npm install

COPY . .
RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production || npm install --omit=dev

COPY --from=builder /app/dist ./dist
COPY server.mjs ./

ENV PORT=3000

EXPOSE 3000

CMD ["node", "server.mjs"]
