'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface AuthConfig {
  baseURL: string;
  username: string;
  password: string;
}

interface AuthContextType {
  // 认证状态
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // 配置
  config: AuthConfig;
  
  // 方法
  login: (username: string, password: string, baseURL?: string) => Promise<boolean>;
  logout: () => void;
  updateConfig: (config: AuthConfig) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<AuthConfig>({
    baseURL: process.env.NEXT_PUBLIC_NANOMQ_API_URL || 'http://localhost:8081',
    username: process.env.NEXT_PUBLIC_NANOMQ_USERNAME || 'admin',
    password: process.env.NEXT_PUBLIC_NANOMQ_PASSWORD || 'public',
  });
  
  const router = useRouter();

  // 初始化时检查本地存储的认证信息
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const savedAuth = localStorage.getItem('nanomq-auth');
        const savedConfig = localStorage.getItem('nanomq-config');
        
        if (savedAuth && savedConfig) {
          const authData = JSON.parse(savedAuth);
          const configData = JSON.parse(savedConfig);
          
          if (authData.isAuthenticated && authData.timestamp) {
            // 检查是否在24小时内
            const now = Date.now();
            const authTime = authData.timestamp;
            const hoursDiff = (now - authTime) / (1000 * 60 * 60);
            
            if (hoursDiff < 24) {
              // 验证保存的认证信息是否仍然有效
              try {
                const response = await fetch('/api/nanomq/test-connection', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(configData),
                });
                
                if (response.ok) {
                  setIsAuthenticated(true);
                  setConfig(configData);
                } else {
                  // 认证信息无效，清除存储
                  localStorage.removeItem('nanomq-auth');
                  localStorage.removeItem('nanomq-config');
                }
              } catch {
                // 网络错误，但保留认证状态
                setIsAuthenticated(true);
                setConfig(configData);
              }
            } else {
              // 认证过期，清除存储
              localStorage.removeItem('nanomq-auth');
              localStorage.removeItem('nanomq-config');
            }
          }
        }
      } catch (error) {
        console.error('Failed to check auth:', error);
        localStorage.removeItem('nanomq-auth');
        localStorage.removeItem('nanomq-config');
      } finally {
        setIsLoading(false);
      }
    };

    // 添加小延迟确保组件完全挂载
    const timer = setTimeout(checkAuth, 100);
    return () => clearTimeout(timer);
  }, []);

  const login = async (username: string, password: string, baseURL?: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const apiURL = baseURL || config.baseURL;
      
      // 验证输入参数
      if (!apiURL || !username || !password) {
        setError('请填写完整的连接信息');
        return false;
      }
      
      // 验证URL格式
      try {
        const url = new URL(apiURL);
        if (!['http:', 'https:'].includes(url.protocol)) {
          setError('服务器地址必须以 http:// 或 https:// 开头');
          return false;
        }
      } catch {
        setError('请输入有效的服务器地址');
        return false;
      }
      
      // 测试连接到 NanoMQ API
      const response = await fetch('/api/nanomq/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          baseURL: apiURL,
          username,
          password,
        }),
      });
      
      if (response.ok) {
        const newConfig = {
          baseURL: apiURL,
          username,
          password,
        };
        
        // 保存认证信息
        const authData = {
          isAuthenticated: true,
          timestamp: Date.now(),
        };
        
        localStorage.setItem('nanomq-auth', JSON.stringify(authData));
        localStorage.setItem('nanomq-config', JSON.stringify(newConfig));
        
        setConfig(newConfig);
        setIsAuthenticated(true);
        setError(null);
        
        return true;
      } else {
        let errorMessage = '认证失败';
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          // 无法解析错误响应，使用状态码
          if (response.status === 401) {
            errorMessage = '用户名或密码错误';
          } else if (response.status === 403) {
            errorMessage = '访问被拒绝，请检查权限';
          } else if (response.status === 404) {
            errorMessage = 'NanoMQ API 服务未找到';
          } else if (response.status >= 500) {
            errorMessage = 'NanoMQ 服务器内部错误';
          } else {
            errorMessage = `连接失败 (${response.status})`;
          }
        }
        
        setError(errorMessage);
        return false;
      }
    } catch (error) {
      let errorMessage = '连接失败';
      
      if (error instanceof Error) {
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
          errorMessage = '无法连接到服务器，请检查网络连接和服务器地址';
        } else if (error.message.includes('timeout')) {
          errorMessage = '连接超时，请检查服务器状态';
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('nanomq-auth');
    localStorage.removeItem('nanomq-config');
    setIsAuthenticated(false);
    setConfig({
      baseURL: process.env.NEXT_PUBLIC_NANOMQ_API_URL || 'http://localhost:8081',
      username: process.env.NEXT_PUBLIC_NANOMQ_USERNAME || 'admin',
      password: process.env.NEXT_PUBLIC_NANOMQ_PASSWORD || 'public',
    });
    router.push('/signin');
  };

  const updateConfig = (newConfig: AuthConfig) => {
    setConfig(newConfig);
    localStorage.setItem('nanomq-config', JSON.stringify(newConfig));
  };

  const value: AuthContextType = {
    isAuthenticated,
    isLoading,
    error,
    config,
    login,
    logout,
    updateConfig,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};