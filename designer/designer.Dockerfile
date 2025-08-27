FROM node:20-alpine
RUN addgroup -g 1001 appuser && adduser -S -u 1001 -G appuser appuser && apk add --no-cache bash
USER appuser
WORKDIR /usr/src/app/digital-form-builder-adapter

COPY --chown=appuser:appuser ../package.json ./
COPY --chown=appuser:appuser ../node_modules ./node_modules
COPY --chown=appuser:appuser ../digital-form-builder/model ./digital-form-builder/model
COPY --chown=appuser:appuser ../digital-form-builder/designer ./digital-form-builder/designer
COPY --chown=appuser:appuser ../model ./model
COPY --chown=appuser:appuser ../designer ./designer

CMD ["yarn", "runner", "production"]
