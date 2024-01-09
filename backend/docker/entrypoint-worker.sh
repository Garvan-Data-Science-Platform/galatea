#!/bin/bash

GOOGLE_APPLICATION_CREDENTIALS=/etc/secret-volume/sa-key.json gcsfuse --implicit-dirs --debug_fuse --debug_fs --debug_gcs --debug_http $BUCKET_NAME bucket 

trap "trap - SIGTERM && kill -- -$$" SIGINT SIGTERM EXIT SIGHUP
set -e
celery -A worker.tasks worker --concurrency 2 &
wait