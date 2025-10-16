// src/app/components/login/Login.tsx
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/pagination';
import { Pagination } from 'swiper/modules';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { adminLogin, warehouseLogin } from '@/store/authSlice';
import { AppDispatch, RootState } from '@/store/store';

export default function LoginPage() {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(true);
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  // typed selector
  const { loading, error } = useSelector((state: RootState) => state.auth);

  const handleLogin = async () => {
    if (!emailOrUsername || !password) return;

    // dispatch returns a payload shaped by createAsyncThunk
    const result = isAdmin
      ? await dispatch(adminLogin({ email: emailOrUsername, password }))
      : await dispatch(warehouseLogin({ username: emailOrUsername, password }));

    // safe access: result.payload may be undefined on reject
    if (result.payload && typeof result.payload === 'object' && 'token' in result.payload && 'role' in result.payload) {
      router.push(result.payload.role === 'admin' ? '/admin' : '/warehouse');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-neutral)]">
      <div className="w-full max-w-7xl flex flex-col md:flex-row bg-[var(--color-white)] rounded-2xl shadow-[var(--shadow-medium)] overflow-hidden">


        {/* Left Section */}
        <div className="md:w-1/2 w-full relative flex items-center justify-center bg-[var(--color-neutral)] p-6">
          <Swiper modules={[Pagination]} pagination={{ clickable: true }} loop className="w-full h-full max-w-xl">
            <SwiperSlide>
              <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="relative text-center">
                <img src="/login/login.png" alt="Inventory Management Illustration" className="mx-auto w-full max-w-md drop-shadow-xl opacity-90" />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
                  <h2 className="text-3xl md:text-4xl font-extrabold text-[var(--color-sidebar)] drop-shadow-md">
                    Efficient Inventory Management at Your Fingertips
                  </h2>
                  <p className="text-[var(--text-secondary)] mt-3 text-base md:text-lg max-w-lg">
                    Streamline your operations, optimize stock, and <br />
                    enhance billing with <span className="font-semibold text-[var(--color-primary)]">Aakash Inventory</span>.
                  </p>
                </div>
              </motion.div>
            </SwiperSlide>
          </Swiper>
          <footer className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-xs text-[var(--text-muted)]">
            © 2025 Aakash Inventory. All rights reserved.
          </footer>
        </div>

        {/* Right Section - Login Form */}

        <div className="md:w-1/2 w-full flex items-center justify-center bg-[var(--color-white)] p-8 md:p-12">

          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="w-full max-w-md bg-[var(--color-neutral)] rounded-2xl shadow-[var(--shadow-light)] p-8">
            <h1 className="text-3xl font-extrabold text-center text-[var(--color-primary)] mb-6">Aakash <span className="text-[var(--color-sidebar)]">Inventory</span></h1>
            <h2 className="text-xl font-bold text-center mb-4 text-[var(--color-sidebar)]">Login to Inventory</h2>
            <p className="text-center text-[var(--text-secondary)] mb-8 text-sm">Welcome back! Enter your credentials to continue.</p>
            <div className="flex justify-center gap-4 mb-4">
              <button
                className={`px-3 py-1 rounded-md font-semibold ${isAdmin ? "bg-[var(--color-primary)] text-white" : "bg-gray-200"}`}
                onClick={() => setIsAdmin(true)}
              >
                Admin
              </button>
              <button
                className={`px-3 py-1 rounded-md font-semibold ${!isAdmin ? "bg-[var(--color-primary)] text-white" : "bg-gray-200"}`}
                onClick={() => setIsAdmin(false)}
              >
                Warehouse
              </button>
            </div>


            <div className="space-y-5">
              <label htmlFor="email" className="block text-sm font-semibold text-[var(--color-sidebar)] mb-2">{isAdmin ? 'Email Address' : 'Username'}</label>
              <input id="email" type={isAdmin ? 'email' : 'text'} placeholder={isAdmin ? 'your.email@aakash.com' : 'username'} value={emailOrUsername} onChange={(e) => setEmailOrUsername(e.target.value)} className="w-full border border-[var(--border-color)] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-[var(--color-sidebar)] mb-2">Password</label>
              <input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border border-[var(--border-color)] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" />
            </div>

            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} className="mt-4 w-full bg-[var(--color-primary)] text-[var(--color-white)] font-semibold py-2 rounded-lg shadow-md hover:bg-[var(--color-success)] transition-all" onClick={handleLogin} disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </motion.button>

            {error && <p className="text-red-500 text-center mt-2">{error}</p>}

            <div className="text-center mt-4">
              <a href="#" className="text-sm text-[var(--color-primary)] hover:underline hover:text-[var(--color-sidebar)]">Forgot Password?</a>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
