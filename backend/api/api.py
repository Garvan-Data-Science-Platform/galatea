from io import BytesIO
from ninja import NinjaAPI, Schema, File
from ninja.files import UploadedFile
from ninja.errors import AuthenticationError, ValidationError
from google.cloud import storage
from galatea.auth import AuthBearer
from .schemas import BucketFileList
from typing import List
import datetime
from django.http import HttpResponse, FileResponse
from django.utils.cache import patch_cache_control, patch_response_headers
import numpy as np
from PIL import Image, ImageOps
from django.conf import settings
from django.contrib.auth.decorators import permission_required
from worker.tasks import app, correct_flim, convert_pt, preload, write_pt3, get_metrics, get_channel_count, get_frame, get_frame_corrected, get_timeseries, get_timeseries_corrected, get_combined, get_combined_corrected, get_frame_count, apply_correction, app as celery_app
from celery.result import AsyncResult
from .models import Result
from ninja.renderers import BaseRenderer
from ninja.responses import NinjaJSONEncoder
import json
import os


class NumpyEncoder(NinjaJSONEncoder):

    def default(self, obj):
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        if isinstance(obj, dict):
            for key, val in obj:
                obj[key] = default(val)
        return super().default(obj)


class NumpyRenderer(BaseRenderer):
    media_type = "application/json"

    def render(self, request, data, *, response_status):
        return json.dumps(data, cls=NumpyEncoder)


api = NinjaAPI(renderer=NumpyRenderer())

BUCKET_FOLDER = 'bucket'
NODE_NAME = os.getenv("NODE_NAME")
BUCKET_NAME = os.getenv("BUCKET_NAME","galatea")

if os.getenv('DEV') == 'true':
    def mock_perm(*args, **kwargs):
        def inner(func):
            return func
        return inner
    permission_required = mock_perm

    def mock_auth():
        return None
    AuthBearer = mock_auth

    flim_ds = '/home/tim/projects/galatea/working/test_flim.npy'
    BUCKET_FOLDER = 'working'
    FLOWER_CONN = "http://flower:5555"
    import os

    class MockBucketList(list):
        def __init__(self, ls):
            super().__init__(ls)
            self.prefixes = []
            to_rem = []
            for b in ls:
                if os.path.isdir(f'/app/working/{b.name}'):
                    self.prefixes.append(b.name)
                    to_rem.append(b)
            for b in to_rem:
                print("removing", b)
                self.remove(b)
            print(self)

    class MockBucket:

        def __init__(self, name):
            self.name = name
            return

        def blob(self, filename):
            return MockBlob(name=filename)

    class MockBlob():
        def __init__(self, name):
            self.name = name
            self.url = "test-upload"

        def __str__(self):
            return self.name

        def generate_signed_url(self, version, expiration, method, content_type=None):
            return "test-upload"

    def mock_bucket(bucket, delimiter, prefix):
        print("USING MOCK BUCKET")
        return MockBucketList([MockBlob(x) for x in os.listdir(f'/app/working/{prefix or ""}')])
    storage_client = storage.Client
    storage_client.list_blobs = mock_bucket
    storage_client.get_bucket = MockBucket

else:
    FLOWER_HOSTNAME = os.getenv('FLOWER_HOSTNAME')
    FLOWER_PASSWORD = os.getenv('FLOWER_PASSWORD')
    FLOWER_CONN = f"http://galatea:{FLOWER_PASSWORD}@{FLOWER_HOSTNAME}:5555"
    storage_client = storage.Client.from_service_account_json(
        "/etc/secret-volume/sa-key.json")


@api.get('/')
def health_check(request):

    return {"status": "ok"}


@api.get('/idle', auth=AuthBearer())
@permission_required("api.access", raise_exception=True)
def idle(request):

    import requests
    import datetime

    r = requests.get(FLOWER_CONN+"/api/tasks?limit=1&sort_by=-received")
    task = r.json()
    print(task)
    time = 0  # Mins
    if task:  # If latest task is finished, check how long since it started
        task = list(task.values())[0]
        if task['state'] in ["FAILURE", "SUCCESS"]:
            time = (datetime.datetime.utcnow().timestamp() - task['timestamp'])/3600
    # print(r.json())

    return {"DELAY": time}


@api.get('/workers', auth=AuthBearer())
@permission_required("api.access", raise_exception=True)
def workers(request):

    import requests

    r = requests.get(FLOWER_CONN + "/api/workers?refresh=true&status=true")
    workers = r.json()
    workersup = [w for w in workers.keys() if workers[w]]
    uptime = 0
    if workersup:
        uptime = 999999
        r = requests.get(FLOWER_CONN + "/api/workers?refresh=true")
        workers = r.json()
        for w in workersup:
            try:
                u = workers[w]['stats']['uptime']
            except:
                u = 0
            if u < uptime:
                uptime = u

    return {"workers": bool(workersup), "uptime": uptime}


