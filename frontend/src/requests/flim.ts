interface LoadTimeSeriesProps {
  source: string;
  channel: number;
  x: number;
  y: number;
}

export async function loadTimeSeries(
  token: string,
  props: LoadTimeSeriesProps
): Promise<any> {
  let headers = { Authorization: `Bearer ${token}` };
  let backendURL = import.meta.env["VITE_BACKEND_URL"];
  let x = Math.round(props.x);
  let y = Math.round(props.y);
  var url = `${backendURL}/ts/${x}/${y}?source=${props.source}&channel=${props.channel}`;

  let res = await fetch(url, { headers });
  if (!res.ok) {
    return Promise.reject("Server error: " + res.statusText);
  }
  let dat = await res.json();
  return dat.data;
}

export async function convertPTFile(token: string, path: string) {
  let headers = { Authorization: `Bearer ${token}` };
  let backendURL = import.meta.env["VITE_BACKEND_URL"];
  var url = `${backendURL}/convert-pt?path=${path}`;

  let res = await fetch(url, { headers, method: "POST" });
  if (!res.ok) {
    return Promise.reject("Server error: " + res.statusText);
  }
  let dat = await res.json();

  console.log("DATA", dat);

  return dat;
}

export async function getFrameCount(token: string, source: string) {
  let headers = { Authorization: `Bearer ${token}` };
  let backendURL = import.meta.env["VITE_BACKEND_URL"];
  var url = `${backendURL}/frame-count?source=${source}`;

  let res = await fetch(url, { headers, method: "GET" });
  if (!res.ok) {
    return Promise.reject("Server error: " + res.statusText);
  }
  let dat = await res.json();

  console.log("DATA", dat);

  return dat.frames;
}

interface ApplyCorrectionProps {
  source: string;
  reference_frame: number;
  channel: number;
  local_algorithm?: string;
  global_algorithm?: string;
  local_params: Map<string, number>;
}

export async function applyCorrection(
  token: string,
  props: ApplyCorrectionProps
) {
  let headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
  let backendURL = import.meta.env["VITE_BACKEND_URL"];
  var url = new URL(`${backendURL}/apply-correction`);
  for (const [key, val] of Object.entries(props)) {
    if (val != undefined && key != "local_params") {
      url.searchParams.set(key, val);
    }
  }
  let res = await fetch(url, {
    headers,
    method: "POST",
    body: JSON.stringify({ local_params: props.local_params }),
  });
  if (!res.ok) {
    return Promise.reject("Server error: " + res.statusText);
  }
  let dat = await res.json();

  console.log("DATA", dat);

  return dat;
}

export async function checkProgress(token: string, task_id: string) {
  let headers = { Authorization: `Bearer ${token}` };
  let backendURL = import.meta.env["VITE_BACKEND_URL"];
  var url = `${backendURL}/status/${task_id}`;
  let res = await fetch(url, { headers });
  return await res.json();
}

export async function getResults(token: string, source: string) {
  let headers = { Authorization: `Bearer ${token}` };
  let backendURL = import.meta.env["VITE_BACKEND_URL"];
  var url = `${backendURL}/results?source=${source}`;
  let res = await fetch(url, { headers });
  return await res.json();
}

export async function waitForTaskSuccess(token: string, task_id: string) {
  while (true) {
    await new Promise((r) => setTimeout(r, 5000));
    let status = await checkProgress(token, task_id);
    console.log("STATUS", status);
    if (status.state == "SUCCESS") {
      break;
    }
  }
}
