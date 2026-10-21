# syntax=docker/dockerfile:1
# Node builds the static files; Caddy serves them (ADR-0003). Base images are pinned by digest.

FROM node:22.22-alpine@sha256:e58326d0d441090181ac150dc2078d3e2cf6a0d42e809aebba3ef5880935ffdd AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM caddy:2.11.7-alpine@sha256:d8542f48d34a9cf4e4c11a478865229840e87e4c96ea3f439101f31a5d35f75f
# The start script writes /srv/config.json, so the served files and Caddy's state belong to the non-root user.
RUN addgroup -S app && adduser -S -G app app \
  && mkdir -p /srv /data /config \
  && chown -R app:app /srv /data /config
COPY --from=build --chown=app:app /app/dist /srv
COPY docker/Caddyfile /etc/caddy/Caddyfile
COPY --chmod=0755 docker/write-config.sh /usr/local/bin/write-config.sh
USER app
ENV API_BASE_URL=/api \
  CSP_CONNECT_SRC=""
EXPOSE 8080
CMD ["/bin/sh", "-c", "write-config.sh /srv/config.json && exec caddy run --config /etc/caddy/Caddyfile --adapter caddyfile"]
