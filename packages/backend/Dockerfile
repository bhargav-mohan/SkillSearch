############################
# Backend
############################
FROM node:20-alpine AS backend

WORKDIR /app

# Copy root workspace files
COPY package.json package-lock.json ./
COPY packages/backend/package.json ./packages/backend/

# Install backend deps only
RUN npm install --workspace=packages/backend --omit=dev

COPY packages/backend ./packages/backend

EXPOSE 3001
ENV NODE_ENV=production

CMD ["node", "packages/backend/src/index.js"]
