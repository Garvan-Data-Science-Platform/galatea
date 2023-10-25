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
import React, { memo } from "react";
import { ParametersBox } from "components/ParametersBox";
import TopBarDrawerLayout from "components/TopBarDrawerLayout";
import { FrameView } from "components/FrameView";
import {
  convertPTFile,
  getFrameCount,
  waitForTaskSuccess,
} from "requests/flim";
import auth0mockable from "../auth0mockable";
import { ResultsList } from "components/ResultsList";

const Home = () => {
  const dispatch = useAppDispatch();
  const { getAccessTokenSilently } = auth0mockable.useAuth0();
  const [converting, setConverting] = React.useState(false);

  return (
    <Box sx={{ display: "flex", backgroundColor: "#f3f6f9" }}>
      <TopBarDrawerLayout
        sidebarContent={
          <>
            <FileBrowser
              bucket="galatea"
              extensions={[".npy", ".ptu", ".pt3", ".p"]}
              combine={true}
              onClickFile={async (f, ls) => {
                let token = await getAccessTokenSilently();

                if (
                  (f.extensions?.includes(".pt3") ||
                    f.extensions?.includes(".ptu")) &&
                  !f.extensions?.includes(".npy")
                ) {
                  setConverting(true);
                  let task = await convertPTFile(token, f.name);
                  await waitForTaskSuccess(token, task.task_id);
                  setConverting(false);
                  f.extensions.push(".npy");
                }
                if (f.extensions?.includes(".npy")) {
                  console.log("Setting active image", f.name);
                  dispatch(setCurrentImage(f.name));
                  dispatch(resetExcludedFrames());
                  let count = await getFrameCount(token, f.name);
                  dispatch(setFrameCount(count));
                }
              }}
            />
            <ResultsList />
          </>
        }
      ></TopBarDrawerLayout>
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
          mt: 5,
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
    </Box>
  );
};
export default Home;
