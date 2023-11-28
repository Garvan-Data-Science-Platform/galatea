from celery import Celery
import numpy as np
import os
from pathlib import Path
import shutil
from google.cloud import storage

app = Celery('tasks')

app.conf.task_track_started = True
app.conf.worker_prefetch_multiplier = 1
app.conf.task_acks_late = False
app.conf.worker_hijack_root_logger = False
app.conf.result_serializer = 'pickle'
app.conf.accept_content = ['pickle', 'json']


BUCKET_NAME = 'galatea'

flim_ds = '/app/bucket/test_flim.npy'
BUCKET_FOLDER = 'bucket'
DEV = os.getenv('DEV') == 'true'


if DEV:

    BUCKET_FOLDER = 'working'

    # Mock bucket

    def write_to_file(self, file):
        print("USING MOCKED BUCKET")
        from urllib.parse import unquote
        fname = "/app/working/" + self.name
        dir = Path(fname).parent.absolute()
        if not os.path.exists(dir):
            os.makedirs(dir)

        print("FNAME", fname)
        with open(fname, 'wb') as f:
            f.write(file.read())

    storage.Blob.upload_from_file = write_to_file

    class DummyBucket:
        def blob(self, filename):
            return storage.Blob(name=filename, bucket=BUCKET_NAME)

    class DummyClient:
        def bucket(self, bucket_name):
            return DummyBucket()

    storage_client = DummyClient()
else:
    storage_client = storage.Client.from_service_account_json(
        "/etc/secret-volume/sa-key.json")


def copy_bucket_tmp(file):

    tmppath = f'/data/{file.split("/")[-1]}'
    if not os.path.exists(tmppath):

        print("Copying from bucket")

        if DEV:
            shutil.copyfile(f'/app/{BUCKET_FOLDER}/{file}', tmppath)
        else:
            from google.cloud import storage

            bucket = storage_client.bucket(BUCKET_NAME)
            blob = bucket.blob(file)
            blob.download_to_filename(tmppath)
            # shutil.copyfile(f'/app/{BUCKET_FOLDER}/{file}', tmppath)
        print("Done copying")


@app.task(bind=True)
def convert_pt(self, input_file):
    from motion_correction import load_ptfile

    import numpy as np
    from tempfile import TemporaryFile

    if input_file[-3:].lower() not in ["pt3", "ptu"]:
        raise Exception('Input must be pt3 or ptu')

    output_file = input_file[:-3] + 'npy'
    bucket = storage_client.bucket(BUCKET_NAME)

    # Save npy
    self.update_state(state='Converting pt3 file')

    def cb(x):
        self.update_state(state=f'Converting pt3 file: {round(x*100)}%')

    dest = f'/data/{output_file}'
    if DEV:
        dest = f"/app/{BUCKET_FOLDER}/{output_file}"

    flim_data_stack, meta = load_ptfile(f"/app/{BUCKET_FOLDER}/{input_file}", is_raw=False, gcs=not DEV, progress_cb=cb, destination_file=dest)

    if not DEV:
        self.update_state(state='Uploading results')
        blob = bucket.blob(output_file)
        blob.upload_from_filename(dest)

    # meta
    blob = bucket.blob(output_file.replace('.npy', '.meta.p'))
    outfile = TemporaryFile()
    import pickle
    pickle.dump(meta, outfile)
    outfile.seek(0)
    blob.upload_from_file(outfile)
    print("Finished uploading")

    self.update_state(state='Generating combined result')

    # Intensity
    # dat = np.zeros((flim_data_stack.shape[0], flim_data_stack.shape[1], flim_data_stack.shape[2]), dtype=np.uint8)
    dat = flim_data_stack.sum(axis=-1)
    # dat = np.clip(10*dat, 0, 255).astype(np.uint8)

    self.update_state(state='Uploading intensity result')

    blob = bucket.blob(output_file.replace('.npy', '.intensity'))
    outfile = TemporaryFile()
    import pickle
    np.save(outfile, dat)
    outfile.seek(0)
    blob.upload_from_file(outfile)

    # from .pqreader import load_ptfile

    # flim_data_stack = load_ptfile("/app/bucket/"+input_file)

    # np.save(f"/app/bucket/{input_file[:-3]}.npy", flim_data_stack)


