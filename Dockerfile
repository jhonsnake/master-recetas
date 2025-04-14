# Etapa de construcción
FROM node:18 AS builder

WORKDIR /app
COPY . .
RUN npm install
RUN npm run build

# Etapa de producción
FROM node:18

WORKDIR /app
COPY --from=builder /app /app
RUN npm install --omit=dev

EXPOSE 3000
CMD ["node", "server/index.js"]
