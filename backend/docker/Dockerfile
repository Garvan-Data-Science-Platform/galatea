FROM python:3.11.4-slim-bookworm

WORKDIR /app

ENV PYTHONBUFFERED 1
RUN apt-get update && apt-get install inotify-tools procps -y 

COPY requirements.txt .

RUN pip install --no-cache -r requirements.txt

COPY . .

RUN addgroup --system appuser && adduser --system --group appuser && mkdir bucket && chown -R appuser:appuser /app

USER appuser

CMD [ "/app/docker/entrypoint.sh" ]