'use client';

import React from 'react';
import { Wifi } from 'lucide-react';

interface AuthLoadingProps {
  message?: string;
  showLogo?: boolean;
}

const AuthLoading: React.FC<AuthLoadingProps> = ({ 
  message = '正在验证认证信息...', 
  showLogo = true 
}) => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full mx-auto">
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8">
          <div className="text-center">
            {showLogo && (
              <div className="flex items-center justify-center mb-6">
                <div className="bg-blue-600 p-3 rounded-lg">
                  <Wifi className="h-8 w-8 text-white" />
                </div>
              </div>
            )}
            
            {/* Loading Spinner */}
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 dark:border-gray-700"></div>
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent absolute top-0 left-0"></div>
              </div>
            </div>
            
            {/* Loading Message */}
            <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
              {message}
            </p>
            
            {/* Animated Dots */}
            <div className="flex justify-center mt-3 space-x-1">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLoading;