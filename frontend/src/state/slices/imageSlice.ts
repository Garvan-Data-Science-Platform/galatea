import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../store";

export interface ImageState {
  currentImage?: string;
  frameCount?: number;
  channel: number;
  referenceFrame: number;
  excludedFrames: number[];
  channelCount: number;
}

const initialState: ImageState = {
  currentImage: undefined,
  frameCount: undefined,
  excludedFrames: [],
  referenceFrame: 0,
  channel: 0,
  channelCount: 1,
};

export const imageSlice = createSlice({
  name: "image",
  initialState,
  // The `reducers` field lets us define reducers and generate associated actions
  reducers: {
    // Use the PayloadAction type to declare the contents of `action.payload`
    setCurrentImage: (state, action: PayloadAction<string>) => {
      state.currentImage = action.payload;
    },
    setFrameCount: (state, action: PayloadAction<number>) => {
      state.frameCount = action.payload;
    },
    setChannel: (state, action: PayloadAction<number>) => {
      state.channel = action.payload;
    },
    setChannelCount: (state, action: PayloadAction<number>) => {
      state.channelCount = action.payload;
    },
    setReferenceFrame: (state, action: PayloadAction<number>) => {
      state.referenceFrame = action.payload;
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
  setCurrentImage,
  setFrameCount,
  toggleExcludedFrame,
  resetExcludedFrames,
  setChannel,
  setChannelCount,
  setReferenceFrame,
} = imageSlice.actions;

// The function below is called a selector and allows us to select a value from
// the state. Selectors can also be defined inline where they're used instead of
// in the slice file. For example: `useSelector((state: RootState) => state.image.value)`
export const selectCurrentImage = (state: RootState) =>
  state.image.currentImage;
export const selectFrameCount = (state: RootState) => state.image.frameCount;
export const selectExcludedFrames = (state: RootState) =>
  state.image.excludedFrames;
export const selectChannel = (state: RootState) => state.image.channel;
export const selectChannelCount = (state: RootState) =>
  state.image.channelCount;
export const selectReferenceFrame = (state: RootState) =>
  state.image.referenceFrame;

export default imageSlice.reducer;
