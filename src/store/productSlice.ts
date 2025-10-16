import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

export interface ProductType {
  id: number;
  name: string;
  sku: string;
  categoryId: number;
  category: { id: number; name: string };
  purchasePrice: number;
  sellingPrice: number;
  description?: string;
}

interface ProductState {
  products: ProductType[];
  loading: boolean;
  error: string | null;
}

const initialState: ProductState = { products: [], loading: false, error: null };

// Helper
const getToken = () => localStorage.getItem("token");

// Async thunks
export const fetchProducts = createAsyncThunk("product/fetchProducts", async (_, { rejectWithValue }) => {
  const token = getToken();
  try {
    const res = await fetch("/api/products", { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to fetch products");
    return data as ProductType[];
  } catch (err: any) {
    return rejectWithValue(err.message);
  }
});

export const addProduct = createAsyncThunk(
  "product/addProduct",
  async (payload: Partial<ProductType>, { rejectWithValue }) => {
    const token = getToken();
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add product");
      return data as ProductType;
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

export const updateProduct = createAsyncThunk(
  "product/updateProduct",
  async ({ id, ...payload }: Partial<ProductType> & { id: number }, { rejectWithValue }) => {
    const token = getToken();
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update product");
      return data as ProductType;
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

export const deleteProduct = createAsyncThunk("product/deleteProduct", async (id: number, { rejectWithValue }) => {
  const token = getToken();
  try {
    const res = await fetch(`/api/products/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to delete product");
    return id;
  } catch (err: any) {
    return rejectWithValue(err.message);
  }
});

// Slice
export const productSlice = createSlice({
  name: "product",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchProducts.fulfilled, (state, action: PayloadAction<ProductType[]>) => { state.loading = false; state.products = action.payload; })
      .addCase(fetchProducts.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(addProduct.fulfilled, (state, action: PayloadAction<ProductType>) => { state.products.unshift(action.payload); })
      .addCase(updateProduct.fulfilled, (state, action: PayloadAction<ProductType>) => { state.products = state.products.map(p => p.id === action.payload.id ? action.payload : p); })
      .addCase(deleteProduct.fulfilled, (state, action: PayloadAction<number>) => { state.products = state.products.filter(p => p.id !== action.payload); });
  },
});

export default productSlice.reducer;
