import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

export interface User {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "user";
  warehouse?: string | null;
  access: { level: "all" | "limited"; permissions: string[] };
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

// 🟢 Fetch users
export const fetchUsers = createAsyncThunk<User[], void, { rejectValue: string }>(
  "user/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/user/list", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data.users as User[];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || "Failed to fetch users");
    }
  }
);

// 🟢 Create user
export const createUser = createAsyncThunk<
  User,
  {
    name: string;
    email: string;
    password: string;
    warehouseId?: string | null;
    access: { level: "all" | "limited"; permissions: string[] };
  },
  { rejectValue: string }
>("user/create", async (payload, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem("token");
    const res = await axios.post("/api/user/create", payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data.user as User;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.error || "Failed to create user");
  }
});

// 🟡 Update user access
export const updateUserAccess = createAsyncThunk<
  User,
  { userId: string; access: { level: string; permissions: string[] } },
  { rejectValue: string }
>("user/updateAccess", async (payload, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem("token");
    const res = await axios.patch("/api/user/update-access", payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data.user as User;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.error || "Failed to update access");
  }
});

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Error loading users";
      })
      // Create
      .addCase(createUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.loading = false;
        state.list.unshift(action.payload);
      })
      .addCase(createUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Error creating user";
      })
      // Update Access
      .addCase(updateUserAccess.fulfilled, (state, action) => {
        const idx = state.list.findIndex((u) => u._id === action.payload._id);
        if (idx !== -1) state.list[idx] = action.payload;
      });
  },
});

export default userSlice.reducer;
