import React from "react";
import { useAppSelector, useAppDispatch } from "state/hooks";

import { Bar } from "react-chartjs-2";

import { Chart, registerables } from "chart.js";
import { selectChartData } from "state/slices/chartSlice";
import {
  Box,
  Button,
  Card,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import { selectChannel, setChannel } from "state/slices/imageSlice";
Chart.register(...registerables);

export function ParametersBox() {
  const [localAlg, setLocalAlg] = React.useState("none");
  const [referenceFrame, setReferenceFrame] = React.useState(1);

  const channel = useAppSelector(selectChannel);
  const dispatch = useAppDispatch();

  const NUM_CHANNELS = 3;

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
          onChange={setReferenceFrame}
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
          value={localAlg}
          label="Local correction algorithm"
          onChange={(e) => setLocalAlg(e.target.value)}
        >
          <MenuItem value="none">None</MenuItem>
          <MenuItem value="Alg1">Alg1</MenuItem>
          <MenuItem value="Alg2">Alg2</MenuItem>
        </Select>
      </FormControl>
      <Divider sx={{ marginTop: 2, marginBottom: 2 }} />
      <FormControl fullWidth>
        <InputLabel id="global-select-label">
          Global correction algorithm
        </InputLabel>
        <Select
          labelId="global-select-label"
          value={localAlg}
          label="Global correction algorithm"
          onChange={(e) => setLocalAlg(e.target.value)}
        >
          <MenuItem value="none">None</MenuItem>
          <MenuItem value="Alg1">Alg1</MenuItem>
          <MenuItem value="Alg2">Alg2</MenuItem>
        </Select>
      </FormControl>
      <Button fullWidth variant="contained" sx={{ marginTop: 2 }}>
        Apply Correction
      </Button>
    </Card>
  );
}
