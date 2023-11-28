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

interface LoadTimeSeriesCorrectedProps {
  result_path: string;
  channel: number;
  x: number;
  y: number;
}

export async function loadTimeSeriesCorrected(
  token: string,
  props: LoadTimeSeriesCorrectedProps
): Promise<any> {
  let headers = { Authorization: `Bearer ${token}` };
  let backendURL = import.meta.env["VITE_BACKEND_URL"];
  let x = Math.round(props.x);
  let y = Math.round(props.y);
  var url = `${backendURL}/ts-corrected/${x}/${y}?result_path=${props.result_path}&channel=${props.channel}`;

  let res = await fetch(url, { headers });
  if (!res.ok) {
    return Promise.reject("Server error: " + res.statusText);
  }
  let dat = await res.json();
  return dat.data;
}

export async function loadMetrics(
  token: string,
  result_path: string
): Promise<any> {
  let headers = { Authorization: `Bearer ${token}` };
  let backendURL = import.meta.env["VITE_BACKEND_URL"];

  var url = `${backendURL}/metrics?result_path=${result_path}`;

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

export async function getChannelCount(token: string, source: string) {
  let headers = { Authorization: `Bearer ${token}` };
  let backendURL = import.meta.env["VITE_BACKEND_URL"];
  var url = `${backendURL}/channel-count?source=${source}`;

  let res = await fetch(url, { headers, method: "GET" });
  if (!res.ok) {
    return Promise.reject("Server error: " + res.statusText);
  }
  let dat = await res.json();

  console.log("DATA", dat);

  return dat.channels;
}

interface ApplyCorrectionProps {
  source: string;
  reference_frame: number;
  channel: number;
  local_algorithm?: string;
  global_algorithm?: string;
  local_params: Map<string, number>;
}

interface SaveResultProps extends ApplyCorrectionProps {
  task_id: string;
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

  return dat.task_id;
}

export async function checkProgress(token: string, task_id: string) {
  let headers = { Authorization: `Bearer ${token}` };
  let backendURL = import.meta.env["VITE_BACKEND_URL"];
  var url = `${backendURL}/status/${task_id}`;
  let res = await fetch(url, { headers });
  return await res.json();
}

export interface Result {
  task_id: string;
  completed: boolean;
  flim_adjusted: boolean;
  source: string;
  channel: number;
  timestamp: Date;
  local_algorithm?: string;
  global_algorithm?: string;
  local_params?: Map<string, number>;
  global_params?: Map<string, number>;
}

export async function getResults(
  token: string,
  source: string
): Promise<Result[]> {
  let headers = { Authorization: `Bearer ${token}` };
  let backendURL = import.meta.env["VITE_BACKEND_URL"];
  var url = `${backendURL}/results?source=${source}`;
  let res = await fetch(url, { headers });
  return await res.json();
}

export async function saveResult(token: string, props: SaveResultProps) {
  let headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
  let backendURL = import.meta.env["VITE_BACKEND_URL"];
  var url = new URL(`${backendURL}/result`);
  for (const [key, val] of Object.entries(props)) {
    if (val != undefined && key != "local_params") {
      url.searchParams.set(key, val);
    }
  }
  await fetch(url, {
    headers,
    method: "POST",
    body: JSON.stringify({ local_params: props.local_params }),
  });
}

export async function deleteResult(token: string, result_id: string) {
  let headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
  let backendURL = import.meta.env["VITE_BACKEND_URL"];
  var url = new URL(`${backendURL}/result/${result_id}`);

  await fetch(url, {
    headers,
    method: "DELETE",
  });
}

export async function correctFlim(
  token: string,
  source: string,
  result_id: string
): Promise<string> {
  let headers = { Authorization: `Bearer ${token}` };
  let backendURL = import.meta.env["VITE_BACKEND_URL"];
  var url = `${backendURL}/correct-flim?source=${source}&result_id=${result_id}`;
  let res = await fetch(url, { headers, method: "POST" });
  let dat = await res.json();
  return dat.task_id;
}

export async function preload(token: string, source: string): Promise<string> {
  let headers = { Authorization: `Bearer ${token}` };
  let backendURL = import.meta.env["VITE_BACKEND_URL"];
  var url = `${backendURL}/preload?source=${source}`;
  let res = await fetch(url, { headers, method: "POST" });
  let dat = await res.json();
  return dat.task_id;
}

export async function getPT3(
  token: string,
  source: string,
  result_id: string,
  excluded: Number[]
): Promise<string> {
  let headers = { Authorization: `Bearer ${token}` };
  let backendURL = import.meta.env["VITE_BACKEND_URL"];
  var url =
    `${backendURL}/pt3?source=${source}&result_id=${result_id}` +
    (excluded.length > 0 ? "&excluded=" + excluded.join(",") : "");

  let res = await fetch(url, { headers, method: "POST" });
  let dat = await res.json();
  return dat.task_id;
}

export async function setFlimCorrected(token: string, result_id: string) {
  let headers = { Authorization: `Bearer ${token}` };
  let backendURL = import.meta.env["VITE_BACKEND_URL"];
  var url = `${backendURL}/flim-applied?result_id=${result_id}`;
  let res = await fetch(url, { headers, method: "POST" });
  let dat = await res.json();
}

export async function checkWorker(token: string) {
  let headers = { Authorization: `Bearer ${token}` };
  let backendURL = import.meta.env["VITE_BACKEND_URL"];
  var url = `${backendURL}/workers`;
  let res = await fetch(url, { headers, method: "GET" });
  let dat = await res.json();
  return dat.workers;
}

export async function startupWorker(token: string) {
  let headers = { Authorization: `Bearer ${token}` };
  let backendURL = import.meta.env["VITE_BACKEND_URL"];
  var url = `${backendURL}/up`;
  await fetch(url, { headers, method: "GET" });
  while (true) {
    await new Promise((r) => setTimeout(r, 5000));
    if (await checkWorker(token)) {
      break;
    }
  }
}

export async function waitForTaskSuccess(
  token: string,
  task_id: string,
  handleError?: undefined | ((message: string) => void),
  progressCB?: undefined | ((status: string) => void)
) {
  while (true) {
    await new Promise((r) => setTimeout(r, 5000));
    let status = await checkProgress(token, task_id);
    console.log("STATUS", status);
    progressCB ? progressCB(status["state"]) : null;
    if (status.state == "SUCCESS") {
      return true;
    }
    if (status.state == "FAILURE" && handleError) {
      handleError(status.info);
      return false;
    }
  }
}
