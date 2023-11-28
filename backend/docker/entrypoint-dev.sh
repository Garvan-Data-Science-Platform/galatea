#!/bin/sh
set -e
ls -l /app
python manage.py makemigrations
python manage.py migrate
python manage.py loaddata /app/docker/dev_seed.json
python manage.py crontab add
service cron start
python manage.py runserver 0.0.0.0:8000