from ninja import NinjaAPI
from ninja.errors import AuthenticationError
from google.cloud import storage
from .auth import AuthBearer
from .schemas import BucketFileList
from typing import List
import datetime

api = NinjaAPI()

storage_client = storage.Client.from_service_account_json(
    "/etc/secret-volume/sa-key.json")


@api.get("/bucket/{bucket}/", response=BucketFileList, auth=AuthBearer())
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

    return {"files": files, "folders": folders}


@api.get('/')
def health_check(request):
    return {"status": "ok"}


@api.get('/slice/{idx}')
def test_slice(request, idx: int):
    import time
    import numpy as np
    t1 = time.time()
    d1 = np.memmap('/app/bucket/dat.npy', np.int8, 'r', shape=(40, 512, 512, 132))
    res = d1[idx, :, :, :].sum()
    t2 = time.time()

    return {"sum": int(res), "time": t2-t1}


@api.exception_handler(AuthenticationError)
def service_unavailable(request, exc: AuthenticationError):
    exc.args
    return api.create_response(
        request,
        exc.args[1],
        status=exc.args[0],
    )
