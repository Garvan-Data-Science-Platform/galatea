import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../store";

export interface ImageState {
  src?: string;
  currentImage?: string;
  frameCount?: number;
  channel: number;
  excludedFrames: number[];
}

const initialState: ImageState = {
  src: undefined,
  currentImage: undefined,
  frameCount: undefined,
  excludedFrames: [],
  channel: 0,
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
    setCurrentImage: (state, action: PayloadAction<string>) => {
      state.currentImage = action.payload;
    },
    setFrameCount: (state, action: PayloadAction<number>) => {
      state.frameCount = action.payload;
    },
    setChannel: (state, action: PayloadAction<number>) => {
      state.channel = action.payload;
    },
    toggleExcludedFrame: (state, action: PayloadAction<number>) => {
      if (state.excludedFrames.includes(action.payload)) {
        state.excludedFrames = state.excludedFrames.filter(
          (val) => val !== action.payload
        );
      } else {
        state.excludedFrames.push(action.payload);
      }
    },
    resetExcludedFrames: (state, action: PayloadAction<undefined>) => {
      state.excludedFrames = [];
    },
  },
});

export const {
  setSrc,
  setCurrentImage,
  setFrameCount,
  toggleExcludedFrame,
  resetExcludedFrames,
  setChannel,
} = imageSlice.actions;

// The function below is called a selector and allows us to select a value from
// the state. Selectors can also be defined inline where they're used instead of
// in the slice file. For example: `useSelector((state: RootState) => state.image.value)`
export const selectImageSrc = (state: RootState) => state.image.src;
export const selectCurrentImage = (state: RootState) =>
  state.image.currentImage;
export const selectFrameCount = (state: RootState) => state.image.frameCount;
export const selectExcludedFrames = (state: RootState) =>
  state.image.excludedFrames;
export const selectChannel = (state: RootState) => state.image.channel;

export default imageSlice.reducer;
