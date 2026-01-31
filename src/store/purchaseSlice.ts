import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

export interface Purchase {
  _id: string;
  dealerId?: { name: string; phone: string; address: string };
  items: any[];
  grandTotal: number;
  createdAt: string;
}

interface PurchaseState {
  list: Purchase[];
  loading: boolean;
}

const initialState: PurchaseState = {
  list: [],
  loading: false,
};

const getToken = () =>
  typeof window !== "undefined" ? localStorage.getItem("token") : null;

export const fetchPurchases = createAsyncThunk<Purchase[]>(
  "purchase/fetch",
  async () => {
    const res = await fetch("/api/purchase", {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    return await res.json();
  }
);

export const createPurchase = createAsyncThunk<Purchase, any>(
  "purchase/create",
  async (payload) => {
    const res = await fetch("/api/purchase", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify(payload),
    });
    return await res.json();
  }
);

const purchaseSlice = createSlice({
  name: "purchase",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPurchases.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPurchases.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(createPurchase.fulfilled, (state, action) => {
        state.list.push(action.payload);
      });
  },
});

export default purchaseSlice.reducer;
