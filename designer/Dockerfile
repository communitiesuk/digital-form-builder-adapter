# ----------------------------
# Stage 1
FROM node:20-alpine AS base-image

ARG INSTALL_NODEMON=false

RUN mkdir -p /usr/src/app/digital-form-builder-adapter && \
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
COPY --chown=appuser:appuser .git ./.git
COPY --chown=appuser:appuser .gitmodules ./.gitmodules
RUN git submodule update --init --recursive
RUN rm -rf .git
RUN rm -rf .git digital-form-builder/.git digital-form-builder/yarn.lock
COPY --chown=appuser:appuser ../.yarn .yarn
COPY --chown=appuser:appuser ../.yarnrc.yml .yarnrc.yml
COPY --chown=appuser:appuser ../package.json package.json
COPY --chown=appuser:appuser ../tsconfig.json tsconfig.json
COPY --chown=appuser:appuser ../yarn.lock yarn.lock
COPY --chown=appuser:appuser ../designer/package.json ./designer/package.json
COPY --chown=appuser:appuser ../runner/package.json ./runner/package.json
COPY --chown=appuser:appuser ../model/package.json ./model/package.json
COPY --chown=appuser:appuser ../designer/package.json ./designer/package.json


# ----------------------------
# Stage 3
FROM build-configuration AS dependency-install
WORKDIR /usr/src/app/digital-form-builder-adapter
USER 1001
RUN --mount=type=cache,target=.yarn/cache,uid=1001,mode=0755,id=digital-form-builder-adapter-install  \
    yarn install


# ----------------------------
# Stage 4
FROM dependency-install AS model-build
WORKDIR /usr/src/app/digital-form-builder-adapter
USER appuser
COPY --chown=appuser:appuser ../model ./model
RUN --mount=type=cache,target=.yarn/cache,uid=1001,mode=0755,id=digital-form-builder-build  \
    --mount=type=cache,target=.yarn/cache,uid=1001,mode=0755,id=digital-form-builder-adapter-install  \
    --mount=type=cache,target=.yarn/cache,uid=1001,mode=0755,id=digital-form-builder-adapter-model-build
RUN yarn digital-form-builder/model build && yarn model build


# ----------------------------
# Stage 5
FROM model-build AS designer-configuration
WORKDIR /usr/src/app/digital-form-builder-adapter
USER 1001
COPY --chown=appuser:appuser ../designer ./designer


# ----------------------------
# Stage 6
FROM designer-configuration AS designer-start
WORKDIR /usr/src/app/digital-form-builder-adapter
USER 1001
RUN --mount=type=cache,target=.yarn/cache,uid=1001,mode=0755,id=digital-form-builder-build  \
    --mount=type=cache,target=.yarn/cache,uid=1001,mode=0755,id=digital-form-builder-adapter-install  \
    --mount=type=cache,target=.yarn/cache,uid=1001,mode=0755,id=digital-form-builder-adapter-model-build  \
    yarn designer build
CMD ["yarn", "designer", "production"]








