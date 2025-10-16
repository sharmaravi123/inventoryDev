import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios, { AxiosError } from "axios";

// Define the state interface
interface AuthState {
  token: string | null;
  role: "admin" | "warehouse" | null;
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: AuthState = {
  token: null,
  role: null,
  loading: false,
  error: null,
};

// Admin login thunk
export const adminLogin = createAsyncThunk(
  "auth/adminLogin",
  async (data: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const res = await axios.post("/api/admin/login", data);
      localStorage.setItem("token", res.data.token);
      return { token: res.data.token, role: "admin" as const };
    } catch (err: unknown) {
      const error = err as AxiosError<{ error?: string }>;
      return rejectWithValue(error.response?.data?.error || "Login failed");
    }
  }
);

// Warehouse login thunk
export const warehouseLogin = createAsyncThunk(
  "auth/warehouseLogin",
  async (data: { username: string; password: string }, { rejectWithValue }) => {
    try {
      const res = await axios.post("/api/warehouse/login", data);
      return { token: res.data.token, role: "warehouse" as const };
    } catch (err: unknown) {
      const error = err as AxiosError<{ error?: string }>;
      return rejectWithValue(error.response?.data?.error || "Login failed");
    }
  }
);

export const logoutUser = createAsyncThunk("auth/logoutUser", async () => {
  const res = await fetch("/api/auth/logout", { method: "POST" });
  if (!res.ok) throw new Error("Logout failed");
  return true;
});
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.token = null;
      state.role = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(adminLogin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(adminLogin.fulfilled, (state, action: PayloadAction<{ token: string; role: "admin" }>) => {
        state.loading = false;
        state.token = action.payload.token;
        state.role = action.payload.role;
      })
      .addCase(adminLogin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(warehouseLogin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(warehouseLogin.fulfilled, (state, action: PayloadAction<{ token: string; role: "warehouse" }>) => {
        state.loading = false;
        state.token = action.payload.token;
        state.role = action.payload.role;
      })
      .addCase(warehouseLogin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.token = null;
        state.role = null;
        state.loading = false;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.error = action.error.message || "Logout failed";
        state.loading = false;
      });
  },

})

export const { logout } = authSlice.actions;
export default authSlice.reducer;
