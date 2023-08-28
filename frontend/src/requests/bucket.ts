import { BucketFile } from "components/FileBrowser/Subdirectory";

interface loadBucketDirectoryProps {
  bucket: string;
  subdir?: string;
  limit?: number;
}

export async function loadBucketDirectory(
  token: string,
  props: loadBucketDirectoryProps
): Promise<[BucketFile[], string[]]> {
  let headers = { Authorization: `Bearer ${token}` };
  let backendURL = import.meta.env["VITE_BACKEND_URL"];
  var url = `${backendURL}/api/bucket/${props.bucket}?limit=${props.limit}`;

  if (props.subdir) {
    url = url.concat("&subdir=", props.subdir);
  }

  let res = await fetch(url, { headers });
  if (!res.ok) {
    return Promise.reject("Server error: " + res.statusText);
  }
  let dat = await res.json();

  let files = dat.files as BucketFile[];
  let folders = dat.folders as string[];
  return [files, folders];
}
