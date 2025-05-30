'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Eye, EyeOff, Wifi, AlertCircle, CheckCircle, Loader2, Server, User, Lock } from 'lucide-react';
import AuthLoading from '@/components/auth/AuthLoading';

interface FormData {
  baseURL: string;
  username: string;
  password: string;
}

const SignInPage: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    baseURL: '',
    username: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isFormReady, setIsFormReady] = useState(false);
  
  const { login, isAuthenticated, isLoading, error } = useAuth();
  const router = useRouter();

  // 从环境变量预填充表单
  useEffect(() => {
    const initializeForm = () => {
      setFormData({
        baseURL: process.env.NEXT_PUBLIC_NANOMQ_API_URL || 'http://localhost:8081',
        username: process.env.NEXT_PUBLIC_NANOMQ_USERNAME || 'admin',
        password: process.env.NEXT_PUBLIC_NANOMQ_PASSWORD || 'public',
      });
      setIsFormReady(true);
    };
    
    // 添加小延迟确保环境变量加载完成
    const timer = setTimeout(initializeForm, 100);
    return () => clearTimeout(timer);
  }, []);

  // 如果已认证，重定向到仪表盘
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // 清除验证错误
    if (validationError) {
      setValidationError(null);
    }
  };

  const validateForm = (): boolean => {
    if (!formData.baseURL.trim()) {
      setValidationError('请输入服务器地址');
      return false;
    }
    if (!formData.username.trim()) {
      setValidationError('请输入用户名');
      return false;
    }
    if (!formData.password.trim()) {
      setValidationError('请输入密码');
      return false;
    }
    
    // 验证URL格式
    try {
      const url = new URL(formData.baseURL);
      if (!['http:', 'https:'].includes(url.protocol)) {
        setValidationError('服务器地址必须以 http:// 或 https:// 开头');
        return false;
      }
    } catch {
      setValidationError('请输入有效的服务器地址（如：http://localhost:8081）');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setValidationError(null);
    
    try {
      const success = await login(
        formData.username,
        formData.password,
        formData.baseURL
      );
      
      if (success) {
        // 登录成功，AuthContext 会处理重定向
        return;
      }
    } catch (error) {
      console.error('Login error:', error);
      setValidationError('登录过程中发生错误，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 显示初始加载状态
  if (isLoading || !isFormReady) {
    return <AuthLoading message="正在初始化登录页面..." />;
  }

  // 如果已认证，显示跳转加载状态
  if (isAuthenticated) {
    return <AuthLoading message="登录成功，正在跳转..." />;
  }

  return (
    <div className="min-h-screen flex w-full">
      {/* 左侧 - 登录表单 */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-blue-600 p-3 rounded-lg">
                <Wifi className="h-8 w-8 text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              NanoMQ Dashboard
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              连接到您的 NanoMQ MQTT 代理
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* 服务器地址 */}
            <div>
              <label htmlFor="baseURL" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <div className="flex items-center space-x-2">
                  <Server className="h-4 w-4" />
                  <span>服务器地址</span>
                </div>
              </label>
              <div className="relative">
                <input
                  id="baseURL"
                  name="baseURL"
                  type="url"
                  required
                  value={formData.baseURL}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  className="appearance-none block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="http://localhost:8081"
                />
              </div>
            </div>

            {/* 用户名 */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>用户名</span>
                </div>
              </label>
              <div className="relative">
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  className="appearance-none block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="admin"
                />
              </div>
            </div>

            {/* 密码 */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <div className="flex items-center space-x-2">
                  <Lock className="h-4 w-4" />
                  <span>密码</span>
                </div>
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  className="appearance-none block w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="public"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isSubmitting}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* 错误信息 */}
            {(validationError || error) && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                      登录失败
                    </h3>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      {validationError || error}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 提交按钮 */}
            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed dark:focus:ring-offset-gray-900 transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    正在连接...
                  </>
                ) : (
                  <>
                    <Wifi className="h-4 w-4 mr-2" />
                    连接到 NanoMQ
                  </>
                )}
              </button>
            </div>
          </form>

          {/* 帮助信息 */}
          <div className="mt-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    连接提示
                  </h3>
                  <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                    <ul className="list-disc list-inside space-y-1">
                      <li>确保 NanoMQ 服务器正在运行</li>
                      <li>默认 HTTP API 端口为 8081</li>
                      <li>默认用户名/密码为 admin/public</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignInPage;