@api.get('/down', auth=AuthBearer())
@permission_required("api.access", raise_exception=True)
def down(request):
    from google.cloud import container_v1

    client = container_v1.ClusterManagerClient.from_service_account_file(
        "/etc/secret-volume/sa-key.json")

    # Initialize request argument(s)
    request = container_v1.SetNodePoolSizeRequest(
        node_count=0,
        name=NODE_NAME
    )

    # Make the request
    response = client.set_node_pool_size(request=request)

    # Handle the response
    print(response)
    return {"status": "ok"}


@api.get('/up', auth=AuthBearer())
@permission_required("api.access", raise_exception=True)
def up(request):
    from google.cloud import container_v1

    client = container_v1.ClusterManagerClient.from_service_account_file(
        "/etc/secret-volume/sa-key.json")

    # Initialize request argument(s)

    request = container_v1.SetNodePoolSizeRequest(
        node_count=1,
        name=NODE_NAME
    )

    # Make the request
    try:
        response = client.set_node_pool_size(request=request)
    except Exception:
        response = client.list_operations(request=container_v1.ListOperationsRequest(
            parent='projects/galatea-396601/locations/australia-southeast1-a/'))
        # Handle the response
        ops = list(filter(lambda x: x.status != 3, list(response.operations)))
        return {"status": "ok", "operation_id": ops[0].name}

    return {"status": "ok", "operation_id": response.name}


@api.get('/operation/{operation_id}', auth=AuthBearer())
@permission_required("api.access", raise_exception=True)
def operation(request, operation_id):
    from google.cloud import container_v1

    client = container_v1.ClusterManagerClient.from_service_account_file(
        "/etc/secret-volume/sa-key.json")

    # Make the request
    response = client.get_operation(
        name=f"projects/galatea-396601/locations/australia-southeast1-a/operations/{operation_id}")

    return {"status": response.status}


@api.get('/operations', auth=AuthBearer())
@permission_required("api.access", raise_exception=True)
def operations(request):
    from google.cloud import container_v1

    client = container_v1.ClusterManagerClient.from_service_account_file(
        "/etc/secret-volume/sa-key.json")

    # Make the request
    response = client.list_operations(request=container_v1.ListOperationsRequest(parent='projects/galatea-396601/locations/australia-southeast1-a/'))

    # Handle the response

    ops = list(filter(lambda x: x.status != 3, list(response.operations)))
    return {"status": "ok", "ops": ops}


@api.get('/nodepool-size', auth=AuthBearer())
@permission_required("api.access", raise_exception=True)
def size(request):
    from google.cloud import container_v1

    client = container_v1.ClusterManagerClient.from_service_account_file(
        "/etc/secret-volume/sa-key.json")

    # Make the request
    response = client.get_cluster(
        name=NODE_NAME)

    # Handle the response
    print(response.current_node_count)
    return {"status": "ok"}


@api.get('/error', auth=AuthBearer())
@permission_required("api.access", raise_exception=True)
def err(request):

    raise ValueError("VALUE ERROR")

    return {"status": "ok"}


@api.post('/preload', auth=AuthBearer())
@permission_required("api.access", raise_exception=True)
def preload_file(request, source):

    res = preload.delay(source)

    return {"status": "ok", "task_id": res.id}


@api.post('/test-upload', auth=AuthBearer())
@permission_required("api.access", raise_exception=True)
def test_upload(request, file: UploadedFile):
    with open(f'/app/{BUCKET_FOLDER}/{file.name}', 'wb') as f:
        f.write(file.read())

@api.get("/bucket", response=BucketFileList, auth=AuthBearer())
@permission_required("api.access", raise_exception=True)
def list_bucket(request, subdir: str | None = None, limit: int | None = None):
    if subdir:
        prefix = subdir + "/"
    else:
        prefix = None

    if limit is None:
        limit = -1

    results = storage_client.list_blobs(BUCKET_NAME, delimiter="/", prefix=prefix)
    blobs = [r for i, r in enumerate(results) if i < limit and r.name != str(subdir) + '/']
    files = [{'name': b.name, 'url': b.generate_signed_url(version='v4', expiration=datetime.timedelta(minutes=15), method='GET')} for b in blobs]
    folders: List[str] = list(results.prefixes)
    if '/' in folders:
        folders.remove('/')

    return {"files": files, "folders": folders}


