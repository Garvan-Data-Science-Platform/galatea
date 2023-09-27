import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../store";

export interface fileSelectionState {
  selected: string[];
}

const initialState: fileSelectionState = {
  selected: [],
};

export const fileSelectionSlice = createSlice({
  name: "fileSelection",
  initialState,
  // The `reducers` field lets us define reducers and generate associated actions
  reducers: {
    // Use the PayloadAction type to declare the contents of `action.payload`
    toggleSelected: (state, action: PayloadAction<string>) => {
      if (state.selected.includes(action.payload)) {
        state.selected = state.selected.filter((val) => val != action.payload);
      } else {
        state.selected.push(action.payload);
      }
    },
    clearSelected: (state) => {
      state.selected = [];
    },
  },
});

export const { toggleSelected, clearSelected } = fileSelectionSlice.actions;

// The function below is called a selector and allows us to select a value from
// the state. Selectors can also be defined inline where they're used instead of
// in the slice file. For example: `useSelector((state: RootState) => state.fileSelection.value)`
export const selectFileSelectionSelected = (state: RootState) =>
  state.fileSelection.selected;

export default fileSelectionSlice.reducer;
