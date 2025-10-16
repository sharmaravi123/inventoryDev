// src/app/components/ProtectedRoute.tsx
'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';

interface ProtectedRouteProps {
  children: ReactNode;
  role?: 'admin' | 'warehouse';
}

export default function ProtectedRoute({ children, role }: ProtectedRouteProps) {
  const { token, role: userRole } = useSelector((state: RootState) => state.auth);
  const router = useRouter();

  useEffect(() => {
    if (!token || (role && userRole !== role)) {
      router.replace('/'); // redirect if not logged in or role mismatch
    }
  }, [token, userRole, role, router]);

  if (!token || (role && userRole !== role)) return null; // don't render until check completes

  return <>{children}</>;
}
