# Etapa de construcción
FROM node:18 AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Acepta variables de entorno como build args
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

RUN npm run build

# Etapa de producción
FROM node:18

WORKDIR /app
COPY --from=builder /app /app
RUN npm install --omit=dev

EXPOSE 3000
CMD ["node", "server/index.js"]
