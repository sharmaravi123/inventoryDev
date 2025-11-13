"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/pagination";
import { Pagination } from "swiper/modules";
import { useDispatch, useSelector } from "react-redux";
import { adminLogin, userLogin } from "@/store/authSlice";
import { AppDispatch, RootState } from "@/store/store";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAdmin, setIsAdmin] = useState(true);
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((s: RootState) => s.auth);

  const handleLogin = async () => {
    if (!email || !password) return;

    const result = isAdmin
      ? await dispatch(adminLogin({ email, password }))
      : await dispatch(userLogin({ email, password }));

    if ((result as { error?: unknown }).error) return;

    // full navigation so middleware sees HttpOnly cookie set by server
    if (isAdmin) window.location.href = "/admin";
    else window.location.href = "/warehouse";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-neutral)] py-10">
      <div className="w-full max-w-6xl bg-white shadow-xl rounded-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
        {/* Left - Visual */}
        <div className="hidden md:block bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-sidebar)] p-8 relative">
          <div className="h-full flex flex-col justify-center items-start text-white">
            <h2 className="text-3xl font-extrabold mb-2">Aakash Inventory</h2>
            <p className="mb-6 text-sm max-w-xs">
              Manage warehouses, users and inventory seamlessly. Fast, reliable and secure.
            </p>

            <div className="w-full max-w-xs">
              <Swiper modules={[Pagination]} pagination={{ clickable: true }} loop>
                <SwiperSlide>
                  <div className="p-4">
                    <img src="/login/login.png" alt="Inventory" className="w-full rounded-lg shadow-sm" />
                  </div>
                </SwiperSlide>
                {/* Add more slides if you want */}
              </Swiper>
            </div>
          </div>

          <footer className="absolute bottom-4 left-8 text-xs text-white/90">© {new Date().getFullYear()} Aakash Inventory</footer>
        </div>

        {/* Right - Form */}
        <div className="p-8 md:p-12">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="max-w-md mx-auto"
          >
            <h1 className="text-2xl font-extrabold text-[var(--color-primary)] text-center mb-6">
              Welcome to <span className="text-[var(--color-sidebar)]">Aakash Inventory</span>
            </h1>

            <div className="flex justify-center gap-3 mb-6">
              <button
                onClick={() => setIsAdmin(true)}
                className={`px-4 py-2 rounded-full font-semibold text-sm transition ${isAdmin ? "bg-[var(--color-primary)] text-white shadow" : "bg-gray-100 text-[var(--text-secondary)]"}`}
              >
                Admin
              </button>
              <button
                onClick={() => setIsAdmin(false)}
                className={`px-4 py-2 rounded-full font-semibold text-sm transition ${!isAdmin ? "bg-[var(--color-primary)] text-white shadow" : "bg-gray-100 text-[var(--text-secondary)]"}`}
              >
                User
              </button>
            </div>

            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-4 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              placeholder="you@example.com"
              type="email"
              autoComplete="email"
            />

            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-4 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              placeholder="••••••••"
              type="password"
              autoComplete="current-password"
            />

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-[var(--color-primary)] text-white py-2 rounded-lg font-semibold hover:brightness-95 transition mb-3"
            >
              {loading ? "Logging in..." : "Login"}
            </button>

            {error && <p className="text-red-500 text-sm text-center mt-2">{error}</p>}

            <div className="mt-6 text-center text-xs text-[var(--text-secondary)]">
              By logging in you agree to our <span className="underline">Terms</span> and <span className="underline">Privacy</span>.
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
