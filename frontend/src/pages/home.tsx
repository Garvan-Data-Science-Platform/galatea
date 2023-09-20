import LoginButton from "components/LoginButton";
import { FileBrowser } from "components/FileBrowser";
import { ImageCanvas } from "components/ImageCanvas";
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItem,
  Menu,
  MenuItem,
  Slider,
  Toolbar,
  Typography,
} from "@mui/material";

import { useAppDispatch } from "state/hooks";
import { setSrc } from "state/slices/imageSlice";
import Chart from "chart.js/auto";
import { Histogram } from "components/Histogram";
import { setChartFrame } from "state/slices/chartSlice";
import React from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Navigate, useNavigate } from "react-router-dom";
import { ParametersBox } from "components/ParametersBox";
import TopBarDrawerLayout from "components/TopBarDrawerLayout";

const Home = () => {
  const dispatch = useAppDispatch();
  const nav = useNavigate();

  const onSliderChange = (e, val) => {
    console.log("SETTING SOURCE", val);
    dispatch(setSrc(`${import.meta.env.VITE_BACKEND_URL}/frame/${val}`));
    dispatch(setChartFrame(val));
  };

  return (
    <Box sx={{ display: "flex", backgroundColor: "#f3f6f9" }}>
      <TopBarDrawerLayout>
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-around",
          }}
        >
          <ParametersBox />
          <div>
            <ImageCanvas />
            <Histogram />
          </div>
        </Box>
      </TopBarDrawerLayout>

      {/*
              <FileBrowser
        bucket="galatea"
        onSelectFile={(file) => {
          console.log("Setting image to", file.url);
          //setCurrentImg(file.url);
        }}
      />
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
      
      */}
    </Box>
  );
};
export default Home;
