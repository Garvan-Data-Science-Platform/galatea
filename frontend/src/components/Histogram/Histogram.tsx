import React from "react";
import { useAppSelector, useAppDispatch } from "state/hooks";

import { Bar } from "react-chartjs-2";

import { Chart, registerables } from "chart.js";
import { selectChartData } from "state/slices/chartSlice";
import { Paper, Typography } from "@mui/material";
Chart.register(...registerables);

export function Histogram() {
  const data = useAppSelector(selectChartData);
  const labels = Array.from(Array(132).keys());
  const chartData = {
    labels: labels,
    datasets: [
      {
        label: "Photon Count (5x5 box)",
        data: data,
        spanGaps: 5,
      },
    ],
  };

  return (
    <Paper sx={{ flexGrow: 1, height: 300, padding: 1 }}>
      <Typography fontStyle="italic">
        Click FLIM Image above to populate chart
      </Typography>
      <Bar
        data={chartData}
        options={{
          scales: {
            y: { suggestedMax: 2 },
            x: { type: "linear", title: { text: "Nanotimes", display: true } },
          },
        }}
      />
    </Paper>
  );
}
