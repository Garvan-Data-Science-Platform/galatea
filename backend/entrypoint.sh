#!/bin/sh
set -e
python manage.py makemigrations
python manage.py migrate
gunicorn galatea.wsgi:application --bind 0.0.0.0:8000