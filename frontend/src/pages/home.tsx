import LoginButton from "components/LoginButton";
import { FileBrowser } from "components/FileBrowser";
import { ImageCanvas } from "components/ImageCanvas";
import { Box, CircularProgress, Modal, Typography } from "@mui/material";

import { useAppDispatch } from "state/hooks";
import {
  resetExcludedFrames,
  setCurrentImage,
  setFrameCount,
  setSrc,
} from "state/slices/imageSlice";
import { Histogram } from "components/Histogram";
import React from "react";
import { ParametersBox } from "components/ParametersBox";
import TopBarDrawerLayout from "components/TopBarDrawerLayout";
import { FrameView } from "components/FrameView";
import {
  convertPTFile,
  getFrameCount,
  waitForTaskSuccess,
} from "requests/flim";
import auth0mockable from "../auth0mockable";

const Home = () => {
  const dispatch = useAppDispatch();
  const { getAccessTokenSilently } = auth0mockable.useAuth0();
  const [converting, setConverting] = React.useState(false);

  return (
    <Box sx={{ display: "flex" }}>
      <TopBarDrawerLayout
        sidebarContent={
          <FileBrowser
            bucket="galatea"
            onClickFile={async (f, ls) => {
              if (["pt3", "npy", "ptu"].includes(f.name.slice(-3))) {
                let token = await getAccessTokenSilently();
                let npy = f.name.replace("pt3", "npy").replace("ptu", "npy");
                if (!ls.includes(npy)) {
                  setConverting(true);
                  let task = await convertPTFile(token, f.name);
                  await waitForTaskSuccess(token, task.task_id);
                  setConverting(false);
                }
                console.log("Setting active image", npy);
                dispatch(setCurrentImage(npy));
                dispatch(resetExcludedFrames());
                dispatch(
                  setSrc(
                    `${import.meta.env.VITE_BACKEND_URL}/combined?source=${npy}`
                  )
                );
                let count = await getFrameCount(token, npy);
                dispatch(setFrameCount(count));
              }
            }}
          />
        }
      >
        <Modal open={converting}>
          <Box
            sx={{
              position: "absolute" as "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 400,
              bgcolor: "background.paper",
              border: "2px solid #000",
              boxShadow: 24,
              p: 4,
              textAlign: "center",
            }}
          >
            <Typography>Converting file to numpy format</Typography>
            <CircularProgress sx={{ marginTop: 2 }} />
          </Box>
        </Modal>
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
          }}
        >
          <ParametersBox />

          <Box sx={{ marginLeft: 3, marginRight: 3 }}>
            <FrameView />
            <div style={{ marginTop: 5 }} />
            <Histogram />
          </Box>
          <div>
            <ImageCanvas />
            <div style={{ marginTop: 5 }} />
            <Histogram />
          </div>
        </Box>
      </TopBarDrawerLayout>
    </Box>
  );
};
export default Home;
