# ----------------------------
# Stage 1
FROM node:20-alpine AS base-image

ARG INSTALL_NODEMON=false

RUN mkdir -p /usr/src/app/digital-form-builder-adapter/runner/public/static && \
    addgroup -g 1001 appuser && \
    adduser -S -u 1001 -G appuser appuser && \
    chown -R appuser:appuser /usr/src/app/digital-form-builder-adapter && \
    chmod -R +x  /usr/src/app/digital-form-builder-adapter && \
    apk update && \
    apk add --no-cache bash git
RUN if [ "$INSTALL_NODEMON" = "true" ]; then \
    npm install -g nodemon --ignore-scripts; \
    fi


# ----------------------------
# Stage 2
FROM base-image AS build-configuration
WORKDIR /usr/src/app/digital-form-builder-adapter
USER appuser
COPY --chown=appuser:appuser ../.yarn .yarn
COPY --chown=appuser:appuser ../.yarnrc.yml .yarnrc.yml
COPY --chown=appuser:appuser ../package.json package.json
COPY --chown=appuser:appuser ../tsconfig.json tsconfig.json
COPY --chown=appuser:appuser ../yarn.lock yarn.lock
COPY --chown=appuser:appuser ../designer/package.json ./designer/package.json
COPY --chown=appuser:appuser ../runner/package.json ./runner/package.json
COPY --chown=appuser:appuser ../model/package.json ./model/package.json
COPY --chown=appuser:appuser ../e2e-test/package.json ./e2e-test/package.json

COPY --chown=appuser:appuser ../digital-form-builder/designer/package.json ./digital-form-builder/designer/package.json
COPY --chown=appuser:appuser ../digital-form-builder/model/package.json ./digital-form-builder/model/package.json
COPY --chown=appuser:appuser ../digital-form-builder/e2e/package.json ./digital-form-builder/e2e/package.json
COPY --chown=appuser:appuser ../digital-form-builder/queue-model/package.json ./digital-form-builder/queue-model/package.json
COPY --chown=appuser:appuser ../digital-form-builder/runner/package.json ./digital-form-builder/runner/package.json


# ----------------------------
# Stage 3
FROM build-configuration AS dependency-install
WORKDIR /usr/src/app/digital-form-builder-adapter
USER appuser
RUN --mount=type=cache,target=/usr/src/app/digital-form-builder-adapter/.yarn/cache,uid=1001,mode=0755,id=yarn-cache \
    yarn install --immutable


# ----------------------------
# Stage 4
FROM dependency-install AS parent-configuration
WORKDIR /usr/src/app/digital-form-builder-adapter
USER appuser
COPY --chown=appuser:appuser ../digital-form-builder/designer ./digital-form-builder/designer
COPY --chown=appuser:appuser ../digital-form-builder/model ./digital-form-builder/model
COPY --chown=appuser:appuser ../digital-form-builder/e2e ./digital-form-builder/e2e
COPY --chown=appuser:appuser ../digital-form-builder/queue-model ./digital-form-builder/queue-model
COPY --chown=appuser:appuser ../digital-form-builder/runner ./digital-form-builder/runner
COPY --chown=appuser:appuser ../digital-form-builder/tsconfig.json ./digital-form-builder/tsconfig.json


# ----------------------------
# Stage 5
FROM parent-configuration AS model-build
WORKDIR /usr/src/app/digital-form-builder-adapter
USER appuser
COPY --chown=appuser:appuser ../model ./model
RUN --mount=type=cache,target=/usr/src/app/digital-form-builder-adapter/.yarn/cache,uid=1001,mode=0755,id=yarn-cache \
    yarn digital-form-builder/model build && yarn model build


# ----------------------------
# Stage 6
FROM model-build AS runner-configuration
WORKDIR /usr/src/app/digital-form-builder-adapter
USER appuser
COPY --chown=appuser:appuser ../runner ./runner


# ----------------------------
# Stage 7
FROM runner-configuration AS runner-build
WORKDIR /usr/src/app/digital-form-builder-adapter
USER appuser
RUN --mount=type=cache,target=/usr/src/app/digital-form-builder-adapter/.yarn/cache,uid=1001,mode=0755,id=yarn-cache \
    yarn runner build && yarn runner test-cov


# ----------------------------
# Stage 8
FROM runner-build AS runner-forms
WORKDIR /usr/src/app/digital-form-builder-adapter
USER appuser
COPY --chown=appuser:appuser ../fsd_config ./fsd_config
RUN --mount=type=cache,target=/usr/src/app/digital-form-builder-adapter/.yarn/cache,uid=1001,mode=0755,id=yarn-cache \
    yarn runner copy-forms
CMD ["yarn", "runner", "production"]
