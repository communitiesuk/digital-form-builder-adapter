# ----------------------------
# Stage 1
# Base image contains the node version and app user creation
# It also configures the non-root user that will be given permission to copied files/folders in every subsequent stages
FROM node:20-alpine AS base-image
RUN mkdir -p /usr/src/app/digital-form-builder-adapter/runner/public/static && \
    addgroup -g 1001 builduser && \
    adduser -S -u 1001 -G builduser builduser && \
    addgroup -g 1002 runuser && \
    adduser -S -u 1002 -G runuser runuser && \
    chown -R builduser:builduser /usr/src/app/digital-form-builder-adapter && \
    find /usr/src/app/digital-form-builder-adapter -type d -exec chmod 755 {} \; && \
    apk update && \
    apk add --no-cache bash git


# ----------------------------
# Stage 2
# Cache layer contains yarn configurations
# It will re-run only if there is a yarn configuration change
FROM base-image AS yarn-build
WORKDIR /usr/src/app/digital-form-builder-adapter
USER 1001
COPY --chown=builduser:builduser ../.yarn .yarn
COPY --chown=builduser:builduser ../.yarnrc.yml .yarnrc.yml


# ----------------------------
# Stage 3
# Cache layer contains digital-form-builder-adapter configurations
# It will re-run only if there is a configuration change
FROM yarn-build AS digital-form-builder-adapter-pre-build
WORKDIR /usr/src/app/digital-form-builder-adapter
USER 1001
COPY --chown=builduser:builduser .git ./.git
COPY --chown=builduser:builduser .gitmodules ./.gitmodules
RUN git submodule update --init --recursive
RUN rm -rf .git
RUN rm -rf digital-form-builder/.git
COPY --chown=builduser:builduser ../package.json package.json
COPY --chown=builduser:builduser ../tsconfig.json tsconfig.json
COPY --chown=builduser:builduser ../update-package.js update-package.js
COPY --chown=builduser:builduser ../yarn.lock yarn.lock
COPY --chown=builduser:builduser ../designer/package.json ./designer/package.json
COPY --chown=builduser:builduser ../runner/package.json ./runner/package.json
COPY --chown=builduser:builduser ../model/package.json ./model/package.json


# ----------------------------
# Stage 4
# Cache layer contains digital-form-builder-adapter dependencies
# It will re-run only if there is a dependency change
FROM digital-form-builder-adapter-pre-build AS digital-form-builder-adapter-install
WORKDIR /usr/src/app/digital-form-builder-adapter
USER 1001
RUN --mount=type=cache,target=.yarn/cache,uid=1001,mode=0755,id=digital-form-builder-adapter-install  \
    node update-package.js && yarn setup && yarn install


# ----------------------------
# Stage 5
# Cache layer contains XGovFormBuilder with yarn build with dependencies
# It will re-run only if there is a XGovFormBuilder change
FROM digital-form-builder-adapter-install AS digital-form-builder-build
WORKDIR /usr/src/app/digital-form-builder-adapter
USER 1001
WORKDIR /usr/src/app/digital-form-builder-adapter/digital-form-builder
RUN --mount=type=cache,target=.yarn/cache,uid=1001,mode=0755,id=digital-form-builder-build \
    --mount=type=cache,target=.yarn/cache,uid=1001,mode=0755,id=digital-form-builder-adapter-install  \
    yarn && yarn model build && yarn queue-model build


# ----------------------------
# Stage 6
# Cache layer contains model changes
# It will re-run only if there is a model change
FROM digital-form-builder-build AS digital-form-builder-adapter-model-pre-build
WORKDIR /usr/src/app/digital-form-builder-adapter
USER 1001
COPY --chown=builduser:builduser ../model ./model


# ----------------------------
# Stage 7
# Cache layer contains model build
# It will re-run only if there is a model change and a build change
FROM digital-form-builder-adapter-model-pre-build AS digital-form-builder-adapter-model-build
WORKDIR /usr/src/app/digital-form-builder-adapter
USER 1001
RUN --mount=type=cache,target=.yarn/cache,uid=1001,mode=0755,id=digital-form-builder-build  \
    --mount=type=cache,target=.yarn/cache,uid=1001,mode=0755,id=digital-form-builder-adapter-install  \
    --mount=type=cache,target=.yarn/cache,uid=1001,mode=0755,id=digital-form-builder-adapter-model-build
RUN yarn model build


# ----------------------------
# Stage 8
# Cache layer contains designer changes
# It will re-run only if there is a designer change
FROM digital-form-builder-adapter-model-build AS digital-form-builder-adapter-runner-pre-build
WORKDIR /usr/src/app/digital-form-builder-adapter
USER 1001
COPY --chown=builduser:builduser ../runner ./runner
COPY --chown=builduser:builduser ../fsd_config ./fsd_config


# ----------------------------
# Stage 9
# Cache layer contains designer build
# It will re-run only if there is a designer change and a build change
FROM digital-form-builder-adapter-runner-pre-build AS digital-form-builder-adapter-runner-build
WORKDIR /usr/src/app/digital-form-builder-adapter
RUN --mount=type=cache,target=.yarn/cache,uid=1001,mode=0755,id=digital-form-builder-build  \
    --mount=type=cache,target=.yarn/cache,uid=1001,mode=0755,id=digital-form-builder-adapter-install  \
    --mount=type=cache,target=.yarn/cache,uid=1001,mode=0755,id=digital-form-builder-adapter-model-build  \
    yarn runner build


# ----------------------------
# Stage 10
# Update permissions
RUN find . -type d -exec chmod 755 {} \; && \
    find . -type f -not -path "*/\.*" -exec chmod 644 {} \; && \
    find . -type f -name "*.js" -exec chmod 755 {} \; && \
    find . -type f -name "*.ts" -exec chmod 755 {} \;
USER runuser
CMD ["yarn", "runner", "production"]








