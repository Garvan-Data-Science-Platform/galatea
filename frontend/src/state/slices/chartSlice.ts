import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../store";

export interface ChartState {
  data: number[];
  frame: number;
}

const initialState: ChartState = {
  data: Array(133).fill(0),
  frame: 0,
};

export const chartSlice = createSlice({
  name: "chart",
  initialState,
  // The `reducers` field lets us define reducers and generate associated actions
  reducers: {
    // Use the PayloadAction type to declare the contents of `action.payload`
    setChartData: (state, action: PayloadAction<number[]>) => {
      state.data = action.payload;
    },
    setChartFrame: (state, action: PayloadAction<number>) => {
      state.frame = action.payload;
    },
    clearChartData: (state) => {
      state.data = initialState.data;
    },
  },
});

export const { setChartData, setChartFrame, clearChartData } =
  chartSlice.actions;

// The function below is called a selector and allows us to select a value from
// the state. Selectors can also be defined inline where they're used instead of
// in the slice file. For example: `useSelector((state: RootState) => state.chart.value)`
export const selectChartData = (state: RootState) => state.chart.data;
export const selectChartFrame = (state: RootState) => state.chart.frame;

export default chartSlice.reducer;
