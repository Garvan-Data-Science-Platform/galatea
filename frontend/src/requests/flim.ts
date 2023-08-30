interface LoadTimeSeriesProps {
  frame: number;
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
  var url = `${backendURL}/ts/${props.frame}/${x}/${y}`;

  let res = await fetch(url, { headers });
  if (!res.ok) {
    return Promise.reject("Server error: " + res.statusText);
  }
  let dat = await res.json();
  return dat.data;
}
