// src/store/store.ts
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import wareHouseReducer from "./warehouseSlice";
import categoryReducer from "./categorySlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    warehouse: wareHouseReducer,
    category: categoryReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
