// src/store/store.ts
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import wareHouseReducer from "./warehouseSlice";
import categoryReducer from "./categorySlice";
import productReducer from "./productSlice";
import inventoryReducer from "./inventorySlice";
import userReducer from "./userSlice";
import { billingApi } from "./billingApi";
import billingReducer from "./billingSlice";
import driverReducer from "./driverSlice";
import dealerReducer from "@/store/dealerSlice";
import purchaseReducer from "./purchaseSlice";
import companyProfileReducer from "./companyProfileSlice";
export const store = configureStore({
  reducer: {
    auth: authReducer,
    warehouse: wareHouseReducer,
    category: categoryReducer,
    product: productReducer,
    inventory: inventoryReducer,
    user: userReducer,
    driver: driverReducer,
    billing: billingReducer,
    [billingApi.reducerPath]: billingApi.reducer,
    dealer: dealerReducer,
    purchase: purchaseReducer,
    companyProfile: companyProfileReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(billingApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
