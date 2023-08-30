FROM python:3.11.4-slim-bookworm

WORKDIR /app

ENV PYTHONBUFFERED 1
ENV DJANGO_SETTINGS_MODULE "galatea.production_settings"

RUN apt-get update && apt-get install curl lsb-release gnupg2 -y && \
    GCSFUSE_REPO=gcsfuse-`lsb_release -c -s` && \
    echo "deb https://packages.cloud.google.com/apt $GCSFUSE_REPO main" | tee /etc/apt/sources.list.d/gcsfuse.list && \
    curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | apt-key add - && \
    apt-get update && \
    apt-get install gcsfuse -y

#COPY galatea-key.json .

COPY requirements.txt .

RUN pip install --no-cache -r requirements.txt

COPY . .

RUN addgroup --system appuser && adduser --system --group appuser && mkdir bucket && chown -R appuser:appuser /app

USER appuser

CMD [ "/app/entrypoint.sh" ]