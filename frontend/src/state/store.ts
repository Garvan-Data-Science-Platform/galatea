import { configureStore, ThunkAction, Action } from "@reduxjs/toolkit";
import counterReducer from "./slices/counterSlice";
import imageReducer from "./slices/imageSlice";
import chartReducer from "./slices/chartSlice";

export const store = configureStore({
  reducer: {
    counter: counterReducer,
    image: imageReducer,
    chart: chartReducer,
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
