import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../store";
import type { Result } from "../../requests/flim";

export interface ResultsState {
  results: Result[];
  selected?: string;
  error: boolean;
  errorText: string;
}

const initialState: ResultsState = {
  results: [],
  error: false,
  errorText: "",
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
    setResultFlimAdjusted: (state) => {
      state.results.filter(
        (val) => val.task_id == state.selected
      )[0].flim_adjusted = true;
    },
    addResult: (state, action: PayloadAction<Result>) => {
      state.results.push(action.payload);
      state.selected = action.payload.task_id;
    },
    removeResult: (state, action: PayloadAction<Result>) => {
      state.results = state.results.filter((x) => {
        return x.task_id != action.payload;
      });
      state.selected = undefined;
    },
    setSelectedResult: (state, action: PayloadAction<string>) => {
      state.selected = action.payload;
    },
    deselectResult: (state) => {
      state.selected = undefined;
    },
    setError: (state, action: PayloadAction<boolean>) => {
      state.error = action.payload;
    },
    setErrorText: (state, action: PayloadAction<string>) => {
      state.errorText = action.payload;
    },
  },
});

export const {
  setResults,
  addResult,
  removeResult,
  setSelectedResult,
  deselectResult,
  setResultFlimAdjusted,
  setError,
  setErrorText,
} = resultsSlice.actions;

// The function below is called a selector and allows us to select a value from
// the state. Selectors can also be defined inline where they're used instead of
// in the slice file. For example: `useSelector((state: RootState) => state.image.value)`
export const selectResults = (state: RootState) => state.results.results;
export const selectSelectedResult = (state: RootState) =>
  state.results.selected;
export const selectError = (state: RootState) => state.results.error;
export const selectErrorText = (state: RootState) => state.results.errorText;

export default resultsSlice.reducer;
