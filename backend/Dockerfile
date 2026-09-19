# syntax=docker/dockerfile:1.7
FROM python:3.12-slim-bookworm

WORKDIR /app

# psycopg2-binary and all other deps ship precompiled wheels, so no gcc/
# libpq-dev/build-essential are needed here -- that was the slow step before.
COPY requirements.txt .
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --no-cache-dir -r requirements.txt

COPY . .

RUN mkdir -p /app/uploads

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
