FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm

# Prune
FROM base AS prune
WORKDIR /app
COPY . .
RUN pnpm --filter chambear-backend deploy --prod --legacy /app/pruned

# Build
FROM base AS build
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
WORKDIR /app/apps/backend
RUN npx prisma generate
RUN pnpm build

# Runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=prune /app/pruned/package.json ./package.json
COPY --from=prune /app/pruned/node_modules ./node_modules
COPY --from=build /app/apps/backend/dist ./dist
COPY --from=build /app/apps/backend/prisma ./prisma
# Copy generated prisma client if it's not in node_modules (it usually is, but sometimes needed explicitly)
# In pnpm monorepos, prisma client often ends up in root node_modules or hoisted. 
# However, the 'pruned' step with --prod should capture necessary deps.
# Let's ensure the dist runs.

EXPOSE 8000
CMD ["node", "dist/server.js"]