@api.put("/bucket", auth=AuthBearer())
@permission_required("api.access", raise_exception=True)
def create_folder(request, folderName: str):
    """Create new folder in bucket"""

    bucket = storage_client.get_bucket(BUCKET_NAME)
    if folderName[-1] != '/':
        folderName = folderName + '/'
    blob = bucket.blob(folderName)
    blob.upload_from_string('', content_type='application/x-www-form-urlencoded;charset=UTF-8')

    return {"status": "ok"}


@api.delete("/bucket/folder", auth=AuthBearer())
@permission_required("api.access", raise_exception=True)
def delete_folder(request, folderName: str):
    """Delete a folder from the bucket"""

    bucket = storage_client.get_bucket(BUCKET_NAME)
    blobs = bucket.list_blobs(prefix=folderName)
    for b in blobs:
        b.delete()

    return {"status": "ok"}


@api.get("/bucket/upload", auth=AuthBearer())
@permission_required("api.access", raise_exception=True)
def get_upload_url(request, path: str):
    """Get a signed upload URL"""

    if os.getenv("DEV") == 'true':
        return {"url": request.build_absolute_uri('/test-upload')}

    bucket = storage_client.get_bucket(BUCKET_NAME)
    blob = bucket.blob(path)
    url = blob.generate_signed_url(
        version="v4",
        # This URL is valid for 15 minutes
        expiration=datetime.timedelta(minutes=15),
        # Allow PUT requests using this URL.
        method="PUT",
        #content_type="application/octet-stream",
    )

    return {"url": url}


@api.post("/convert-pt", auth=AuthBearer())
@permission_required("api.access", raise_exception=True)
def convert_pt_file(request, path: str):
    """Converts a pt3 or ptu file to numpy array for use with Galatea
    - ***path***: name of blob in bucket, must be .pt3 or .ptu file
    """

    if path[-3:] not in ['pt3', 'ptu']:
        raise ValidationError("Input path must be '.pt3 or .ptu'")

    result = convert_pt.apply_async((path,))

    return {"task_id": result.id}


@api.get('/status/{task_id}', auth=AuthBearer())
@permission_required("api.access", raise_exception=True)
def task_status(request, task_id):
    res = AsyncResult(task_id, app=celery_app)

    print("STATE", res.traceback)

    return {"state": str(res.state), "info": str(res.info) + "\n" + str(res.traceback)}


class ResultOut(Schema):
    task_id: str
    completed: bool
    flim_adjusted: bool
    source: str
    channel: int
    timestamp: datetime.datetime
    local_algorithm: str = None
    global_algorithm: str = None
    local_params: dict = None
    global_params: dict = None


@api.get('/results', response=List[ResultOut], auth=AuthBearer())
@permission_required("api.access", raise_exception=True)
def list_results(request, source):

    res = Result.objects.filter(source=source)

    return res


@api.get('/convert', auth=AuthBearer())
@permission_required("api.access", raise_exception=True)
def convert(request, filename):

    res = convert_pt.apply_async((filename,))

    return {"status": "ok", "task_id": res.id}


@api.get('/frame-count', auth=AuthBearer())
@permission_required("api.access", raise_exception=True)
def frame_count(request, source):

    res = get_frame_count.delay(source)
    dat = res.get()

    return {'frames': dat}

@api.get('/frame/{idx}')
def frame(request, idx: int, source, channel: int, colour=None):

    res = get_frame.delay(source, channel, idx)
    dat = res.get()
    img = Image.fromarray(dat, "L")

    if colour is None:
        colour = 'white'
    img = ImageOps.colorize(img, black='black', white=colour)
    img = img.convert("RGBA")

    width, height = img.size

    pixdata = img.load()

    for y in range(height):
        for x in range(width):
            if pixdata[x, y] == (0, 0, 0, 255):
                pixdata[x, y] = (255, 255, 255, 0)

    #
    print("2")
    return serve_pil_image(img)


@api.get('/frame-corrected/{idx}')
def frame_corrected(request, idx: int, result_path):
    res = get_frame_corrected.delay(result_path, idx)
    dat = res.get()
    img = Image.fromarray(dat, "L")
    img = ImageOps.colorize(img, black='black', white='red')
    img = img.convert("RGBA")

    width, height = img.size

    pixdata = img.load()

    for y in range(height):
        for x in range(width):
            if pixdata[x, y] == (0, 0, 0, 255):
                pixdata[x, y] = (255, 255, 255, 0)

    return serve_pil_image(img)


@api.get('/combined')
def combined(request, source, channel: int, excluded=None):
    '''
    -***excluded***: ABC
    '''
    res = get_combined.delay(source, channel, excluded)
    dat = res.get()
    img = Image.fromarray(dat, "L")
    # img = ImageOps.colorize(img, black='cyan', white='red', mid='purple')
    return serve_pil_image(img)


