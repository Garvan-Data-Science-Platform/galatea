import React from "react";
import { useAppSelector, useAppDispatch } from "state/hooks";

import { Bar } from "react-chartjs-2";

import { Chart, registerables } from "chart.js";
import { selectChartData } from "state/slices/chartSlice";
Chart.register(...registerables);

export function Histogram() {
  const data = useAppSelector(selectChartData);
  const labels = new Array(132).fill("");
  const chartData = {
    labels: labels,
    datasets: [
      {
        label: "Chart Data",
        data: data,
      },
    ],
  };

  return (
    <div style={{ width: 600, height: 600 }}>
      <Bar data={chartData} options={{ scales: { y: { suggestedMax: 2 } } }} />
    </div>
  );
}
