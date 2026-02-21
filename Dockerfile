# ─────────────────────────────────────────────
#  Dockerfile — AI Job System Server
# ─────────────────────────────────────────────

# Stage 1: Build client
FROM node:20-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Stage 2: Production server
FROM node:20-alpine AS server
WORKDIR /app/server

# Install server dependencies
COPY server/package*.json ./
RUN npm ci --only=production

# Copy server source
COPY server/ ./

# Copy built client into server's public folder
COPY --from=client-builder /app/client/dist ./public

# Create uploads directory
RUN mkdir -p uploads

EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s \
  CMD wget -qO- http://localhost:5000/api/health || exit 1

CMD ["node", "server.js"]
