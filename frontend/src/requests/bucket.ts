import { BucketFile } from "components/FileBrowser/Subdirectory";

interface loadBucketDirectoryProps {
  subdir?: string;
  limit?: number;
}

export async function loadBucketDirectory(
  token: string,
  props: loadBucketDirectoryProps
): Promise<[BucketFile[], string[]]> {
  let headers = { Authorization: `Bearer ${token}` };
  let backendURL = import.meta.env["VITE_BACKEND_URL"];
  var url = `${backendURL}/bucket?limit=${props.limit}`;

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

export async function createBucketFolder(token: string, folderName: string) {
  let headers = { Authorization: `Bearer ${token}` };
  let backendURL = import.meta.env["VITE_BACKEND_URL"];
  var url = `${backendURL}/bucket/folder?folderName=${folderName}`;

  let res = await fetch(url, { headers, method: "put" });
  if (!res.ok) {
    throw new Error("Server error: " + res.statusText);
  }
  return;
}

export async function getUploadURL(
  token: string,
  path: string
): Promise<string> {
  let headers = { Authorization: `Bearer ${token}` };
  let backendURL = import.meta.env["VITE_BACKEND_URL"];
  var url = `${backendURL}/bucket/upload?path=${path}`;

  let res = await fetch(url, { headers, method: "get" });
  if (!res.ok) {
    throw new Error("Server error: " + res.statusText);
  }
  let dat = await res.json();
  return dat.url;
}

export async function deleteBucketFolder(token: string, folderName: string) {
  let headers = { Authorization: `Bearer ${token}` };
  let backendURL = import.meta.env["VITE_BACKEND_URL"];
  var url = `${backendURL}/bucket/folder?folderName=${folderName}`;

  let res = await fetch(url, { headers, method: "delete" });
  if (!res.ok) {
    throw new Error("Server error: " + res.statusText);
  }
  return;
}
