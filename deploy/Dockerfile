FROM nginx@sha256:bc45d248c4e1d1709321de61566eb2b64d4f0e32765239d66573666be7f13349

COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY dist/ /usr/share/nginx/html/

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl --fail --silent --show-error http://127.0.0.1:8080/healthz || exit 1
