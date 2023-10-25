from io import BytesIO
from ninja import NinjaAPI, Schema
from ninja.errors import AuthenticationError, ValidationError
from google.cloud import storage
from galatea.auth import AuthBearer
from .schemas import BucketFileList
from typing import List
import datetime
from django.http import HttpResponse
from django.utils.cache import patch_cache_control, patch_response_headers
import numpy as np
from PIL import Image, ImageOps
from django.conf import settings
from django.contrib.auth.decorators import permission_required
from worker.tasks import correct_flim, convert_pt, get_frame, get_frame_corrected, get_timeseries, get_timeseries_corrected, get_combined, get_combined_corrected, get_frame_count, apply_correction, app as celery_app
from celery.result import AsyncResult
from .models import Result


api = NinjaAPI()


storage_client = storage.Client.from_service_account_json(
    "/etc/secret-volume/sa-key.json")

flim_ds = '/app/bucket/test_flim.npy'
BUCKET_FOLDER = 'bucket'

if settings.DEBUG:
    flim_ds = '/home/tim/projects/galatea/working/test_flim.npy'
    BUCKET_FOLDER = 'working'
    import os

    class MockBucket(list):
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

    class MockBlob():
        def __init__(self, name):
            self.name = name
            self.url = "dummy"

        def __str__(self):
            return self.name

        def generate_signed_url(self, version, expiration, method):
            return "dummy"

    def mock_bucket(bucket, delimiter, prefix):
        print("USING MOCK BUCKET")
        return MockBucket([MockBlob(x) for x in os.listdir(f'/app/working/{prefix or ""}')])

    storage_client.list_blobs = mock_bucket


@api.get('/')
def health_check(request):

    return {"status": "ok"}


@api.get("/bucket/{bucket}/", response=BucketFileList, auth=AuthBearer())
@permission_required("api.access", raise_exception=True)
def list_bucket(request, bucket: str, subdir: str | None = None, limit: int | None = None):
    if subdir:
        prefix = subdir + "/"
    else:
        prefix = None

    if limit is None:
        limit = -1

    results = storage_client.list_blobs(bucket, delimiter="/", prefix=prefix)
    blobs = [r for i, r in enumerate(results) if i < limit and r.name != str(subdir) + '/']
    files = [{'name': b.name, 'url': b.generate_signed_url(version='v4', expiration=datetime.timedelta(minutes=15), method='GET')} for b in blobs]
    folders: List[str] = list(results.prefixes)
    if '/' in folders:
        folders.remove('/')

    return {"files": files, "folders": folders}


@api.put("/bucket/{bucket}/folder", auth=AuthBearer())
@permission_required("api.access", raise_exception=True)
def create_folder(request, bucket: str, folderName: str):
    """Create new folder in bucket"""

    bucket = storage_client.get_bucket(bucket)
    if folderName[-1] != '/':
        folderName = folderName + '/'
    blob = bucket.blob(folderName)
    blob.upload_from_string('', content_type='application/x-www-form-urlencoded;charset=UTF-8')

    return {"status": "ok"}


@api.delete("/bucket/{bucket}/folder", auth=AuthBearer())
@permission_required("api.access", raise_exception=True)
def delete_folder(request, bucket: str, folderName: str):
    """Delete a folder from the bucket"""

    bucket = storage_client.get_bucket(bucket)
    blobs = bucket.list_blobs(prefix=folderName)
    for b in blobs:
        b.delete()

    return {"status": "ok"}


@api.get("/bucket/{bucket}/upload", auth=AuthBearer())
@permission_required("api.access", raise_exception=True)
def get_upload_url(request, bucket: str, path: str):
    """Get a signed upload URL"""

    bucket = storage_client.get_bucket(bucket)
    blob = bucket.blob(path)
    url = blob.generate_signed_url(
        version="v4",
        # This URL is valid for 15 minutes
        expiration=datetime.timedelta(minutes=15),
        # Allow PUT requests using this URL.
        method="PUT",
        content_type="application/octet-stream",
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


@api.get('/status/{task_id}')
def task_status(request, task_id):
    res = AsyncResult(task_id, app=celery_app)

    print("STATE", res.info)

    return {"state": res.state, "info": res.info}


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


@api.get('/results', response=List[ResultOut])
def list_results(request, source):

    res = Result.objects.filter(source=source)

    return res


@api.get('/convert')
def convert(request, filename):

    res = convert_pt.apply_async((filename,))

    return {"status": "ok", "task_id": res.id}


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
    return serve_pil_image(img)


@api.get('/frame-corrected/{idx}')
def frame_corrected(request, idx: int, result_id):
    res = get_frame_corrected.delay(result_id, idx)
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
def combined_corrected(request, result_id, excluded=None):
    '''
    -***excluded***: ABC
    '''
    res = get_combined_corrected.delay(result_id, excluded)
    dat = res.get()
    img = Image.fromarray(dat, "L")
    # img = ImageOps.colorize(img, black='cyan', white='red', mid='purple')
    return serve_pil_image(img)


@api.get('/frame-count')
def frame_count(request, source):

    res = get_frame_count.delay(source)
    dat = res.get()

    return {'frames': dat}


@api.get('/ts/{x}/{y}')
def timeseries(request, source, channel: int, x: int, y: int, excluded=None, box=5):
    res = get_timeseries.delay(source, channel, x, y, excluded, box)
    dat = res.get()
    return {'data': dat}


@api.get('/ts-corrected/{x}/{y}')
def timeseries_corrected(request, result_id, channel: int, x: int, y: int, excluded=None, box=5):
    res = get_timeseries_corrected.delay(result_id, channel, x, y, excluded, box)
    dat = res.get()
    return {'data': dat}


@api.post('/apply-correction')
def correction(request, source, channel: int, reference_frame=0, local_algorithm=None, global_algorithm=None):
    import json
    if local_algorithm == "none":
        local_algorithm = None
    if global_algorithm == "none":
        global_algorithm = None

    local_params = json.loads(request.body)["local_params"]
    global_params = None

    res = apply_correction.delay(source, channel, reference_frame, local_algorithm, local_params, global_algorithm, global_params)
    r = Result(task_id=res.id, completed=False, source=source, channel=channel, local_algorithm=local_algorithm,
               global_algorithm=global_algorithm, local_params=local_params)
    r.save()

    return {"status": "ok", "task_id": res.id}


@api.post('/correct-flim')
def correct_flim_view(request, source, result_id):

    res = correct_flim.delay(source, result_id)

    return {"status": "ok", "task_id": res.id}


@api.post('/flim-applied')
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
    exc.args
    return api.create_response(
        request,
        exc.args[1],
        status=exc.args[0],
    )
