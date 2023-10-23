import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../store";

interface Result {
  task_id: string;
  completed: boolean;
  source: string;
  channel: number;
  timestamp: Date;
  local_algorithm: string;
  global_algorithm: string;
  local_params: Map<string, string>;
  global_params: Map<string, string>;
}

export interface ResultsState {
  results: Result[];
  selected?: string;
}

const initialState: ResultsState = {
  results: [],
};

export const resultsSlice = createSlice({
  name: "results",
  initialState,
  // The `reducers` field lets us define reducers and generate associated actions
  reducers: {
    // Use the PayloadAction type to declare the contents of `action.payload`
    setResults: (state, action: PayloadAction<Result[]>) => {
      state.results = action.payload;
    },
    addResult: (state, action: PayloadAction<Result>) => {
      state.results.push(action.payload);
      state.selected = action.payload.task_id;
    },
    setSelectedResult: (state, action: PayloadAction<string>) => {
      state.selected = action.payload;
    },
    deselectResult: (state) => {
      state.selected = undefined;
    },
  },
});

export const { setResults, addResult, setSelectedResult, deselectResult } =
  resultsSlice.actions;

// The function below is called a selector and allows us to select a value from
// the state. Selectors can also be defined inline where they're used instead of
// in the slice file. For example: `useSelector((state: RootState) => state.image.value)`
export const selectResults = (state: RootState) => state.results.results;
export const selectSelectedResult = (state: RootState) =>
  state.results.selected;

export default resultsSlice.reducer;