@api.get('/combined-corrected')
def combined_corrected(request, result_path, excluded=None):
    '''
    -***excluded***: ABC
    '''
    res = get_combined_corrected.delay(result_path, excluded)
    dat = res.get()
    img = Image.fromarray(dat, "L")
    # img = ImageOps.colorize(img, black='cyan', white='red', mid='purple')
    return serve_pil_image(img)


@api.get('/metrics', auth=AuthBearer())
@permission_required("api.access", raise_exception=True)
def metrics(request, result_path):
    '''
    -***excluded***: ABC
    '''
    res = get_metrics.delay(result_path)
    dat = res.get()

    return {'data': dat}


@api.get('/frame-count', auth=AuthBearer())
@permission_required("api.access", raise_exception=True)
def frame_count(request, source):

    res = get_frame_count.delay(source)
    dat = res.get()

    return {'frames': dat}


@api.get('/channel-count', auth=AuthBearer())
@permission_required("api.access", raise_exception=True)
def channel_count(request, source):

    res = get_channel_count.delay(source)
    dat = res.get()

    return {'channels': dat}


@api.get('/ts/{x}/{y}', auth=AuthBearer())
@permission_required("api.access", raise_exception=True)
def timeseries(request, source, channel: int, x: int, y: int, excluded=None, box=5):
    res = get_timeseries.delay(source, channel, x, y, excluded, box)
    dat = res.get()
    return {'data': dat}


@api.get('/ts-corrected/{x}/{y}', auth=AuthBearer())
@permission_required("api.access", raise_exception=True)
def timeseries_corrected(request, result_path, channel: int, x: int, y: int, excluded=None, box=5):
    res = get_timeseries_corrected.delay(result_path, channel, x, y, excluded, box)
    dat = res.get()
    return {'data': dat}


@api.post('/apply-correction', auth=AuthBearer())
@permission_required("api.access", raise_exception=True)
def correction(request, source, channel: int, reference_frame=0, local_algorithm=None, global_algorithm=None):
    import json
    if local_algorithm == "none":
        local_algorithm = None
    if global_algorithm == "none":
        global_algorithm = None

    local_params = json.loads(request.body)["local_params"]
    global_params = None

    res = apply_correction.delay(source, channel, reference_frame, local_algorithm, local_params, global_algorithm, global_params)

    return {"status": "ok", "task_id": res.id}


@api.post('/result', auth=AuthBearer())
@permission_required("api.access", raise_exception=True)
def save_result(request, task_id, source, channel, local_algorithm, global_algorithm):
    local_params = json.loads(request.body)["local_params"]
    r = Result(task_id=task_id, completed=False, flim_adjusted=False, source=source, channel=channel, local_algorithm=local_algorithm,
               global_algorithm=global_algorithm, local_params=local_params)

    r.save()
    return {"status": "ok"}


@api.delete('/result/{result_id}', auth=AuthBearer())
@permission_required("api.access", raise_exception=True)
def delete_result(request, result_id):
    import glob
    import os

    for f in glob.glob(f'./{BUCKET_FOLDER}/results/*/{result_id}*'):
        os.remove(f)

    Result.objects.get(task_id=result_id).delete()

    # print(r.json())

    return {"status": "ok"}


@api.post('/correct-flim', auth=AuthBearer())
@permission_required("api.access", raise_exception=True)
def correct_flim_view(request, source, result_id):

    res = correct_flim.delay(source, result_id)

    return {"status": "ok", "task_id": res.id}


@api.post('/pt3', auth=AuthBearer())
@permission_required("api.access", raise_exception=True)
def convert_to_pt3(request, source, result_id, excluded=None):

    res = write_pt3.delay(source, result_id, excluded)

    return {"status": "ok", "task_id": res.id}


@api.get('/pt3', auth=AuthBearer())
@permission_required("api.access", raise_exception=True)
def download_pt3(request, source, result_id):

    fpath = f'/app/{BUCKET_FOLDER}/results/{source}/{source}-{result_id}-corrected.pt3'

    return FileResponse(open(fpath, 'rb'))


@api.post('/flim-applied', auth=AuthBearer())
@permission_required("api.access", raise_exception=True)
def flim_applied(request, result_id):

    r = Result.objects.get(task_id=result_id)
    r.flim_adjusted = True
    r.save()

    return {"status": "ok"}


def serve_pil_image(pil_img):
    img_io = BytesIO()
    pil_img.save(img_io, 'PNG')
    img_io.seek(0)
    res = HttpResponse(img_io, content_type='image/png')
    patch_cache_control(res, max_age=3600)
    return res


@api.exception_handler(AuthenticationError)
def service_unavailable(request, exc: AuthenticationError):
    print("AUTH ERROR")
    print(exc)
    exc.args
    #return api.create_response(
    #    request,
    #    exc.args[1],
    #    status=exc.args[0],
    #)
