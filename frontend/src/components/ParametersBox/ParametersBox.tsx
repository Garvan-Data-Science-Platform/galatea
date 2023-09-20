import React from "react";
import { useAppSelector, useAppDispatch } from "state/hooks";

import { Bar } from "react-chartjs-2";

import { Chart, registerables } from "chart.js";
import { selectChartData } from "state/slices/chartSlice";
import {
  Box,
  Card,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
Chart.register(...registerables);

export function ParametersBox() {
  const [localAlg, setLocalAlg] = React.useState("none");

  return (
    <Card style={{ width: 250, padding: 20 }}>
      <FormControl fullWidth>
        <InputLabel id="demo-simple-select-label">
          Local correction algorithm
        </InputLabel>
        <Select
          labelId="demo-simple-select-label"
          id="demo-simple-select"
          value={localAlg}
          label="Local correction algorithm"
          onChange={(e) => setLocalAlg(e.target.value)}
        >
          <MenuItem value="none">None</MenuItem>
          <MenuItem value="Alg1">Alg1</MenuItem>
          <MenuItem value="Alg2">Alg2</MenuItem>
        </Select>
      </FormControl>
    </Card>
  );
}
