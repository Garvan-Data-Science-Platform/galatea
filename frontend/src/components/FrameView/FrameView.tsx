import React from "react";
import { useAppSelector, useAppDispatch } from "state/hooks";
import {
  selectChannel,
  selectCurrentImage,
  selectExcludedFrames,
  selectFrameCount,
  selectImageSrc,
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
  Paper,
  Slider,
  Tooltip,
  Typography,
} from "@mui/material";
import { QuestionMark, TrendingUpRounded } from "@mui/icons-material";
import { current } from "@reduxjs/toolkit";

export function FrameView() {
  const [imageSrc, setImageSrc] = React.useState({
    original:
      "https://upload.wikimedia.org/wikipedia/commons/9/9a/512x512_Dissolve_Noise_Texture.png?20200626210716",
    local:
      "https://upload.wikimedia.org/wikipedia/commons/9/9a/512x512_Dissolve_Noise_Texture.png?20200626210716",
    global:
      "https://upload.wikimedia.org/wikipedia/commons/9/9a/512x512_Dissolve_Noise_Texture.png?20200626210716",
    combined:
      "https://upload.wikimedia.org/wikipedia/commons/9/9a/512x512_Dissolve_Noise_Texture.png?20200626210716",
  });

  const dispatch = useAppDispatch();
  const currentImage = useAppSelector(selectCurrentImage);
  const frameCount = useAppSelector(selectFrameCount);
  const excluded = useAppSelector(selectExcludedFrames);
  const channel = useAppSelector(selectChannel);
  const sliderRef = React.useRef();
  const [sliderVal, setSliderVal] = React.useState(1);

  const onSliderChange = (e, val) => {
    setImageSrc((state) => {
      setSliderVal(val);
      return {
        ...state,
        original: `${import.meta.env.VITE_BACKEND_URL}/frame/${
          val - 1 // index starting at 1 not 0
        }?source=${currentImage}`,
      };
    });
  };

  React.useEffect(() => {
    if (currentImage) {
      sliderRef.current.value = 1;
      setImageSrc((state) => {
        return {
          ...state,
          original: `${
            import.meta.env.VITE_BACKEND_URL
          }/frame/1?source=${currentImage}`,
        };
      });
    }
  }, [currentImage]);

  return (
    <Paper style={{ padding: 5 }}>
      <Box style={{ position: "relative", width: 604 }}>
        <Typography
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 300,
            backgroundColor: "imageTextBackground",
          }}
        >
          Original
        </Typography>
        <Typography
          sx={{
            position: "absolute",
            top: 0,
            right: 0,
            width: 300,
            backgroundColor: "imageTextBackground",
          }}
        >
          Local Correction
        </Typography>
        <img
          width={300}
          height={300}
          src={imageSrc.original + `&channel=${channel}`}
          key={imageSrc.original}
          style={{ marginRight: 4, backgroundColor: "grey" }}
        />
        <img width={300} height={300} src={imageSrc.local} />
      </Box>
      <Box sx={{ position: "relative" }}>
        <Typography
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 300,
            backgroundColor: "imageTextBackground",
          }}
        >
          Global Correction
        </Typography>
        <Typography
          sx={{
            position: "absolute",
            top: 0,
            right: 0,
            width: 300,
            backgroundColor: "imageTextBackground",
          }}
        >
          Local + Global Correction
        </Typography>
        <img
          width={300}
          height={300}
          src={imageSrc.global}
          style={{ marginRight: 4 }}
        />
        <img width={300} height={300} src={imageSrc.combined} />
      </Box>
      <Box sx={{ padding: 2 }}>
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
