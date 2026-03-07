import { configureStore } from '@reduxjs/toolkit';
import alertsReducer from './alertsSlice';

export const store = configureStore({
  reducer: {
    alerts: alertsReducer,
  },
});
