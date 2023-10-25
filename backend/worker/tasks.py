from celery import Celery
import numpy as np
import os
from pathlib import Path

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
    CORRECTED = "RhoA ms881 intenstine 1000Hz unidirectional/0a36b28f-7796-4465-b367-b154aad53253"
    # Mock bucket
    from google.cloud import storage

    def write_to_file(self, file):
        print("USING MOCKED BUCKET")
        from urllib.parse import unquote
        fname = unquote(self.path)
        fname = fname.replace("/b/galatea/o/", "/app/working/")
        dir = Path(fname).parent.absolute()
        if not os.path.exists(dir):
            os.makedirs(dir)

        print("FNAME", fname)
        with open(fname, 'wb') as f:
            f.write(file.read())
    storage.Blob.upload_from_file = write_to_file


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
    flim_data_stack, meta = load_ptfile(f"/app/{BUCKET_FOLDER}/{input_file}")
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
    d1 = np.load(f'/app/{BUCKET_FOLDER}/{source}.npy', mmap_mode='r')
    ex = []
    if excluded:
        ex = [int(i) for i in excluded.split(',')]
    idx = [i for i in range(d1.shape[3]) if i not in ex]
    dat = np.clip(10*d1[:, :, channel, idx, :].sum(axis=(2, 3)), 0, 255).astype(np.uint8)
    return dat


@app.task()
def get_combined_corrected(result_id, excluded):

    ex = []
    if excluded:
        ex = [int(i) for i in excluded.split(',')]

    d1 = np.load(f'/app/{BUCKET_FOLDER}/results/{result_id}-corrected.results', mmap_mode='r')
    idx = [i for i in range(d1.shape[2]) if i not in ex]

    dat = np.clip(10*d1[:, :, idx].sum(axis=(2,)), 0, 255).astype(np.uint8)
    return dat


@app.task()
def get_frame_count(source):
    d1 = np.load(f'/app/{BUCKET_FOLDER}/{source}.npy', mmap_mode='r')  # , np.int8, 'r', shape=(512, 512, 3, 20, 133))
    return d1.shape[-2]


@app.task()
def get_timeseries(source, channel, x, y, excluded=None, box=5):
    box_add = int(box/2)
    xmin = max(x - box_add, 0)
    xmax = min(x + box_add + 1, 512)
    ymin = max(y - box_add, 0)
    ymax = min(y + box_add + 1, 512)

    d1 = np.load(f'/app/{BUCKET_FOLDER}/{source}.npy', mmap_mode='r')
    ex = []
    if excluded:
        ex = [int(i) for i in excluded.split(',')]
    idx = [i for i in range(d1.shape[3]) if i not in ex]
    dat = [int(i) for i in d1[ymin:ymax, xmin:xmax, channel, idx, :].sum(axis=(0, 1, 2))]
    return dat


@app.task()
def get_timeseries_corrected(result_id, channel, x, y, excluded=None, box=5):
    box_add = int(box/2)
    xmin = max(x - box_add, 0)
    xmax = min(x + box_add + 1, 512)
    ymin = max(y - box_add, 0)
    ymax = min(y + box_add + 1, 512)

    d1 = np.load(f'/app/{BUCKET_FOLDER}/results/{result_id}-corrected-flim.results', mmap_mode='r')
    ex = []
    if excluded:
        ex = [int(i) for i in excluded.split(',')]
    idx = [i for i in range(d1.shape[3]) if i not in ex]
    dat = [int(i) for i in d1[ymin:ymax, xmin:xmax, channel, idx, :].sum(axis=(0, 1, 2))]
    return dat


@app.task()
def get_frame(source, channel, idx):
    d1 = np.load(f'/app/{BUCKET_FOLDER}/{source}.npy', mmap_mode='r')
    dat = np.clip(100*d1[:, :, channel, idx, :].sum(axis=-1), 0, 255).astype(np.uint8)
    return dat


@app.task()
def get_frame_corrected(result_id, idx):

    d1 = np.load(f'/app/{BUCKET_FOLDER}/results/{result_id}-corrected.results', mmap_mode='r')
    dat = np.clip(100*d1[:, :, idx], 0, 255).astype(np.uint8)
    return dat


@app.task(bind=True)
def apply_correction(self, source, channel, reference_frame, local_algorithm, local_params, global_algorithm, global_params):
    from motion_correction import calculate_correction, get_intensity_stack, apply_correction_flim
    from motion_correction.algorithms import Phase, Morphic, OpticalILK, OpticalPoly, OpticalTVL1

    alg_map = {
        'phase': Phase,
        'morphic': Morphic,
        'optical_ILK': OpticalILK,
        'optical_poly': OpticalPoly,
        'optical_TVL1': OpticalTVL1,
    }

    if global_algorithm:
        global_algorithm = alg_map[global_algorithm](**(global_params or {}))

    if local_algorithm:
        local_algorithm = alg_map[local_algorithm](**(local_params or {}))

    d1 = np.load(f'/app/{BUCKET_FOLDER}/{source}.npy')
    stack = get_intensity_stack(d1, channel)

    results = calculate_correction(stack, reference_frame, local_algorithm,  global_algorithm)

    print("Finished correction, saving results")

    id = self.request.id

    self.update_state(state='UPLOAD STARTED')

    upload(results['global_corrected_intensity_data_stack'], f"results/{source}/{id}-global-corrected.results", 'np')
    upload(results['corrected_intensity_data_stack'], f"results/{source}/{id}-corrected.results", 'np')
    del results['global_corrected_intensity_data_stack']
    del results['corrected_intensity_data_stack']
    upload(results, f"results/{source}/{id}-results.p")

    print("Finished uploading")


@app.task(bind=True)
def correct_flim(self, source, result_id):
    import pickle
    from motion_correction import apply_correction_flim

    d1 = np.load(f'/app/{BUCKET_FOLDER}/{source}.npy', mmap_mode='r')

    results = pickle.load(open(f"/app/{BUCKET_FOLDER}/results/{source}/{result_id}-results.p", "rb"))

    corrected_flim = apply_correction_flim(d1, results["combined_transforms"])

    self.update_state(state='UPLOAD STARTED')

    upload(corrected_flim, f"results/{source}/{result_id}-corrected-flim.results", 'np')


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
