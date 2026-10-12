# Production API image for @sapiensmetric/api (T-023).
#
# Architecture-agnostic: builds for linux/arm64 and linux/amd64. The only native
# runtime dependency is `argon2`, which ships prebuilt N-API binaries for both
# (linux-arm64 and linux-x64, glibc and musl), so no compiler is required.
#
# Multi-stage: the builder installs the workspace, builds the shared packages and
# the API, then prunes dev dependencies. The runtime image contains only the
# production workspace and runs as non-root UID:GID 10001:10001 (no supervisor).
#
# Build (from the repository root):
#   docker build -f apps/api/Dockerfile -t sapiensmetric-api:local .
# Multi-arch:
#   docker buildx build --platform linux/arm64,linux/amd64 -f apps/api/Dockerfile .

FROM node:24-bookworm-slim AS build
WORKDIR /app
RUN npm install --global pnpm@11.26.0

# Workspace manifests first, for layer caching.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/contracts/package.json packages/contracts/package.json
COPY packages/assessment/package.json packages/assessment/package.json
RUN pnpm install --frozen-lockfile

# Sources required to build the API and its workspace dependencies.
COPY packages/contracts packages/contracts
COPY packages/assessment packages/assessment
COPY apps/api apps/api
RUN pnpm --filter @sapiensmetric/contracts build \
 && pnpm --filter @sapiensmetric/assessment build \
 && pnpm --filter @sapiensmetric/api build \
 && pnpm prune --prod

FROM node:24-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
RUN groupadd --gid 10001 app \
 && useradd --uid 10001 --gid 10001 --no-create-home --shell /usr/sbin/nologin app
COPY --from=build --chown=10001:10001 /app/node_modules ./node_modules
COPY --from=build --chown=10001:10001 /app/package.json /app/pnpm-workspace.yaml ./
COPY --from=build --chown=10001:10001 /app/packages ./packages
COPY --from=build --chown=10001:10001 /app/apps/api ./apps/api
USER 10001:10001
WORKDIR /app/apps/api
EXPOSE 3000
# Liveness only; compose uses /health/ready for the DB-backed readiness gate.
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:'+(process.env.API_PORT||3000)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]
CMD ["node", "dist/main.js"]
