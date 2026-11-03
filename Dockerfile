FROM node:26-alpine AS base
WORKDIR /app
RUN chown node:node /app
USER node
COPY --chown=node:node package.json package-lock.json ./
COPY --chown=node:node client/package.json client/
COPY --chown=node:node server/package.json server/

FROM base AS deps
RUN npm ci

# Used by docker-compose.yml. Source files are synced in by Compose watch.
FROM deps AS dev
COPY --chown=node:node . .
EXPOSE 5173
CMD ["sh", "-c", "npm run db:migrate && npm run db:seed && npm run dev:app"]

FROM deps AS build
COPY --chown=node:node . .
RUN npm run build

FROM base AS production
ENV NODE_ENV=production
RUN npm ci --omit=dev
COPY --chown=node:node server server
COPY --chown=node:node --from=build /app/client/dist client/dist
EXPOSE 3001
CMD ["sh", "-c", "npm run db:migrate && npm run db:seed && npm start"]
