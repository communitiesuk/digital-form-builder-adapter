FROM ghcr.io/communitiesuk/funding-service-design-form-runner-adapter-base:latest AS base-image

# ----------------------------
# Stage 1
# Cache layer contains model changes
# It will re-run only if there is a model change
FROM base-image AS digital-form-builder-adapter-model-pre-build
WORKDIR /usr/src/app/digital-form-builder-adapter
USER 1001
COPY --chown=appuser:appuser ../model ./model


# ----------------------------
# Stage 2
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
# Stage 3
# Cache layer contains designer changes
# It will re-run only if there is a designer change
FROM digital-form-builder-adapter-model-build AS digital-form-builder-adapter-designer-pre-build
WORKDIR /usr/src/app/digital-form-builder-adapter
USER 1001
COPY --chown=appuser:appuser ../designer ./designer


# ----------------------------
# Stage 4
# Cache layer contains designer build
# It will re-run only if there is a designer change and a build change
FROM digital-form-builder-adapter-designer-pre-build AS digital-form-builder-adapter-designer-build
WORKDIR /usr/src/app/digital-form-builder-adapter
USER 1001
RUN --mount=type=cache,target=.yarn/cache,uid=1001,mode=0755,id=digital-form-builder-build  \
    --mount=type=cache,target=.yarn/cache,uid=1001,mode=0755,id=digital-form-builder-adapter-install  \
    --mount=type=cache,target=.yarn/cache,uid=1001,mode=0755,id=digital-form-builder-adapter-model-build  \
    yarn designer build
CMD ["yarn", "designer", "production"]








