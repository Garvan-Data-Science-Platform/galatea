from celery import Celery

app = Celery('tasks')

app.conf.task_track_started = True
app.conf.worker_prefetch_multiplier = 1
app.conf.task_acks_late = True
app.conf.worker_hijack_root_logger = False
