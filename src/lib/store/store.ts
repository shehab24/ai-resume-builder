import { configureStore } from "@reduxjs/toolkit";
import resumeReducer from "./resumeSlice";

export const store = configureStore({
  reducer: {
    resume: resumeReducer,
  },
});

// Persistence middleware
store.subscribe(() => {
  const state = store.getState();
  if (typeof window !== "undefined") {
    localStorage.setItem("resume_builder_state", JSON.stringify(state.resume));
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