@app.task()
def get_combined(source, channel, excluded):

    ex = []
    if excluded:
        ex = [int(i) for i in excluded.split(',')]

    d1 = np.load(f'/app/{BUCKET_FOLDER}/{source}.intensity')

    idx = [i for i in range(d1.shape[3]) if i not in ex]

    combined = d1[:, :, channel, idx].sum(axis=(2,))

    dat = np.clip(255*combined/np.percentile(combined, 98), 0, 255).astype(np.uint8)

    return dat


@app.task()
def get_combined_corrected(result_path, excluded):

    ex = []
    if excluded:
        ex = [int(i) for i in excluded.split(',')]

    d1 = np.load(f'/app/{BUCKET_FOLDER}/results/{result_path}-corrected.results', mmap_mode='r')
    idx = [i for i in range(d1.shape[2]) if i not in ex]

    dat = np.clip(10*d1[:, :, idx].sum(axis=(2,)), 0, 255).astype(np.uint8)
    return dat


@app.task()
def get_metrics(result_path):
    import pickle

    results = pickle.load(open(f"/app/{BUCKET_FOLDER}/results/{result_path}-results.p", "rb"))
    # print(results['metrics']['mse'])
    return results["metrics"]


@app.task()
def get_frame_count(source):
    d1 = np.load(f'/app/{BUCKET_FOLDER}/{source}.npy', mmap_mode='r')  # , np.int8, 'r', shape=(512, 512, 3, 20, 133))
    return d1.shape[-2]


@app.task()
def get_channel_count(source):
    d1 = np.load(f'/app/{BUCKET_FOLDER}/{source}.npy', mmap_mode='r')  # , np.int8, 'r', shape=(512, 512, 3, 20, 133))
    return d1.shape[2]


@app.task()
def get_timeseries(source, channel, x, y, excluded=None, box=5):
    print("GETTING TIME SERIES")

    d1 = np.load(f'/app/{BUCKET_FOLDER}/{source}.npy', mmap_mode='r')

    x = int(x * d1.shape[0] / 512)
    y = int(y * d1.shape[1] / 512)

    box_add = int(box/2*d1.shape[0]/512)
    xmin = max(x - box_add, 0)
    xmax = min(x + box_add + 1, d1.shape[0])
    ymin = max(y - box_add, 0)
    ymax = min(y + box_add + 1, d1.shape[1])

    ex = []
    if excluded:
        ex = [int(i) for i in excluded.split(',')]
    idx = [i for i in range(d1.shape[3]) if i not in ex]
    dat = [int(i) for i in d1[ymin:ymax, xmin:xmax, channel, idx, :].sum(axis=(0, 1, 2))]
    return dat


@app.task()
def get_timeseries_corrected(result_path, channel, x, y, excluded=None, box=5):
    box_add = int(box/2)
    xmin = max(x - box_add, 0)
    xmax = min(x + box_add + 1, 512)
    ymin = max(y - box_add, 0)
    ymax = min(y + box_add + 1, 512)

    d1 = np.load(f'/app/{BUCKET_FOLDER}/results/{result_path}-corrected-flim.results', mmap_mode='r')
    ex = []
    if excluded:
        ex = [int(i) for i in excluded.split(',')]
    idx = [i for i in range(d1.shape[3]) if i not in ex]
    dat = [int(i) for i in d1[ymin:ymax, xmin:xmax, channel, idx, :].sum(axis=(0, 1, 2))]
    return dat


@app.task()
def get_frame(source, channel, idx):
    print("GETTING FRAME")
    copy_bucket_tmp(f'{source}.npy')
    d1 = np.load(f'/data/{source}.npy', mmap_mode='r')
    dat = np.clip(100*d1[:, :, channel, idx, :].sum(axis=-1), 0, 255).astype(np.uint8)
    print("DONE GETTING FRAME")
    return dat


