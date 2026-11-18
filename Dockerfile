# ---------- Build ----------
FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---------- Run ----------
FROM node:24-alpine
WORKDIR /app

# The database's CA certificate, where it was before (point SSL_CA at it).
COPY DigiCertGlobalRootCA.crt.pem /certs/DigiCertGlobalRootCA.crt.pem

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=builder /app/dist ./dist

USER node
EXPOSE 3000 3001
CMD ["node", "dist/main.js"]
