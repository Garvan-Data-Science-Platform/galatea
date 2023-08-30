import LoginButton from "components/LoginButton";
import { FileBrowser } from "components/FileBrowser";
import { ImageCanvas } from "components/ImageCanvas";
import { Slider } from "@mui/material";
import { useAppDispatch } from "state/hooks";
import { setSrc } from "state/slices/imageSlice";

const Home = () => {
  const dispatch = useAppDispatch();

  const onSliderChange = (e, val) => {
    console.log("SETTING SOURCE", val);
    dispatch(setSrc(`https://api.galatea.dsp.garvan.org.au/frame/${val}`));
  };

  return (
    <>
      <div
        style={{
          width: 1200,
          height: 600,
          //backgroundColor: "rgba(130, 130, 130, 0.5)",
          flexDirection: "row",
          display: "flex",
        }}
      >
        <FileBrowser
          bucket="cabana-dev"
          onSelectFile={(file) => {
            console.log("Setting image to", file.url);
            //setCurrentImg(file.url);
          }}
        />
        <ImageCanvas />
      </div>
      <Slider
        defaultValue={0}
        aria-label="Default"
        valueLabelDisplay="auto"
        step={1}
        marks
        min={0}
        max={19}
        style={{ width: 500 }}
        onChangeCommitted={onSliderChange}
      />
      <div>
        <LoginButton />
      </div>
    </>
  );
};
export default Home;