@app.task()
def preload(source):
    copy_bucket_tmp(f'{source}.npy')


@app.task()
def get_frame_corrected(result_path, idx):

    d1 = np.load(f'/app/{BUCKET_FOLDER}/results/{result_path}-corrected.results', mmap_mode='r')
    dat = np.clip(100*d1[:, :, idx], 0, 255).astype(np.uint8)
    return dat


@app.task(bind=True)
def apply_correction(self, source, channel, reference_frame, local_algorithm, local_params, global_algorithm, global_params):
    print("APPLYING CORRECTION")
    from motion_correction import calculate_correction, get_intensity_stack, apply_correction_flim
    from motion_correction.algorithms import Phase, Morphic, OpticalILK, OpticalPoly, OpticalTVL1

    copy_bucket_tmp(f'{source}.npy')
    d1 = np.load(f'/data/{source}.npy', mmap_mode='r')

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

    stack = get_intensity_stack(d1, channel)

    results = calculate_correction(stack, reference_frame, local_algorithm,  global_algorithm)

    id = self.request.id

    self.update_state(state='Finished correction, saving results')

    upload(results['global_corrected_intensity_data_stack'], f"results/{source}/{id}-global-corrected.results", 'np')
    upload(results['corrected_intensity_data_stack'], f"results/{source}/{id}-corrected.results", 'np')
    del results['global_corrected_intensity_data_stack']
    del results['corrected_intensity_data_stack']
    upload(results, f"results/{source}/{id}-results.p")


@app.task(bind=True)
def correct_flim(self, source, result_id):
    import pickle
    from motion_correction import apply_correction_flim

    d1 = np.load(f'/app/{BUCKET_FOLDER}/{source}.npy', mmap_mode='r')

    results = pickle.load(open(f"/app/{BUCKET_FOLDER}/results/{source}/{result_id}-results.p", "rb"))

    corrected_flim = apply_correction_flim(d1, results["combined_transforms"])

    self.update_state(state='UPLOAD STARTED')

    upload(corrected_flim, f"results/{source}/{result_id}-corrected-flim.results", 'np')


@app.task(bind=True)
def write_pt3(self, source, result_id, excluded=False):
    import pickle
    from motion_correction import write_pt3, apply_correction_flim

    correct_flim = not os.path.isfile(f'/app/{BUCKET_FOLDER}/results/{source}/{result_id}-corrected-flim.results')

    d1 = np.load(f'/app/{BUCKET_FOLDER}/{source}.npy', mmap_mode='r')
    meta = pickle.load(open(f'/app/{BUCKET_FOLDER}/{source}.meta.p', 'rb'))

    ex = []
    if excluded:
        ex = [int(i) for i in excluded.split(',')]

    idx = [i for i in range(d1.shape[3]) if i not in ex]

    if correct_flim:
        self.update_state(state='Aligning flim image')
        results = pickle.load(open(f"/app/{BUCKET_FOLDER}/results/{source}/{result_id}-results.p", "rb"))
        corrected_flim = apply_correction_flim(d1, results["combined_transforms"])
        upload(corrected_flim, f"results/{source}/{result_id}-corrected-flim.results", 'np')
    else:
        corrected_flim = np.load(f'/app/{BUCKET_FOLDER}/results/{source}/{result_id}-corrected-flim.results', mmap_mode='r')
    self.update_state(state='Writing to .PT3')

    write_pt3(meta, corrected_flim[:, :, :, idx], f'/app/{BUCKET_FOLDER}/results/{source}/{source}-{result_id}-corrected.pt3')


def upload(file, path, mode='pickle'):
    from tempfile import TemporaryFile
    from google.cloud import storage
    import pickle

    bucket = storage_client.bucket(BUCKET_NAME)
    blob = bucket.blob(path)
    outfile = TemporaryFile()
    if mode == 'np':
        np.save(outfile, file)
    elif mode == 'pickle':
        pickle.dump(file, outfile)
    outfile.seek(0)
    blob.upload_from_file(outfile)
