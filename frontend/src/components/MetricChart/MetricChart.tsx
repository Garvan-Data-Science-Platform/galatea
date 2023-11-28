import React from "react";
import { useAppSelector, useAppDispatch } from "state/hooks";

import { Line } from "react-chartjs-2";

import { Chart, registerables } from "chart.js";
import { selectChartData } from "state/slices/chartSlice";
import {
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Typography,
} from "@mui/material";
import { selectSelectedResult } from "state/slices/resultsSlice";
import { selectCurrentImage, selectFrameCount } from "state/slices/imageSlice";
import { loadMetrics } from "requests/flim";
import auth0mockable from "../../auth0mockable";

Chart.register(...registerables);

export function MetricChart() {
  const currentResult = useAppSelector(selectSelectedResult);
  const currentImage = useAppSelector(selectCurrentImage);
  const frameCount = useAppSelector(selectFrameCount);
  const labels = Array.from(Array(frameCount || 20).keys());
  const { getAccessTokenSilently } = auth0mockable.useAuth0();

  const baseData = {
    mse: {
      original: Array(frameCount || 20).fill(0),
      corrected: Array(frameCount || 20).fill(0),
    },
    ncc: {
      original: Array(frameCount || 20).fill(0),
      corrected: Array(frameCount || 20).fill(0),
    },
    nrm: {
      original: Array(frameCount || 20).fill(0),
      corrected: Array(frameCount || 20).fill(0),
    },
    ssi: {
      original: Array(frameCount || 20).fill(0),
      corrected: Array(frameCount || 20).fill(0),
    },
  };

  const [metricsData, setMetricsData] = React.useState(baseData);
  const [metric, setMetric] = React.useState("ssi");

  React.useEffect(() => {
    async function metrics() {
      if (currentResult) {
        let token = await getAccessTokenSilently();
        let dat = await loadMetrics(token, currentImage + "/" + currentResult);
        setMetricsData(dat);
      } else {
        setMetricsData(baseData);
      }
    }
    metrics();
  }, [currentResult]);

  const chartData = {
    labels: labels,
    datasets: [
      {
        label: "Original",
        data: metricsData[metric]["original"],
      },
      {
        label: "Corrected",
        data: metricsData[metric]["corrected"],
      },
    ],
  };

  return (
    <Paper sx={{ flexGrow: 1, height: 300, padding: 1 }}>
      <Line data={chartData} options={{ scales: { x: { type: "linear" } } }} />
      <FormControl sx={{ mt: 1 }}>
        <InputLabel id="metric-select-label">Metric</InputLabel>
        <Select
          labelId="local-select-label"
          value={metric}
          label="Local correction algorithm"
          onChange={(e) => setMetric(e.target.value)}
          size="small"
        >
          <MenuItem value="ssi">Structural Similarity Index</MenuItem>
          <MenuItem value="mse">Mean Squared Error</MenuItem>
          <MenuItem value="nrm">Normalised Root MSE</MenuItem>
          <MenuItem value="ncc">Normalised Cross Correction</MenuItem>
        </Select>
      </FormControl>
    </Paper>
  );
}
