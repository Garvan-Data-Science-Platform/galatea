#!/bin/sh
set -e
ls -l /app
GOOGLE_APPLICATION_CREDENTIALS=/etc/secret-volume/sa-key.json gcsfuse --debug_fuse --debug_fs --debug_gcs --debug_http galatea bucket 
python manage.py makemigrations
python manage.py migrate
python manage.py runserver 0.0.0.0:8000