FROM ghcr.io/communitiesuk/funding-service-design-form-runner-adapter-base:latest AS base-image

# ----------------------------
# Stage 6
# Cache layer contains model changes
# It will re-run only if there is a model change
FROM base-image AS digital-form-builder-adapter-model-pre-build
WORKDIR /usr/src/app/digital-form-builder-adapter
USER 1001
COPY --chown=appuser:appuser ../model ./model


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
COPY --chown=appuser:appuser ../runner ./runner
COPY --chown=appuser:appuser ../fsd_config ./fsd_config

# ----------------------------
# Stage 9
# Run unit test in the docker build
FROM digital-form-builder-adapter-runner-pre-build AS digital-form-builder-adapter-runner-unit-test
WORKDIR /usr/src/app/digital-form-builder-adapter
RUN --mount=type=cache,target=.yarn/cache,uid=1001,mode=0755,id=digital-form-builder-build  \
    --mount=type=cache,target=.yarn/cache,uid=1001,mode=0755,id=digital-form-builder-adapter-install  \
    --mount=type=cache,target=.yarn/cache,uid=1001,mode=0755,id=digital-form-builder-adapter-model-build  \
    yarn runner test-cov
USER appuser

# ----------------------------
# Stage 10
# Cache layer contains designer build
# It will re-run only if there is a designer change and a build change
FROM digital-form-builder-adapter-runner-unit-test AS digital-form-builder-adapter-runner-build
WORKDIR /usr/src/app/digital-form-builder-adapter
RUN --mount=type=cache,target=.yarn/cache,uid=1001,mode=0755,id=digital-form-builder-build  \
    --mount=type=cache,target=.yarn/cache,uid=1001,mode=0755,id=digital-form-builder-adapter-install  \
    --mount=type=cache,target=.yarn/cache,uid=1001,mode=0755,id=digital-form-builder-adapter-model-build  \
    yarn runner build
USER appuser
CMD ["yarn", "runner", "production"]








