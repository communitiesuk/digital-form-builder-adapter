# ----------------------------
# Stage 1
# Base image contains the node version and app user creation
# It also configures the non-root user that will be given permission to copied files/folders in every subsequent stages
FROM node:20-alpine AS base-image
RUN mkdir -p /usr/src/app/digital-form-builder-adapter/runner/public/static && \
    addgroup -g 1001 appuser && \
    adduser -S -u 1001 -G appuser appuser && \
    chown -R appuser:appuser /usr/src/app/digital-form-builder-adapter && \
    chmod -R +x  /usr/src/app/digital-form-builder-adapter && \
    apk update && \
    apk add --no-cache bash git
RUN npm install -g nodemon


# ----------------------------
# Stage 2
# Copy package json and yarn configurations
FROM base-image AS digital-form-builder-adapter-pre-build
WORKDIR /usr/src/app/digital-form-builder-adapter
COPY --chown=appuser:appuser ../.yarn .yarn
COPY --chown=appuser:appuser ../.yarnrc.yml .yarnrc.yml
USER 1001
COPY --chown=appuser:appuser ../package.json package.json
COPY --chown=appuser:appuser ../tsconfig.json tsconfig.json
COPY --chown=appuser:appuser ../digital-form-builder/tsconfig.json ./digital-form-builder/tsconfig.json
COPY --chown=appuser:appuser ../yarn.lock yarn.lock
COPY --chown=appuser:appuser ../designer/package.json ./designer/package.json
COPY --chown=appuser:appuser ../model/package.json ./model/package.json
COPY --chown=appuser:appuser ../digital-form-builder/model/package.json ./digital-form-builder/model/package.json
COPY --chown=appuser:appuser ../digital-form-builder/designer/package.json ./digital-form-builder/designer/package.json


# ----------------------------
# Stage 3
# Copy Project files
FROM digital-form-builder-adapter-pre-build AS digital-form-builder-adapter-code-setup
WORKDIR /usr/src/app/digital-form-builder-adapter
USER 1001
COPY --chown=appuser:appuser ../runner ./runner
COPY --chown=appuser:appuser ../model ./model
COPY --chown=appuser:appuser ../digital-form-builder/runner ./digital-form-builder/runner
COPY --chown=appuser:appuser ../digital-form-builder/model ./digital-form-builder/model
COPY --chown=appuser:appuser ../digital-form-builder/queue-model ./digital-form-builder/queue-model


# ----------------------------
# Stage 4
# Installing the dependencies and building the files
FROM digital-form-builder-adapter-code-setup AS digital-form-builder-dependency-install
WORKDIR /usr/src/app/digital-form-builder-adapter
USER 1001
RUN --mount=type=cache,target=.yarn/cache,uid=1001,mode=0755,id=digital-form-builder-adapter-install  \
    yarn setup-runner


# ----------------------------
# Stage 5
# Run application
FROM digital-form-builder-adapter-runner-post-build AS digital-form-builder-adapter-runner-build
WORKDIR /usr/src/app/digital-form-builder-adapter
USER 1001
CMD ["yarn", "designer", "production"]
