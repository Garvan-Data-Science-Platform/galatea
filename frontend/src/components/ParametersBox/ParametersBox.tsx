import React from "react";
import { useAppSelector, useAppDispatch } from "state/hooks";

import { Bar } from "react-chartjs-2";

import { Chart, registerables } from "chart.js";
import { selectChartData } from "state/slices/chartSlice";
import {
  Box,
  Button,
  Card,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Modal,
  Popover,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import {
  selectChannel,
  selectCurrentImage,
  setChannel,
  selectReferenceFrame,
  setReferenceFrame,
  setCurrentImage,
  selectExcludedFrames,
  selectChannelCount,
} from "state/slices/imageSlice";
import {
  applyCorrection,
  deleteResult,
  getPT3,
  getResults,
  saveResult,
  waitForTaskSuccess,
} from "requests/flim";
import { algorithms } from "../../algorithms";
import {
  addResult,
  removeResult,
  selectSelectedResult,
  setError,
  setErrorText,
  setResults,
  setSelectedResult,
} from "state/slices/resultsSlice";
import auth0mockable from "../../auth0mockable";
Chart.register(...registerables);

export function ParametersBox() {
  const [localAlg, setLocalAlg] = React.useState(algorithms.local[0]);
  const [globalAlg, setGlobalAlg] = React.useState(algorithms.global[0]);
  const [localParams, setLocalParams] = React.useState(
    {} as Map<string, number>
  );
  const [modalOpen, setModalOpen] = React.useState(false);
  const [modalText, setModalText] = React.useState("");
  const [statusText, setStatusText] = React.useState("");
  const [delAnchorEl, setDelAnchorEl] =
    React.useState<HTMLButtonElement | null>(null);

  const channel = useAppSelector(selectChannel);
  const referenceFrame = useAppSelector(selectReferenceFrame);
  const dispatch = useAppDispatch();
  const { getAccessTokenSilently } = auth0mockable.useAuth0();
  const currentImg = useAppSelector(selectCurrentImage);
  const currentResult = useAppSelector(selectSelectedResult);
  const excluded = useAppSelector(selectExcludedFrames);

  const NUM_CHANNELS = useAppSelector(selectChannelCount);

  async function loadResults() {
    let token = await getAccessTokenSilently();
    let results = await getResults(token, currentImg || "");
    dispatch(setResults(results));
  }

  const handleError = (message: string) => {
    dispatch(setError(true));
    dispatch(setErrorText(message));
  };

  const onApplyCorrectionClicked = async () => {
    let token = await getAccessTokenSilently();
    setModalText("Applying Correction");
    setStatusText("");
    setModalOpen(true);

    let correctionProps = {
      source: currentImg || "",
      reference_frame: referenceFrame,
      channel: channel,
      global_algorithm: globalAlg.id,
      local_algorithm: localAlg.id,
      local_params: localParams,
    };

    let task_id = await applyCorrection(token, correctionProps);

    let success = await waitForTaskSuccess(
      token,
      task_id,
      handleError,
      setStatusText
    );
    setModalOpen(false);
    if (!success) return;
    await saveResult(token, { ...correctionProps, task_id: task_id });
    await loadResults();
    setModalOpen(false);
    dispatch(setSelectedResult(task_id));
  };

  const onDownloadClicked = async () => {
    let token = await getAccessTokenSilently();
    setModalText("Converting to PT3");
    setStatusText("");
    setModalOpen(true);

    let task_id = await getPT3(
      token,
      currentImg as string,
      currentResult as string,
      excluded
    );

    let success = await waitForTaskSuccess(
      token,
      task_id,
      handleError,
      setStatusText
    );
    setModalOpen(false);
    if (!success) return;

    //Download result
    var hiddenElement = document.createElement("a");
    let backendURL = import.meta.env["VITE_BACKEND_URL"];
    var url = `${backendURL}/pt3?result_id=${currentResult}&source=${currentImg}`;
    hiddenElement.href = url;
    hiddenElement.target = "_blank";
    hiddenElement.download = `${currentImg}-${currentResult}.pt3`;
    hiddenElement.click();
  };

  const handleCloseDelPopover = () => {
    setDelAnchorEl(null);
  };

  const handleClickDeleted = (event: React.MouseEvent<HTMLButtonElement>) => {
    setDelAnchorEl(event.currentTarget);
  };

  React.useEffect(() => {
    let params = {} as Map<string, number>;
    for (var i in localAlg.params) {
      params[localAlg.params[i].name] = localAlg.params[i].default;
    }
    setLocalParams(params);
  }, [localAlg]);

  return (
    <Card style={{ width: 250, padding: 20 }}>
      <FormControl sx={{ width: 120, mr: 1 }}>
        <InputLabel id="channel-select-label">Channel</InputLabel>
        <Select
          labelId="local-select-label"
          value={channel}
          label="Channel"
          onChange={(e) => dispatch(setChannel(Number(e.target.value)))}
          data-cy="channel-select"
        >
          {Array.from(Array(NUM_CHANNELS).keys()).map((key) => {
            return (
              <MenuItem key={`channel_${key}`} value={key}>
                {key + 1}
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>
      <FormControl sx={{ width: 120 }}>
        <TextField
          id="filled-number"
          label="Reference frame"
          type="number"
          defaultValue={1}
          onChange={(e) => {
            dispatch(setReferenceFrame(Number(e.target.value) - 1));
          }}
          InputLabelProps={{
            shrink: true,
          }}
          data-cy="ref-frame-field"
        />
      </FormControl>
      <Divider sx={{ marginTop: 2, marginBottom: 2 }} />
      <FormControl fullWidth>
        <InputLabel id="local-select-label">
          Local correction algorithm
        </InputLabel>
        <Select
          labelId="local-select-label"
          value={localAlg.name}
          label="Local correction algorithm"
          onChange={(e) =>
            setLocalAlg(
              algorithms.local.filter((val) => e.target.value == val.name)[0]
            )
          }
          data-cy="local-correction-select"
        >
          {algorithms.local.map((val) => {
            return (
              <MenuItem value={val.name} key={val.name}>
                {val.name}
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>
      {localAlg.params.map((v) => {
        return (
          <TextField
            fullWidth
            id={localAlg.name + "_" + v.name}
            label={v.name}
            type="number"
            defaultValue={v.default}
            InputLabelProps={{
              shrink: true,
            }}
            margin="dense"
            onChange={(e) => {
              setLocalParams((old_state) => {
                let new_state = { ...old_state };
                new_state[v.name] = Number(e.target.value);
                return new_state;
              });
            }}
          />
        );
      })}

      <Divider sx={{ marginTop: 2, marginBottom: 2 }} />
      <FormControl fullWidth>
        <InputLabel id="global-select-label">
          Global correction algorithm
        </InputLabel>
        <Select
          labelId="global-select-label"
          value={globalAlg.name}
          label="Global correction algorithm"
          onChange={(e) =>
            setGlobalAlg(
              algorithms.global.filter((val) => e.target.value == val.name)[0]
            )
          }
          data-cy="global-correction-select"
        >
          {algorithms.global.map((val) => {
            return (
              <MenuItem value={val.name} key={val.name}>
                {val.name}
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>
      <Button
        fullWidth
        variant="contained"
        sx={{ marginTop: 2 }}
        onClick={onApplyCorrectionClicked}
        data-cy="apply-correction-button"
      >
        Apply Correction
      </Button>
      <Button
        fullWidth
        variant="contained"
        sx={{ marginTop: 2 }}
        disabled={!currentResult}
        onClick={onDownloadClicked}
        data-cy="pt3-download"
      >
        Download as .pt3
      </Button>

      <Button
        fullWidth
        color="error"
        variant="contained"
        sx={{ marginTop: 2 }}
        disabled={!currentResult}
        onClick={handleClickDeleted}
        data-cy="delete-result-button"
      >
        Delete result
      </Button>

      <Modal open={modalOpen}>
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
          <Typography>{modalText}</Typography>
          <Typography>{statusText}</Typography>
          <CircularProgress sx={{ marginTop: 2 }} />
        </Box>
      </Modal>
      <Popover
        open={Boolean(delAnchorEl)}
        anchorEl={delAnchorEl}
        onClose={handleCloseDelPopover}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
      >
        <Box sx={{ p: 2, maxWidth: 200, textAlign: "center" }}>
          <Typography>
            Are you sure you want to delete the selected result?
          </Typography>
          <Button
            sx={{ marginTop: 2 }}
            color="error"
            variant="contained"
            onClick={() => {
              console.log("DELETING");
              const d = async () => {
                let token = await getAccessTokenSilently();
                await deleteResult(token, currentResult);
                dispatch(removeResult(currentResult));
              };
              d();

              handleCloseDelPopover();
            }}
            data-cy="confirm-delete-button"
          >
            Delete
          </Button>
          <Button
            sx={{ marginTop: 2, marginLeft: 1 }}
            color="warning"
            variant="outlined"
            onClick={handleCloseDelPopover}
          >
            Cancel
          </Button>
        </Box>
      </Popover>
    </Card>
  );
}
