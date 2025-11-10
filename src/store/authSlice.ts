// store/authSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios, { AxiosError } from "axios";

interface AuthState {
  role: "admin" | "user" | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  role: null,
  loading: false,
  error: null,
};

export const adminLogin = createAsyncThunk(
  "auth/adminLogin",
  async (data: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const res = await axios.post("/api/admin/login", data, { withCredentials: true });
      return { role: "admin" as const, admin: res.data.admin };
    } catch (err: unknown) {
      const error = err as AxiosError<{ error?: string }>;
      return rejectWithValue(error.response?.data?.error || "Login failed");
    }
  }
);

export const userLogin = createAsyncThunk(
  "auth/userLogin",
  async (data: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const res = await axios.post("/api/auth/login", data, { withCredentials: true });
      return { role: "user" as const, user: res.data.user };
    } catch (err: unknown) {
      const error = err as AxiosError<{ error?: string }>;
      return rejectWithValue(error.response?.data?.error || "Login failed");
    }
  }
);

export const logoutUser = createAsyncThunk("auth/logoutUser", async () => {
  const res = await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
  if (!res.ok) throw new Error("Logout failed");
  return true;
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: { clearAuth(state) { state.role = null; state.error = null; } },
  extraReducers: (builder) => {
    builder
      .addCase(adminLogin.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(adminLogin.fulfilled, (s, a: PayloadAction<{ role: "admin"; admin: any }>) => { s.loading = false; s.role = a.payload.role; })
      .addCase(adminLogin.rejected, (s, a) => { s.loading = false; s.error = a.payload as string; })
      .addCase(userLogin.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(userLogin.fulfilled, (s, a: PayloadAction<{ role: "user"; user: any }>) => { s.loading = false; s.role = a.payload.role; })
      .addCase(userLogin.rejected, (s, a) => { s.loading = false; s.error = a.payload as string; })
      .addCase(logoutUser.fulfilled, (s) => { s.role = null; s.loading = false; })
      .addCase(logoutUser.rejected, (s, a) => { s.error = a.error.message || "Logout failed"; s.loading = false; });
  }
});

export const { clearAuth } = authSlice.actions;
export default authSlice.reducer;
