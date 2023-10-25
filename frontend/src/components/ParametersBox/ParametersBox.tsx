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
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Modal,
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
} from "state/slices/imageSlice";
import { applyCorrection, getResults, waitForTaskSuccess } from "requests/flim";
import { algorithms } from "../../algorithms";
import { useAuth0 } from "@auth0/auth0-react";
import { setResults, setSelectedResult } from "state/slices/resultsSlice";
Chart.register(...registerables);

export function ParametersBox() {
  const [localAlg, setLocalAlg] = React.useState(algorithms.local[0]);
  const [globalAlg, setGlobalAlg] = React.useState(algorithms.global[0]);
  const [localParams, setLocalParams] = React.useState({});
  const [applying, setApplying] = React.useState(false);

  const channel = useAppSelector(selectChannel);
  const referenceFrame = useAppSelector(selectReferenceFrame);
  const dispatch = useAppDispatch();
  const { getAccessTokenSilently } = useAuth0();
  const currentImg = useAppSelector(selectCurrentImage);

  const NUM_CHANNELS = 3;

  async function loadResults() {
    let token = await getAccessTokenSilently();
    let results = await getResults(token, currentImg || "");
    dispatch(setResults(results));
  }

  const onApplyCorrectionClicked = async () => {
    let token = await getAccessTokenSilently();
    setApplying(true);

    let task_id = await applyCorrection(token, {
      source: currentImg || "",
      reference_frame: referenceFrame,
      channel: channel,
      global_algorithm: globalAlg.id,
      local_algorithm: localAlg.id,
      local_params: localParams,
    });

    await waitForTaskSuccess(token, task_id);
    await loadResults();
    setApplying(false);
    dispatch(setSelectedResult(task_id));
  };

  React.useEffect(() => {
    let params = {};
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
            dispatch(setReferenceFrame(Number(e.target.value)));
          }}
          InputLabelProps={{
            shrink: true,
          }}
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
        >
          {algorithms.local.map((val) => {
            return <MenuItem value={val.name}>{val.name}</MenuItem>;
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
        >
          {algorithms.global.map((val) => {
            return <MenuItem value={val.name}>{val.name}</MenuItem>;
          })}
        </Select>
      </FormControl>
      <Button
        fullWidth
        variant="contained"
        sx={{ marginTop: 2 }}
        onClick={onApplyCorrectionClicked}
      >
        Apply Correction
      </Button>
      <Modal open={applying}>
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
          <Typography>Applying Correction</Typography>
          <CircularProgress sx={{ marginTop: 2 }} />
        </Box>
      </Modal>
    </Card>
  );
}
