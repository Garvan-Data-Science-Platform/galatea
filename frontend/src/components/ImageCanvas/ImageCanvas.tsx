import React from "react";
import { useAppSelector, useAppDispatch } from "state/hooks";
import { selectImageSrc, setSrc } from "state/slices/imageSlice";
import { selectChartFrame, setChartData } from "state/slices/chartSlice";
import "./ImageCanvas.scss";
import { loadTimeSeries } from "requests/flim";
import { CircularProgress } from "@mui/material";

export function ImageCanvas() {
  const [loaded, setLoaded] = React.useState(false);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const imageRef = React.useRef<HTMLImageElement>(null);

  const imageSrc = useAppSelector(selectImageSrc);
  const chartFrame = useAppSelector(selectChartFrame);
  const dispatch = useAppDispatch();

  React.useEffect(() => {
    setLoaded(false);
  }, [imageSrc]);

  React.useEffect(() => {
    if (loaded) {
      const canvas = canvasRef.current as HTMLCanvasElement;
      const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
      const img = imageRef.current as HTMLImageElement;
      ctx.drawImage(img, 0, 0);
    }
  }, [loaded]);

  function getCursorPosition(
    event: React.MouseEvent<HTMLCanvasElement, MouseEvent>
  ) {
    const rect = (event.target as HTMLCanvasElement).getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    console.log(x, y);
    loadTimeSeries("X", { x, y, frame: chartFrame }).then((ts) => {
      dispatch(setChartData(ts));
    });
  }

  return (
    <div style={{ width: 512, height: 512, backgroundColor: "#c9c5c5" }}>
      <canvas
        width={512}
        height={512}
        ref={canvasRef}
        onClick={(e) => {
          getCursorPosition(e);
        }}
      />
      <CircularProgress
        style={{
          position: "relative",
          bottom: 256 + 15,
          left: 0,
          visibility: !imageSrc || loaded ? "hidden" : "visible",
        }}
      />
      <img
        width={512}
        height="auto"
        src={imageSrc}
        ref={imageRef}
        onLoad={() => {
          setLoaded(true);
        }}
        style={{ display: "none" }}
      />
    </div>
  );
}
