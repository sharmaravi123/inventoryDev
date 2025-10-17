"use client";

import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  fetchCategories,
  addCategory,
  updateCategory,
  deleteCategory,
} from "@/store/categorySlice";

import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";
import "swiper/css";
import "swiper/css/navigation";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import { AppDispatch, RootState } from "@/store/store";

export default function Category() {
  const dispatch = useDispatch<AppDispatch>();
  const { categories, loading } = useSelector((state: RootState) => state.category);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editId, setEditId] = useState<number | null>(null);

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  const handleSubmit = async () => {
    console.log("Token:", localStorage.getItem("token"));

    console.log('first')
    if (!name.trim()) return Swal.fire("Error", "Name is required", "error");

    try {
      if (editId) {
        await dispatch(updateCategory({ id: editId, name, description })).unwrap();
        Swal.fire("Success", "Category updated", "success");
        setEditId(null);
      } else {
        await dispatch(addCategory({ name, description })).unwrap();
        Swal.fire("Success", "Category added", "success");
      }
      setName("");
      setDescription("");
    } catch (err: any) {
        console.log("err",err)
      Swal.fire("Error", err.message, "error");
    }
  };

  const handleEdit = (cat: { id: number; name: string; description?: string | null }) => {
    try {
      
      setEditId(cat.id);
      setName(cat.name);
      setDescription(cat.description ?? "");
    } catch (error) {
      console.log(error)
    }
  };

  const handleDelete = (id: number) => {
    Swal.fire({
      title: "Are you sure?",
      text: "This will delete the category",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "var(--color-primary)",
      cancelButtonColor: "var(--color-error)",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        await dispatch(deleteCategory(id)).unwrap();
        Swal.fire("Deleted!", "Category deleted.", "success");
      }
    });
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6" style={{ color: "var(--color-primary)" }}>
        Category Management
      </h1>

      {/* Add/Edit Form */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 bg-white p-6 rounded-md shadow-md"
        style={{ backgroundColor: "var(--color-white)" }}
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Category Name"
          className="mb-3 w-full border rounded px-3 py-2"
          style={{ borderColor: "var(--color-primary)" }}
        />
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
          className="mb-3 w-full border rounded px-3 py-2"
          style={{ borderColor: "var(--color-primary)" }}
        />
        <button
          onClick={handleSubmit}
          className="px-4 py-2 rounded hover:opacity-90 transition-all"
          style={{
            backgroundColor: "var(--color-primary)",
            color: "var(--color-white)",
          }}
        >
          {editId ? "Update Category" : "Add Category"}
        </button>
      </motion.div>

      {/* Category List */}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <Swiper
          modules={[Navigation]}
          spaceBetween={20}
          slidesPerView={1}
          navigation
          breakpoints={{
            640: { slidesPerView: 1 },
            768: { slidesPerView: 2 },
            1024: { slidesPerView: 3 },
          }}
        >
          <AnimatePresence>
            {categories.map((cat) => (
              <SwiperSlide key={cat.id}>
                <motion.div
                  layout
                  whileHover={{ scale: 1.03 }}
                  className="rounded-md p-5 flex flex-col justify-between h-full shadow-md"
                  style={{ backgroundColor: "var(--color-white)" }}
                >
                  <div>
                    <h2 className="text-xl font-semibold mb-2" style={{ color: "var(--color-primary)" }}>
                      {cat.name}
                    </h2>
                    <p className="text-gray-600">{cat.description}</p>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => handleEdit(cat)}
                      className="px-3 py-1 rounded transition"
                      style={{
                        backgroundColor: "var(--color-secondary)",
                        color: "var(--color-white)",
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id)}
                      className="px-3 py-1 rounded transition"
                      style={{
                        backgroundColor: "var(--color-error)",
                        color: "var(--color-white)",
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </motion.div>
              </SwiperSlide>
            ))}
          </AnimatePresence>
        </Swiper>
      )}
    </div>
  );
}
