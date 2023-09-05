import LoginButton from "components/LoginButton";
import { FileBrowser } from "components/FileBrowser";
import { ImageCanvas } from "components/ImageCanvas";
import { Slider } from "@mui/material";
import { useAppDispatch } from "state/hooks";
import { setSrc } from "state/slices/imageSlice";
import Chart from "chart.js/auto";
import { Histogram } from "components/Histogram";
import { setChartFrame } from "state/slices/chartSlice";

const Home = () => {
  const dispatch = useAppDispatch();

  const onSliderChange = (e, val) => {
    console.log("SETTING SOURCE", val);
    dispatch(setSrc(`${import.meta.env.VITE_BACKEND_URL}/frame/${val}`));
    dispatch(setChartFrame(val));
  };

  return (
    <>
      <FileBrowser
        bucket="galatea"
        onSelectFile={(file) => {
          console.log("Setting image to", file.url);
          //setCurrentImg(file.url);
        }}
      />

      <ImageCanvas />
      {
        //</div>}
      }

      <Slider
        defaultValue={2}
        aria-label="Default"
        valueLabelDisplay="auto"
        step={1}
        marks
        min={2}
        max={19}
        style={{ width: 500 }}
        onChangeCommitted={onSliderChange}
      />
      <p>Click image to see chart data at pixel</p>
      <div>
        <LoginButton />
      </div>
      <Histogram />
    </>
  );
};
export default Home;
