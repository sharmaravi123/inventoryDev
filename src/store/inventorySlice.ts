import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

export type InventoryItem = any; // replace with proper type

const getToken = () => localStorage.getItem("token") || "";

// Fetch all stocks
export const fetchInventory = createAsyncThunk<InventoryItem[]>(
  "inventory/fetch",
  async () => {
    const token = getToken();
    const res = await axios.get("/api/stocks", { headers: { Authorization: `Bearer ${token}` } });
    return res.data;
  }
);

// Add new stock
export const addInventory = createAsyncThunk<InventoryItem, any>(
  "inventory/add",
  async (data) => {
    const token = getToken();
    const res = await axios.post("/api/stocks", data, { headers: { Authorization: `Bearer ${token}` } });
    return res.data;
  }
);

// Update existing stock
export const updateInventory = createAsyncThunk<InventoryItem, { id: number } & any>(
  "inventory/update",
  async ({ id, ...data }) => {
    const token = getToken();
    const res = await axios.put(`/api/stocks/${id}`, data, { headers: { Authorization: `Bearer ${token}` } });
    return res.data;
  }
);

// Delete stock
export const deleteInventory = createAsyncThunk<number, number>(
  "inventory/delete",
  async (id) => {
    const token = getToken();
    await axios.delete(`/api/stocks/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    return id;
  }
);

interface InventoryState {
  items: InventoryItem[];
  loading: boolean;
  error?: string | null;
}

const initialState: InventoryState = {
  items: [],
  loading: false,
  error: null,
};

const inventorySlice = createSlice({
  name: "inventory",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // FETCH
      .addCase(fetchInventory.pending, (state) => { state.loading = true; })
      .addCase(fetchInventory.fulfilled, (state, action: PayloadAction<InventoryItem[]>) => {
        state.items = action.payload;
        state.loading = false;
      })
      .addCase(fetchInventory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to fetch inventory";
      })

      // ADD
      .addCase(addInventory.fulfilled, (state, action: PayloadAction<InventoryItem>) => {
        state.items.unshift(action.payload);
      })

      // UPDATE
      .addCase(updateInventory.fulfilled, (state, action: PayloadAction<InventoryItem>) => {
        const index = state.items.findIndex((x) => x.id === action.payload.id);
        if (index !== -1) state.items[index] = action.payload;
      })

      // DELETE
      .addCase(deleteInventory.fulfilled, (state, action: PayloadAction<number>) => {
        state.items = state.items.filter((x) => x.id !== action.payload);
      });
  },
});

export default inventorySlice.reducer;
