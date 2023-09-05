from pydantic import BaseModel
from typing import List, Optional


class BucketFile(BaseModel):
    name: str
    url: str


class BucketFileList(BaseModel):
    files: List[BucketFile]
    folders: List[str]
