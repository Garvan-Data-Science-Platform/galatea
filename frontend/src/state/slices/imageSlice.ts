import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../store";

export interface ImageState {
  src?: string;
}

const initialState: ImageState = {
  src: undefined,
};

export const imageSlice = createSlice({
  name: "image",
  initialState,
  // The `reducers` field lets us define reducers and generate associated actions
  reducers: {
    // Use the PayloadAction type to declare the contents of `action.payload`
    setSrc: (state, action: PayloadAction<string>) => {
      state.src = action.payload;
    },
  },
});

export const { setSrc } = imageSlice.actions;

// The function below is called a selector and allows us to select a value from
// the state. Selectors can also be defined inline where they're used instead of
// in the slice file. For example: `useSelector((state: RootState) => state.image.value)`
export const selectImageSrc = (state: RootState) => state.image.src;

export default imageSlice.reducer;
