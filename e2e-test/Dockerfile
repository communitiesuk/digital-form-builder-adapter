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
    apk add --no-cache bash git && \
    apk add yq
RUN npm install -g nodemon
RUN npm install -g cypress


# ----------------------------
# Stage 2
# Cache layer contains yarn configurations
# It will re-run only if there is a yarn configuration change
FROM base-image AS yarn-build
WORKDIR /usr/src/app/digital-form-builder-adapter
COPY ../.yarn .yarn
COPY ../.yarnrc.yml .yarnrc.yml


# ----------------------------
# Stage 3
# Cache layer contains digital-form-builder-adapter configurations
# It will re-run only if there is a configuration change
FROM yarn-build AS digital-form-builder-adapter-pre-build
WORKDIR /usr/src/app/digital-form-builder-adapter
COPY .git ./.git
COPY .gitmodules ./.gitmodules
RUN git submodule update --init --recursive
RUN rm -rf .git
RUN rm -rf digital-form-builder/.git
COPY ../package.json package.json
COPY ../tsconfig.json tsconfig.json
COPY ../update-package.js update-package.js
COPY ../yarn.lock yarn.lock
COPY ../designer/package.json ./designer/package.json
COPY ../runner/package.json ./runner/package.json
COPY ../model/package.json ./model/package.json
COPY ../e2e-test/package.json ./e2e-test/package.json


# ----------------------------
# Stage 4
# Cache layer contains digital-form-builder-adapter dependencies
# It will re-run only if there is a dependency change
FROM digital-form-builder-adapter-pre-build AS digital-form-builder-adapter-install
WORKDIR /usr/src/app/digital-form-builder-adapter
RUN --mount=type=cache,target=.yarn/cache,uid=1001,mode=0755,id=digital-form-builder-adapter-install  \
    node update-package.js && yarn setup && yarn install && yarn e2e-test install


# ----------------------------
# Stage 5
# Cache layer contains designer changes
# It will re-run only if there is a e2e change
FROM digital-form-builder-adapter-install AS digital-form-builder-adapter-e2e
WORKDIR /usr/src/app/digital-form-builder-adapter
COPY ../e2e-test ./e2e-test
CMD ["yarn", "e2e-test", "cypress", "run"]
