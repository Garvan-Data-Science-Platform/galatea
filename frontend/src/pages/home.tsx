import LoginButton from "components/LoginButton";
import { FileBrowser } from "components/FileBrowser";
import { ImageCanvas } from "components/ImageCanvas";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Modal,
  Typography,
} from "@mui/material";

import { useAppDispatch, useAppSelector } from "state/hooks";
import {
  resetExcludedFrames,
  setChannel,
  setChannelCount,
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
  checkWorker,
  convertPTFile,
  getChannelCount,
  getFrameCount,
  preload,
  startupWorker,
  waitForTaskSuccess,
} from "requests/flim";
import auth0mockable from "../auth0mockable";
import { ResultsList } from "components/ResultsList";
import { MetricChart } from "components/MetricChart";
import {
  selectError,
  selectErrorText,
  setError,
  setErrorText,
} from "state/slices/resultsSlice";

const Home = () => {
  const dispatch = useAppDispatch();
  const { getAccessTokenSilently } = auth0mockable.useAuth0();
  const [loading, setLoading] = React.useState(false);
  const [statusText, setStatusText] = React.useState("");
  const error = useAppSelector(selectError);
  const errorText = useAppSelector(selectErrorText);

  const startup = async () => {
    let token = await getAccessTokenSilently();
    let workerReady = await checkWorker(token);
    if (!workerReady) {
      setLoading(true);
      setStatusText("Starting up application, this may take a few minutes.");
      await startupWorker(token);
      setLoading(false);
    }
  };
  const checkIdle = async () => {
    let token = await getAccessTokenSilently();
    let workerReady = await checkWorker(token);
    if (!workerReady) {
      setLoading(true);
      setStatusText(
        "Application has shut down due to inactivity. Please reload page."
      );
    }
  };

  React.useEffect(() => {
    startup();
    //Every 5 mins
    setInterval(() => {
      checkIdle();
    }, 1000 * 60 * 5);
  }, []);

  const handleError = (message: string) => {
    dispatch(setError(true));
    dispatch(setErrorText(message));
  };

  return (
    <Box sx={{ display: "flex", backgroundColor: "#f3f6f9" }}>
      <TopBarDrawerLayout
        sidebarContent={
          <>
            <FileBrowser
              bucket="galatea"
              extensions={[".npy", ".ptu", ".pt3"]}
              combine={true}
              onClickFile={async (f, ls) => {
                let token = await getAccessTokenSilently();

                if (
                  (f.extensions?.includes(".pt3") ||
                    f.extensions?.includes(".ptu")) &&
                  !f.extensions?.includes(".npy")
                ) {
                  setLoading(true);
                  let task = await convertPTFile(
                    token,
                    f.name + (f.extensions.includes(".pt3") ? ".pt3" : ".ptu")
                  );
                  let success = await waitForTaskSuccess(
                    token,
                    task.task_id,
                    handleError,
                    setStatusText
                  );
                  setLoading(false);
                  if (!success) return;
                  f.extensions.push(".npy");
                }
                if (f.extensions?.includes(".npy")) {
                  console.log("Setting active image", f.name);
                  console.log("PRELOADING");
                  dispatch(setChannel(0));
                  setStatusText("Loading file");
                  setLoading(true);
                  let ptask = await preload(token, f.name);
                  let success = await waitForTaskSuccess(
                    token,
                    ptask,
                    handleError,
                    setStatusText
                  );
                  setLoading(false);
                  if (!success) return;
                  dispatch(setCurrentImage(f.name));
                  dispatch(resetExcludedFrames());
                  let count = await getFrameCount(token, f.name);
                  dispatch(setFrameCount(count));
                  let channelCount = await getChannelCount(token, f.name);
                  dispatch(setChannelCount(channelCount));
                }
              }}
            />
            <ResultsList />
          </>
        }
      ></TopBarDrawerLayout>
      <Modal open={loading}>
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
          data-cy="loading-box"
        >
          <Typography>Loading</Typography>
          <Typography>{statusText}</Typography>
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
          <MetricChart />
        </Box>
        <div>
          <ImageCanvas />
          <div style={{ marginTop: 5 }} />
          <Histogram />
        </div>
      </Box>
      <Dialog open={error} maxWidth="lg">
        <DialogTitle id="alert-dialog-title" color="error">
          {"Error"}
        </DialogTitle>
        <DialogContent>
          <pre>{errorText}</pre>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => dispatch(setError(false))}>Dismiss</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
export default Home;
