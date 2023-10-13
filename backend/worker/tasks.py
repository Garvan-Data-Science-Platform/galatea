from celery import Celery
import numpy as np
import os

app = Celery('tasks')

app.conf.task_track_started = True
app.conf.worker_prefetch_multiplier = 1
app.conf.task_acks_late = True
app.conf.worker_hijack_root_logger = False
app.conf.result_serializer = 'pickle'
app.conf.accept_content = ['pickle', 'json']


BUCKET_NAME = 'galatea'

flim_ds = '/app/bucket/test_flim.npy'
BUCKET_FOLDER = 'bucket'

if os.getenv('DEV') == 'true':
    flim_ds = '/home/tim/projects/galatea/working/test_flim.npy'
    BUCKET_FOLDER = 'working'
    CORRECTED = "04b200dd-271d-4cd0-beda-cfce1af0c7d3"


@app.task(bind=True)
def convert_pt(self, input_file):
    from motion_correction import load_ptfile

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


@app.task()
def get_combined(source, channel, excluded):
    d1 = np.load(f'/app/{BUCKET_FOLDER}/{source}', mmap_mode='r')
    ex = []
    if excluded:
        ex = [int(i) for i in excluded.split(',')]
    idx = [i for i in range(d1.shape[3]) if i not in ex]
    dat = np.clip(10*d1[:, :, channel, idx, :].sum(axis=(2, 3)), 0, 255).astype(np.uint8)
    return dat


@app.task()
def get_combined_corrected(source, excluded):
    d1 = '/app/{BUCKET_FOLDER}/{CORRECTED}'
    ex = []
    if excluded:
        ex = [int(i) for i in excluded.split(',')]
    idx = [i for i in range(d1.shape[3]) if i not in ex]
    dat = np.clip(10*d1[:, :, channel, idx, :].sum(axis=(2, 3)), 0, 255).astype(np.uint8)
    return dat


@app.task()
def get_frame_count(source):
    d1 = np.load(f'/app/{BUCKET_FOLDER}/{source}', mmap_mode='r')  # , np.int8, 'r', shape=(512, 512, 3, 20, 133))
    return d1.shape[-2]


@app.task()
def get_timeseries(source, channel, x, y, excluded=None, box=5):
    box_add = int(box/2)
    xmin = max(x - box_add, 0)
    xmax = min(x + box_add + 1, 512)
    ymin = max(y - box_add, 0)
    ymax = min(y + box_add + 1, 512)

    d1 = np.load(f'/app/{BUCKET_FOLDER}/{source}', mmap_mode='r')
    ex = []
    if excluded:
        ex = [int(i) for i in excluded.split(',')]
    idx = [i for i in range(d1.shape[3]) if i not in ex]
    dat = [int(i) for i in d1[ymin:ymax, xmin:xmax, channel, idx, :].sum(axis=(0, 1, 2))]
    return dat


@app.task()
def get_frame(source, channel, idx):
    d1 = np.load(f'/app/{BUCKET_FOLDER}/{source}', mmap_mode='r')
    dat = np.clip(100*d1[:, :, channel, idx, :].sum(axis=-1), 0, 255).astype(np.uint8)
    return dat


@app.task()
def get_frame_corrected(result_id, idx):
    result_id = CORRECTED
    d1 = np.load(f'/app/{BUCKET_FOLDER}/results/{result_id}-corrected.npy', mmap_mode='r')
    dat = np.clip(100*d1[:, :, idx], 0, 255).astype(np.uint8)
    return dat


@app.task(bind=True)
def apply_correction(self, source, channel, reference_frame, local_algorithm, local_params, global_algorithm, global_params):
    from motion_correction import calculate_correction, get_intensity_stack

    d1 = np.load(f'/app/{BUCKET_FOLDER}/{source}')
    stack = get_intensity_stack(d1, channel)

    results = calculate_correction(stack, reference_frame, local_algorithm, local_params, global_algorithm, global_params)
    print("Finished correction, saving results")

    id = self.request.id

    self.update_state(state='UPLOAD STARTED')

    upload(results['global_corrected_intensity_data_stack'], f"results/{id}-global-corrected.npy", 'np')
    upload(results['corrected_intensity_data_stack'], f"results/{id}-corrected.npy", 'np')
    del results['global_corrected_intensity_data_stack']
    del results['corrected_intensity_data_stack']
    upload(results, f"results/{id}-results.p")

    print("Finished uploading")


def upload(file, path, mode='pickle'):
    from tempfile import TemporaryFile
    from google.cloud import storage
    import pickle

    storage_client = storage.Client.from_service_account_json(
        "/etc/secret-volume/sa-key.json")
    bucket = storage_client.bucket(BUCKET_NAME)
    blob = bucket.blob(path)
    outfile = TemporaryFile()
    if mode == 'np':
        np.save(outfile, file)
    elif mode == 'pickle':
        pickle.dump(file, outfile)
    outfile.seek(0)
    blob.upload_from_file(outfile)
