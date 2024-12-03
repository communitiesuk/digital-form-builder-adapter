# ----------------------------
# Stage 1: Base image
FROM node:20-alpine AS base-image

RUN apk add --no-cache bash git && \
    addgroup -g 1001 appuser && \
    adduser -S -u 1001 -G appuser appuser && \
    mkdir -p /usr/src/app/digital-form-builder-adapter/runner/public/static && \
    chown -R appuser:appuser /usr/src/app && \
    chmod -R +x /usr/src/app

# Install nodemon as root, as it's a global dependency
RUN npm install -g nodemon

# Switch to non-root user
USER appuser

# ----------------------------
# Stage 2: Yarn setup
FROM base-image AS yarn-build

WORKDIR /usr/src/app/digital-form-builder-adapter
COPY --chown=appuser:appuser ../.yarn .yarn
COPY --chown=appuser:appuser ../.yarnrc.yml .yarnrc.yml

# ----------------------------
# Stage 3: Pre-build dependencies
FROM yarn-build AS pre-build

COPY --chown=appuser:appuser ../package.json ../tsconfig.json ../update-package.js ../yarn.lock ./
COPY --chown=appuser:appuser ../designer/package.json ./designer/package.json
COPY --chown=appuser:appuser ../runner/package.json ./runner/package.json
COPY --chown=appuser:appuser ../model/package.json ./model/package.json

# Copy Git configuration and initialize submodules
COPY --chown=appuser:appuser .git ./.git
COPY --chown=appuser:appuser .gitmodules ./.gitmodules
RUN git submodule update --init --recursive && \
    rm -rf .git digital-form-builder/.git

# ----------------------------
# Stage 4: Install dependencies
FROM pre-build AS install-dependencies
RUN --mount=type=cache,target=/usr/src/app/digital-form-builder-adapter/.yarn/cache,uid=1001,mode=0755 \
    node update-package.js && \
    yarn setup
RUN --mount=type=cache,target=/usr/src/app/digital-form-builder-adapter/.yarn/cache,uid=1001,mode=0755 \
    yarn install

# ----------------------------
# Stage 5: Build XGovFormBuilder
FROM install-dependencies AS build-xgov
WORKDIR /usr/src/app/digital-form-builder-adapter/digital-form-builder
RUN --mount=type=cache,target=.yarn/cache,uid=1001,mode=0755 \
    yarn
RUN --mount=type=cache,target=.yarn/cache,uid=1001,mode=0755 \
    yarn model build
RUN --mount=type=cache,target=.yarn/cache,uid=1001,mode=0755 \
    yarn queue-model build

# ----------------------------
# Stage 6: Add model files
FROM build-xgov AS model-stage

WORKDIR /usr/src/app/digital-form-builder-adapter
COPY --chown=appuser:appuser ../model ./model

# ----------------------------
# Stage 7: Build model
FROM model-stage AS build-model
RUN --mount=type=cache,target=.yarn/cache,uid=1001,mode=0755 \
    yarn model build

# ----------------------------
# Stage 8: Add runner files
FROM build-model AS runner-stage
COPY --chown=appuser:appuser ../runner ./runner
COPY --chown=appuser:appuser ../fsd_config ./fsd_config

# ----------------------------
# Stage 9: Build runner
FROM runner-stage AS build-runner
RUN --mount=type=cache,target=.yarn/cache,uid=1001,mode=0755 \
    yarn runner build

# ----------------------------
# Final Stage: Application runtime
FROM base-image AS runtime
WORKDIR /usr/src/app/digital-form-builder-adapter
COPY --from=build-runner /usr/src/app/digital-form-builder-adapter /usr/src/app/digital-form-builder-adapter

USER appuser
CMD ["yarn", "runner", "production"]
