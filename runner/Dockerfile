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
# Copy Project files
FROM base-image AS digital-form-builder-adapter-code-setup
WORKDIR /usr/src/app/digital-form-builder-adapter
USER 1001
COPY --chown=appuser:appuser ../ .


# ----------------------------
# Stage 3
# Installing the dependencies and building the files
FROM digital-form-builder-adapter-code-setup AS digital-form-builder-dependency-install
WORKDIR /usr/src/app/digital-form-builder-adapter
USER 1001
RUN --mount=type=cache,target=.yarn/cache,uid=1001,mode=0755,id=digital-form-builder-adapter-install  \
    yarn setup-runner


# ----------------------------
# Stage 4
# Copy json form configurations
FROM digital-form-builder-dependency-install AS digital-form-builder-adapter-runner-forms-copy
WORKDIR /usr/src/app/digital-form-builder-adapter
USER 1001
RUN yarn runner copy-forms

# ----------------------------
# Stage 5
# copy run content final image
FROM digital-form-builder-adapter-runner-forms-copy
WORKDIR /usr/src/app/digital-form-builder-adapter
USER 1001
CMD ["yarn", "runner", "production"]
