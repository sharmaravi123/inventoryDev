"use client";

import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store/store";
import { fetchProducts } from "@/store/productSlice";
import { fetchCategories } from "@/store/categorySlice";
import ProductTable from "../components/product/ProductTable";

export default function InventoryPage() {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchCategories());
  }, [dispatch]);

  return (
    <main className="min-h-screen p-8 bg-neutral">
      <div className="max-w-6xl mx-auto">
          <ProductTable />
      </div>
    </main>
  );
}
