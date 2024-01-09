#!/bin/bash

set -e
ls -l /app
GOOGLE_APPLICATION_CREDENTIALS=/etc/secret-volume/sa-key.json gcsfuse --implicit-dirs --debug_fuse --debug_fs --debug_gcs --debug_http $BUCKET_NAME bucket 
python manage.py makemigrations
python manage.py migrate
python manage.py crontab add
service cron start
trap "trap - SIGTERM && kill -- -$$" SIGINT SIGTERM EXIT SIGHUP
#python manage.py runserver 0.0.0.0:8000 &
gunicorn galatea.wsgi:application --bind 0.0.0.0:8000 -c './gunicorn.conf.py' --worker-class gthread --threads 4 --workers 4 &
wait