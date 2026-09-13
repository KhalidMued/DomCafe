FROM python:3.12-alpine@sha256:b64631e04e4920160c50fbe8d8df828f7f35f06f425cb44aa09bca53e708a35a
WORKDIR /app
RUN apk upgrade --no-cache
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir --upgrade pip==26.2.1 \
    && pip install --no-cache-dir -r requirements.txt
# The running service does not need a package manager or build helpers.
RUN pip uninstall -y pip setuptools msgpack
COPY backend/app ./app
COPY backend/alembic.ini ./alembic.ini
COPY backend/migrations ./migrations
# Seed data reads the brand document; copy only that file, not all docs.
COPY docs/dom_hermes_agent_v1_2.json ./docs/dom_hermes_agent_v1_2.json
# UID 1001 matches the host owner of the bind-mounted ./uploads volume.
ARG APP_UID=1001
RUN adduser -D -u ${APP_UID} appuser \
    && mkdir -p /app/uploads/drinks \
    && chown -R appuser:appuser /app/uploads
USER appuser
EXPOSE 8000
# Only Nginx can reach this container, so trusting all proxy hops is safe;
# Nginx overwrites X-Forwarded-For with the resolved client IP.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers", "--forwarded-allow-ips", "*"]
