#!/bin/sh
set -e
ls -l /app

#GOOGLE_APPLICATION_CREDENTIALS=/etc/secret-volume/sa-key.json gcsfuse --implicit-dirs --debug_fuse --debug_fs --debug_gcs --debug_http galatea bucket 


while true
do
    celery -A worker.tasks worker --concurrency 2 &
    inotifywait -e create -e modify /app/worker/tasks.py
    pkill celery
done