FROM python:3.11.4-slim-bookworm

WORKDIR /app

ENV PYTHONBUFFERED 1

RUN apt-get update && apt-get install curl lsb-release gnupg2 ffmpeg libsm6 libxext6 cron -y && \
    GCSFUSE_REPO=gcsfuse-`lsb_release -c -s` && \
    echo "deb https://packages.cloud.google.com/apt $GCSFUSE_REPO main" | tee /etc/apt/sources.list.d/gcsfuse.list && \
    curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | apt-key add - && \
    apt-get update && \
    apt-get install gcsfuse inotify-tools procps -y 

COPY requirements.txt .

RUN pip install --no-cache -r requirements.txt

COPY . .

#RUN addgroup --system appuser && adduser --system --group appuser && mkdir bucket && chown -R appuser:appuser /app

#USER appuser

RUN mkdir bucket

CMD [ "/app/docker/entrypoint.sh" ]