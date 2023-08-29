#!/bin/sh
set -e
ls -l /app
whoami
GOOGLE_APPLICATION_CREDENTIALS=/etc/secret-volume/sa-key.json gcsfuse --debug_fuse --debug_fs --debug_gcs --debug_http galatea bucket 
python manage.py makemigrations
python manage.py migrate
gunicorn galatea.wsgi:application --bind 0.0.0.0:8000