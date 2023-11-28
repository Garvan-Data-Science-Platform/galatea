import { configureStore, ThunkAction, Action } from "@reduxjs/toolkit";
import imageReducer from "./slices/imageSlice";
import chartReducer from "./slices/chartSlice";
import resultsReducer from "./slices/resultsSlice";
import fileSelectionReducer from "./slices/fileSelectionSlice";

export const store = configureStore({
  reducer: {
    image: imageReducer,
    chart: chartReducer,
    fileSelection: fileSelectionReducer,
    results: resultsReducer,
  },
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
