// ./src/store/userSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

export interface User {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "user";
  warehouses?: { _id: string; name?: string }[]; // populated or just ids
  access?: { level: "all" | "limited"; permissions: string[] };
}

interface UserState {
  list: User[];
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  list: [],
  loading: false,
  error: null,
};

const axiosInstance = axios.create({ withCredentials: true, baseURL: "/" });

// fetch all users
export const fetchUsers = createAsyncThunk<User[], void, { rejectValue: string }>(
  "user/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get("/api/user/list");
      const data = res.data?.users ?? res.data;
      return (data as User[]) || [];
    } catch (err: unknown) {
      return rejectWithValue((err as Error).message || "Failed to fetch users");
    }
  }
);

// create user (single warehouseId)
export const createUser = createAsyncThunk<User, {
  name: string;
  email: string;
  password?: string; // optional
  warehouseId?: string; // single warehouse
  access: { level: "all" | "limited"; permissions: string[] };
}, { rejectValue: string }>(
  "user/create",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post("/api/user/create", payload);
      return res.data.user as User;
    } catch (err: unknown) {
      return rejectWithValue((err as Error).message || "Failed to create user");
    }
  }
);

// update access / single warehouse
export const updateUserAccess = createAsyncThunk<User, {
  userId: string;
  access?: { level: "all" | "limited"; permissions: string[] };
  warehouseId?: string; // single
}, { rejectValue: string }>(
  "user/updateAccess",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.patch("/api/user/update-access", payload);
      return (res.data?.user ?? res.data) as User;
    } catch (err: unknown) {
      return rejectWithValue((err as Error).message || "Failed to update user");
    }
  }
);

// delete user
export const deleteUser = createAsyncThunk<string, { userId: string }, { rejectValue: string }>(
  "user/delete",
  async ({ userId }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post("/api/user/delete", { userId });
      if (res.data?.success) return userId;
      return rejectWithValue(res.data?.error || "Delete failed");
    } catch (err: unknown) {
      return rejectWithValue((err as Error).message || "Failed to delete user");
    }
  }
);

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => { state.loading = true; })
      .addCase(fetchUsers.fulfilled, (state, action) => { state.loading = false; state.list = action.payload ?? []; })
      .addCase(fetchUsers.rejected, (state, action) => { state.loading = false; state.error = action.payload || "Error loading users"; })

      .addCase(createUser.pending, (state) => { state.loading = true; })
      .addCase(createUser.fulfilled, (state, action) => { state.loading = false; if (action.payload) state.list.unshift(action.payload); })
      .addCase(createUser.rejected, (state, action) => { state.loading = false; state.error = action.payload || "Error creating user"; })

      .addCase(updateUserAccess.fulfilled, (state, action) => {
        const user = action.payload;
        if (!user || !user._id) return;
        const idx = state.list.findIndex((u) => u._id === user._id);
        if (idx !== -1) state.list[idx] = user;
        else state.list.unshift(user);
      })
      .addCase(updateUserAccess.rejected, (state, action) => {
        state.error = action.payload || "Failed to update user";
      })

      .addCase(deleteUser.fulfilled, (state, action) => {
        state.list = state.list.filter(u => u._id !== action.payload);
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.error = action.payload || "Failed to delete user";
      });
  },
});

export default userSlice.reducer;
