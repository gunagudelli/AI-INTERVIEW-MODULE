import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import interviewReducer from './slices/interviewSlice';
import recruiterReducer from './slices/recruiterSlice';
import adminReducer from './slices/adminSlice';
import candidateReducer from './slices/candidateSlice';
import notificationReducer from './slices/notificationSlice';
import jobReducer from './slices/jobSlice';
import evaluationReducer from './slices/evaluationSlice';
import dashboardReducer from './slices/dashboardSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    interview: interviewReducer,
    recruiter: recruiterReducer,
    admin: adminReducer,
    candidate: candidateReducer,
    notification: notificationReducer,
    job: jobReducer,
    evaluation: evaluationReducer,
    dashboard: dashboardReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
