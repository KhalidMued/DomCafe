FROM python:3.12-slim
WORKDIR /app
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/app ./app
COPY backend/alembic.ini ./alembic.ini
COPY backend/migrations ./migrations
# Seed data reads the brand document; copy only that file, not all docs.
COPY docs/dom_hermes_agent_v1_2.json ./docs/dom_hermes_agent_v1_2.json
# UID 1001 matches the host owner of the bind-mounted ./uploads volume.
ARG APP_UID=1001
RUN useradd --create-home --uid ${APP_UID} appuser \
    && mkdir -p /app/uploads/drinks \
    && chown -R appuser:appuser /app/uploads
USER appuser
EXPOSE 8000
# Only Nginx can reach this container, so trusting all proxy hops is safe;
# Nginx overwrites X-Forwarded-For with the resolved client IP.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers", "--forwarded-allow-ips", "*"]
