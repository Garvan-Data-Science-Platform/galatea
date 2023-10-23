import React from "react";
import { useAppSelector, useAppDispatch } from "state/hooks";
import {
  selectChannel,
  selectCurrentImage,
  selectExcludedFrames,
  selectImageSrc,
  setSrc,
} from "state/slices/imageSlice";
import { setChartData } from "state/slices/chartSlice";
import "./ImageCanvas.scss";
import { loadTimeSeries } from "requests/flim";
import {
  ButtonGroup,
  Card,
  CircularProgress,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import auth0mockable from "../../auth0mockable";
import { selectSelectedResult } from "state/slices/resultsSlice";

export function ImageCanvas() {
  const [loaded, setLoaded] = React.useState(false);
  const [boxPos, setBoxPos] = React.useState<number[] | null>(null);
  const [showCorrected, setShowCorrected] = React.useState(false);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const imageRef = React.useRef<HTMLImageElement>(null);

  const imageSrc = useAppSelector(selectImageSrc);
  const currentImage = useAppSelector(selectCurrentImage);
  const currentResult = useAppSelector(selectSelectedResult);
  const excluded = useAppSelector(selectExcludedFrames);
  const channel = useAppSelector(selectChannel);
  const dispatch = useAppDispatch();

  const { getAccessTokenSilently } = auth0mockable.useAuth0();

  React.useEffect(() => {
    setLoaded(false);
  }, [imageSrc, excluded, channel]);

  React.useEffect(() => {
    if (currentResult) {
      setShowCorrected(true);
    } else {
      setShowCorrected(false);
    }
  }, [currentResult]);

  React.useEffect(() => {
    if (loaded) {
      const canvas = canvasRef.current as HTMLCanvasElement;
      const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
      const img = imageRef.current as HTMLImageElement;
      ctx.drawImage(img, 0, 0);
    }
  }, [loaded]);

  async function getCursorPosition(
    event: React.MouseEvent<HTMLCanvasElement, MouseEvent>
  ) {
    const token = await getAccessTokenSilently();
    const rect = (event.target as HTMLCanvasElement).getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    setBoxPos([x - 5, y - 5]);
    if (imageSrc) {
      loadTimeSeries(token, {
        x,
        y,
        source: (currentImage || "") + ".npy",
        channel: channel,
      }).then((ts) => {
        dispatch(setChartData(ts));
      });
    }
  }

  return (
    <Card style={{ padding: 5 }}>
      <div style={{ position: "relative" }}>
        <div style={{ top: 0, width: "100%", position: "absolute" }}>
          <Typography sx={{ backgroundColor: "imageTextBackground" }}>
            Combined FLIM Image
          </Typography>
        </div>
        <canvas
          width={512}
          height={512}
          ref={canvasRef}
          onClick={(e) => {
            getCursorPosition(e);
          }}
        />
        {boxPos ? (
          <div
            style={{
              position: "absolute",
              width: 5,
              height: 5,
              top: boxPos[1],
              left: boxPos[0],
              borderStyle: "solid",
              borderWidth: 2,
              borderColor: "red",
            }}
          />
        ) : null}

        <CircularProgress
          style={{
            position: "absolute",
            bottom: 256 - 15,
            left: 256 - 15,
            visibility: !imageSrc || loaded ? "hidden" : "visible",
          }}
        />
        <img
          width={512}
          height="auto"
          src={
            imageSrc
              ? imageSrc +
                "&channel=" +
                channel +
                (excluded.length > 0 ? "&excluded=" + excluded.join(",") : "")
              : "https://upload.wikimedia.org/wikipedia/commons/9/9a/512x512_Dissolve_Noise_Texture.png?20200626210716"
          }
          ref={imageRef}
          onLoad={() => {
            setLoaded(true);
          }}
          style={{ display: "none" }}
        />
      </div>
      <ToggleButtonGroup
        color="primary"
        size="small"
        value={showCorrected ? "corrected" : "original"}
        onChange={(e) => {
          setShowCorrected(e.target.value == "corrected");
        }}
      >
        <ToggleButton value="original">Original</ToggleButton>
        <ToggleButton disabled={!currentResult} value="corrected">
          Corrected
        </ToggleButton>
      </ToggleButtonGroup>
    </Card>
  );
}
