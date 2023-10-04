from celery import Celery


app = Celery('tasks')

app.conf.task_track_started = True
app.conf.worker_prefetch_multiplier = 1
app.conf.task_acks_late = True
app.conf.worker_hijack_root_logger = False

BUCKET_NAME = 'galatea'


@app.task(bind=True)
def convert_pt(self, input_file):
    from .pqreader import load_ptfile

    import numpy as np
    from tempfile import TemporaryFile

    if input_file[-3:].lower() not in ["pt3", "ptu"]:
        raise Exception('Input must be pt3 or ptu')

    output_file = input_file[:-3] + 'npy'

    from google.cloud import storage
    storage_client = storage.Client.from_service_account_json(
        "/etc/secret-volume/sa-key.json")

    bucket = storage_client.bucket(BUCKET_NAME)
    blob = bucket.blob(output_file)
    outfile = TemporaryFile()
    print("Converting")
    flim_data_stack, meta = load_ptfile(f"/app/bucket/{input_file}")
    print("Finished conversion, uploading")

    np.save(outfile, flim_data_stack)

    outfile.seek(0)

    self.update_state(state='UPLOAD STARTED')

    blob.upload_from_file(outfile)

    print("Finished uploading")

    # from .pqreader import load_ptfile

    # flim_data_stack = load_ptfile("/app/bucket/"+input_file)

    # np.save(f"/app/bucket/{input_file[:-3]}.npy", flim_data_stack)


@app.task(bind=True)
def test_task(self):
    import time
    n = 30
    for i in range(0, n):
        self.update_state(state='PROGRESS', meta={'done': i, 'total': n})
        time.sleep(1)
