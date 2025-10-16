// src/store/warehouseSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

export interface Warehouse {
  id: string;
  name: string;
  email: string;
  username: string;
  createdAt?: string;
}

interface WarehouseState {
  list: Warehouse[];
  loading: boolean;
  error: string | null;
}

const initialState: WarehouseState = {
  list: [],
  loading: false,
  error: null,
};

// Fetch warehouses
export const fetchWarehouses = createAsyncThunk(
  "warehouse/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/warehouse", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data.warehouses as Warehouse[];
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

// Create warehouse
export const createWarehouse = createAsyncThunk(
  "warehouse/create",
  async (
    payload: { name: string; email: string; username: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post("/api/warehouse/create", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data.warehouse as Warehouse;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || err.message);
    }
  }
);

// Update warehouse name
export const updateWarehouseName = createAsyncThunk(
  "warehouse/updateName",
  async (payload: { id: string; name: string }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(`/api/warehouse/${payload.id}`, { name: payload.name }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data.warehouse as Warehouse;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || err.message);
    }
  }
);

// Delete warehouse
export const deleteWarehouse = createAsyncThunk(
  "warehouse/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`/api/warehouse/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || err.message);
    }
  }
);

const warehouseSlice = createSlice({
  name: "warehouse",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchWarehouses.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchWarehouses.fulfilled, (state, action: PayloadAction<Warehouse[]>) => { state.loading = false; state.list = action.payload; })
      .addCase(fetchWarehouses.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      
      // Create
      .addCase(createWarehouse.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(createWarehouse.fulfilled, (state, action: PayloadAction<Warehouse>) => { state.loading = false; state.list.unshift(action.payload); })
      .addCase(createWarehouse.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })

      // Update
      .addCase(updateWarehouseName.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(updateWarehouseName.fulfilled, (state, action: PayloadAction<Warehouse>) => {
        state.loading = false;
        const idx = state.list.findIndex((w) => w.id === action.payload.id);
        if (idx >= 0) state.list[idx] = action.payload;
      })
      .addCase(updateWarehouseName.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })

      // Delete
      .addCase(deleteWarehouse.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(deleteWarehouse.fulfilled, (state, action: PayloadAction<string>) => { state.loading = false; state.list = state.list.filter((w) => w.id !== action.payload); })
      .addCase(deleteWarehouse.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; });
  },
});

export default warehouseSlice.reducer;
