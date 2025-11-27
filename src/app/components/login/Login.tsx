"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/pagination";
import { Pagination } from "swiper/modules";
import { useDispatch } from "react-redux";
import { adminLogin, userLogin } from "@/store/authSlice";
import { loginDriver } from "@/store/driverSlice";
import { AppDispatch } from "@/store/store";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const dispatch = useDispatch<AppDispatch>();

  const handleLogin = async () => {
    if (!email || !password || submitting) {
      return;
    }

    setSubmitting(true);
    setLocalError(null);

    try {
      // 1) Admin login
      try {
        await dispatch(adminLogin({ email, password })).unwrap();
        window.location.href = "/admin";
        return;
      } catch (_) {
        // ignore and try next role
      }

      // 2) Warehouse user login
      try {
        await dispatch(userLogin({ email, password })).unwrap();
        window.location.href = "/warehouse";
        return;
      } catch (_) {
        // ignore and try next role
      }

      // 3) Driver login
      try {
        await dispatch(loginDriver({ email, password })).unwrap();
        window.location.href = "/driver";
        return;
      } catch (_) {
        // all roles failed
      }

      setLocalError("Invalid credentials");
    } catch (err: unknown) {
      setLocalError("Unable to login. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-neutral)] py-10">
      <div className="w-full max-w-6xl bg-white shadow-xl rounded-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
        {/* Left - Visual */}
        <div className="hidden md:block bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-sidebar)] p-8 relative">
          <div className="h-full flex flex-col justify-center items-start text-white">
            <h2 className="text-3xl font-extrabold mb-2">Aakash Inventory</h2>
            <p className="mb-6 text-sm max-w-xs">
              Manage warehouses, users, drivers and inventory seamlessly. Fast, reliable and secure.
            </p>

            <div className="w-full max-w-xs">
              <Swiper modules={[Pagination]} pagination={{ clickable: true }} loop>
                <SwiperSlide>
                  <div className="p-4">
                    <img
                      src="/login/login.png"
                      alt="Inventory"
                      className="w-full rounded-lg shadow-sm"
                    />
                  </div>
                </SwiperSlide>
                {/* More slides add kar sakte ho yaha */}
              </Swiper>
            </div>
          </div>

          <footer className="absolute bottom-4 left-8 text-xs text-white/90">
            © {new Date().getFullYear()} Aakash Inventory
          </footer>
        </div>

        {/* Right - Form */}
        <div className="p-8 md:p-12">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="max-w-md mx-auto"
          >
            <h1 className="text-2xl font-extrabold text-[var(--color-primary)] text-center mb-2">
              Welcome to <span className="text-[var(--color-sidebar)]">Aakash Inventory</span>
            </h1>
            <p className="text-center text-xs text-[var(--text-secondary)] mb-6">
              Use your registered email and password to access your admin, user or driver dashboard.
            </p>

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
              disabled={submitting}
              className="w-full bg-[var(--color-primary)] text-white py-2 rounded-lg font-semibold hover:brightness-95 transition mb-3 disabled:opacity-60"
            >
              {submitting ? "Logging in..." : "Login"}
            </button>

            {localError && (
              <p className="text-red-500 text-sm text-center mt-2">
                {localError}
              </p>
            )}

            <div className="mt-6 text-center text-xs text-[var(--text-secondary)]">
              By logging in you agree to our <span className="underline">Terms</span> and{" "}
              <span className="underline">Privacy</span>.
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
