import React from "react";
import { useAppSelector, useAppDispatch } from "state/hooks";
import { selectImageSrc, setSrc } from "state/slices/imageSlice";
import "./ImageCanvas.scss";

export function ImageCanvas() {
  const [loaded, setLoaded] = React.useState(false);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const imageRef = React.useRef<HTMLImageElement>(null);

  const imageSrc = useAppSelector(selectImageSrc);
  const dispatch = useAppDispatch();

  React.useEffect(() => {
    dispatch(
      setSrc(
        "https://www.leica-microsystems.com/fileadmin/_processed_/1/e/csm_what-is-flim_018b56038a.jpg"
      )
    );
  }, []);

  React.useEffect(() => {
    if (loaded) {
      const canvas = canvasRef.current as HTMLCanvasElement;
      canvas.addEventListener("mousedown", function (e) {
        getCursorPosition(canvas, e);
      });
      const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
      const img = imageRef.current as HTMLImageElement;
      img.height = 600;
      img.width = 600;
      img.src = imageSrc || "";
      ctx.drawImage(img, 0, 0);
    }
  }, [loaded]);

  function getCursorPosition(canvas: HTMLCanvasElement, event: MouseEvent) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    console.log("x: " + x + " y: " + y);
  }

  return (
    <div style={{ width: 600, height: 600, backgroundColor: "#c9c5c5" }}>
      <canvas width={600} height={600} ref={canvasRef} />
      <img
        width={600}
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
