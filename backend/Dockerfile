FROM python:3.11.4-slim-bookworm

WORKDIR /app

ENV PYTHONBUFFERED 1

COPY requirements.txt .

RUN pip install --no-cache -r requirements.txt

COPY . .

RUN addgroup --system appuser && adduser --system --group appuser
RUN chown -R appuser:appuser /app
USER appuser

CMD [ "/app/entrypoint.sh" ]