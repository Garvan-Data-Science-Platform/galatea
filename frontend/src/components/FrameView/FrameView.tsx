import React from "react";
import { useAppSelector, useAppDispatch } from "state/hooks";
import {
  selectChannel,
  selectCurrentImage,
  selectExcludedFrames,
  selectFrameCount,
  selectImageSrc,
  selectReferenceFrame,
  setCurrentImage,
  setSrc,
  toggleExcludedFrame,
} from "state/slices/imageSlice";
import {
  selectChartFrame,
  setChartData,
  setChartFrame,
} from "state/slices/chartSlice";

import {
  Box,
  Card,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  Grid,
  Modal,
  Paper,
  Slider,
  Tooltip,
  Typography,
} from "@mui/material";
import { QuestionMark, TrendingUpRounded } from "@mui/icons-material";
import { current } from "@reduxjs/toolkit";
import { selectSelectedResult } from "state/slices/resultsSlice";

export function FrameView() {
  const [imageSrc, setImageSrc] = React.useState<string | null>(null);
  const [correctedSrc, setCorrectedSrc] = React.useState<string | null>(null);
  const [referenceSrc, setReferenceSrc] = React.useState<string | null>(null);

  const dispatch = useAppDispatch();
  const currentImage = useAppSelector(selectCurrentImage);
  const frameCount = useAppSelector(selectFrameCount);
  const excluded = useAppSelector(selectExcludedFrames);
  const channel = useAppSelector(selectChannel);
  const referenceFrame = useAppSelector(selectReferenceFrame);
  const result = useAppSelector(selectSelectedResult);
  const sliderRef = React.useRef();
  const [sliderVal, setSliderVal] = React.useState(1);
  const [display, setDisplay] = React.useState({
    original: true,
    corrected: true,
    reference: true,
  });

  const resultID = result;

  const onSliderChange = (e, val) => {
    setSliderVal(val);

    if (resultID) {
      setCorrectedSrc(
        `${import.meta.env.VITE_BACKEND_URL}/frame-corrected/${
          val - 1
        }?result_id=${currentImage}/${resultID}`
      );
    }
    setImageSrc(
      `${import.meta.env.VITE_BACKEND_URL}/frame/${
        val - 1 // index starting at 1 not 0
      }?source=${currentImage}`
    );
    setReferenceSrc(
      `${import.meta.env.VITE_BACKEND_URL}/frame/${
        referenceFrame // index starting at 1 not 0
      }?source=${currentImage}&colour=cyan`
    );
  };

  //Prevents image prefetching bug with firefox causing image to load twice
  function addSrc(src: string) {
    return function (img: HTMLImageElement) {
      if (img) {
        img.src = src;
      }
    };
  }

  React.useEffect(() => {
    if (currentImage) {
      sliderRef.current.value = 1;
      setImageSrc(
        `${import.meta.env.VITE_BACKEND_URL}/frame/0?source=${currentImage}`
      );
      setReferenceSrc(
        `${import.meta.env.VITE_BACKEND_URL}/frame/${
          referenceFrame // index starting at 1 not 0
        }?source=${currentImage}&colour=cyan`
      );
    }
  }, [currentImage]);

  React.useEffect(() => {
    if (resultID && currentImage) {
      setCorrectedSrc(
        `${import.meta.env.VITE_BACKEND_URL}/frame-corrected/${
          sliderVal - 1
        }?result_id=${currentImage}/${resultID}`
      );
    } else {
      setCorrectedSrc(null);
    }
  }, [resultID]);

  return (
    <Paper style={{ padding: 5 }}>
      <Box style={{ position: "relative" }}>
        <div
          style={{
            width: 512,
            height: 512,
            position: "relative",
            backgroundColor: "black",
          }}
        >
          {display.original && imageSrc ? (
            <img
              width={512}
              height={512}
              ref={addSrc(imageSrc + `&channel=${channel}`)}
              key={imageSrc}
              style={{ position: "absolute", top: 0, left: 0 }}
            />
          ) : null}
          {display.reference && imageSrc ? (
            <img
              width={512}
              height={512}
              ref={addSrc(referenceSrc + `&channel=${channel}&colour=cyan`)}
              key={referenceSrc + "ref"}
              style={{ position: "absolute", top: 0, left: 0 }}
            />
          ) : null}

          {correctedSrc && display.corrected ? (
            <img
              width={512}
              height={512}
              ref={addSrc(correctedSrc)}
              key={correctedSrc}
              style={{ position: "absolute", top: 0, left: 0 }}
            />
          ) : null}
          <div
            style={{
              bottom: 4,
              left: 0,
              width: 100,
              height: 55,
              position: "absolute",
              backgroundColor: "black",
            }}
          >
            <Typography sx={{ fontSize: 12, color: "white" }}>
              Original
            </Typography>
            <Typography sx={{ fontSize: 12, color: "red" }}>
              Corrected
            </Typography>
            <Typography sx={{ fontSize: 12, color: "cyan" }}>
              Reference Frame
            </Typography>
          </div>
        </div>
        <div style={{ top: 0, width: "100%", position: "absolute" }}>
          <Typography sx={{ backgroundColor: "imageTextBackground" }}>
            Repetitions (frames)
          </Typography>
        </div>
      </Box>
      <Box sx={{ padding: 2 }}>
        <Typography>Display</Typography>
        <FormControlLabel
          control={
            <Checkbox
              //defaultChecked
              checked={display.original}
              disabled={!imageSrc}
              onChange={(e) => {
                setDisplay((state) => {
                  return { ...state, original: !state.original };
                });
              }}
            />
          }
          label="Original"
        />
        <FormControlLabel
          control={
            <Checkbox
              //defaultChecked
              checked={display.corrected}
              disabled={!correctedSrc}
              onChange={(e) => {
                setDisplay((state) => {
                  return { ...state, corrected: !state.corrected };
                });
              }}
            />
          }
          label="Corrected"
        />
        <FormControlLabel
          control={
            <Checkbox
              //defaultChecked
              checked={display.reference}
              disabled={!imageSrc}
              onChange={(e) => {
                setDisplay((state) => {
                  return { ...state, reference: !state.reference };
                });
              }}
            />
          }
          label="Reference"
        />
        <Typography>Repetition</Typography>
        <Slider
          defaultValue={1}
          aria-label="Default"
          valueLabelDisplay="auto"
          step={1}
          marks
          min={1}
          max={frameCount || 1}
          ref={sliderRef}
          valueLabelDisplay="on"
          onChangeCommitted={onSliderChange}
        />
        <Tooltip title="Whether the repetition should be used in creating the combined FLIM image">
          <FormControlLabel
            control={
              <Checkbox
                //defaultChecked
                checked={!excluded.includes(sliderVal - 1)}
                onChange={(e) => {
                  console.log("TOOGLE EXCLUDED", sliderVal);
                  dispatch(toggleExcludedFrame(sliderVal - 1));
                  //dispatch(setChartFrame(2));
                  //console.log("HELLO");
                }}
              />
            }
            label="Repetition used"
          />
        </Tooltip>
      </Box>
    </Paper>
  );
}
