'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import AuthLoading from './AuthLoading';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children, fallback }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/signin');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return fallback || <AuthLoading message="正在验证认证状态..." />;
  }

  if (!isAuthenticated) {
    return fallback || <AuthLoading message="正在跳转到登录页面..." />;
  }

  return <>{children}</>;
};

export default AuthGuard;