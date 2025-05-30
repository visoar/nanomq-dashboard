'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNanoMQ } from '@/context/NanoMQContext';
import { useRouter } from 'next/navigation';
import {
  Activity,
  Cpu,
  MemoryStick,
  Network,
  Users,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Pause,
  Play,
  RefreshCw,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
} from 'lucide-react';

interface MetricData {
  timestamp: number;
  value: number;
}

interface SystemMetrics {
  cpu_usage: number;
  memory_usage: number;
  memory_total: number;
  connections_count: number;
  subscriptions_count: number;
  messages_received: number;
  messages_sent: number;
  bytes_received: number;
  bytes_sent: number;
  uptime: number;
}

const MonitorPage: React.FC = () => {
  const { isAuthenticated, isLoading: authLoading, config } = useAuth();
  const { connectionStatus } = useNanoMQ();
  const router = useRouter();
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000); // 5秒
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // 历史数据存储 (最近50个数据点)
  const [cpuHistory, setCpuHistory] = useState<MetricData[]>([]);
  const [memoryHistory, setMemoryHistory] = useState<MetricData[]>([]);
  const [connectionsHistory, setConnectionsHistory] = useState<MetricData[]>([]);
  const [messagesHistory, setMessagesHistory] = useState<MetricData[]>([]);

  // 认证检查
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/signin');
    }
  }, [isAuthenticated, authLoading, router]);

  // 获取系统指标
  const fetchMetrics = useCallback(async () => {
    if (!isAuthenticated) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // 添加认证信息
      if (config) {
        headers['x-nanomq-auth'] = JSON.stringify(config);
      }
      
      const response = await fetch('/api/nanomq/metrics', {
        method: 'GET',
        headers,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data: SystemMetrics = await response.json();
      setMetrics(data);
      
      // 更新历史数据
      const timestamp = Date.now();
      const maxDataPoints = 50;
      
      setCpuHistory(prev => {
        const newData = [...prev, { timestamp, value: data.cpu_usage }];
        return newData.slice(-maxDataPoints);
      });
      
      setMemoryHistory(prev => {
        const memoryPercent = (data.memory_usage / data.memory_total) * 100;
        const newData = [...prev, { timestamp, value: memoryPercent }];
        return newData.slice(-maxDataPoints);
      });
      
      setConnectionsHistory(prev => {
        const newData = [...prev, { timestamp, value: data.connections_count }];
        return newData.slice(-maxDataPoints);
      });
      
      setMessagesHistory(prev => {
        const totalMessages = data.messages_received + data.messages_sent;
        const newData = [...prev, { timestamp, value: totalMessages }];
        return newData.slice(-maxDataPoints);
      });
      
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
      setError(error instanceof Error ? error.message : '获取系统指标失败');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, config]);

  // 启动/停止监控
  useEffect(() => {
    if (isMonitoring && isAuthenticated) {
      // 立即获取一次数据
      fetchMetrics();
      
      // 设置定时器
      intervalRef.current = setInterval(fetchMetrics, refreshInterval);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isMonitoring, refreshInterval, isAuthenticated, fetchMetrics]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return `${days}天 ${hours}小时 ${minutes}分钟`;
    } else if (hours > 0) {
      return `${hours}小时 ${minutes}分钟`;
    } else {
      return `${minutes}分钟`;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'text-green-600 dark:text-green-400';
      case 'connecting':
        return 'text-yellow-600 dark:text-yellow-400';
      default:
        return 'text-red-600 dark:text-red-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-5 h-5" />;
      case 'connecting':
        return <Loader2 className="w-5 h-5 animate-spin" />;
      default:
        return <AlertTriangle className="w-5 h-5" />;
    }
  };

  const SimpleChart: React.FC<{ data: MetricData[]; color: string; unit?: string }> = ({ 
    data, color, unit = '' 
  }) => {
    if (data.length === 0) {
      return (
        <div className="h-24 flex items-center justify-center text-gray-400 text-sm">
          暂无数据
        </div>
      );
    }

    const maxValue = Math.max(...data.map(d => d.value));
    const minValue = Math.min(...data.map(d => d.value));
    const range = maxValue - minValue || 1;

    return (
      <div className="h-24 relative">
        <svg className="w-full h-full">
          <polyline
            fill="none"
            stroke={color}
            strokeWidth="2"
            points={data.map((point, index) => {
              const x = (index / (data.length - 1)) * 100;
              const y = 100 - ((point.value - minValue) / range) * 100;
              return `${x},${y}`;
            }).join(' ')}
          />
        </svg>
        <div className="absolute top-0 right-0 text-xs text-gray-500 dark:text-gray-400">
          {data[data.length - 1]?.value.toFixed(1)}{unit}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">实时监控</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            实时监控 NanoMQ 系统状态和性能指标
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {/* 刷新间隔选择 */}
          <select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value={1000}>1秒</option>
            <option value={5000}>5秒</option>
            <option value={10000}>10秒</option>
            <option value={30000}>30秒</option>
          </select>
          
          {/* 监控控制按钮 */}
          <button
            onClick={() => setIsMonitoring(!isMonitoring)}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
              isMonitoring
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {isMonitoring ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                暂停
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                开始
              </>
            )}
          </button>
          
          {/* 手动刷新按钮 */}
          <button
            onClick={fetchMetrics}
            disabled={isLoading}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            刷新
          </button>
        </div>
      </div>

      {/* 连接状态 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`${getStatusColor(connectionStatus)}`}>
              {getStatusIcon(connectionStatus)}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                连接状态
              </h3>
              <p className={`text-sm ${getStatusColor(connectionStatus)}`}>
                {connectionStatus === 'connected' ? '已连接' : 
                 connectionStatus === 'connecting' ? '连接中' : '连接失败'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              最后更新: {new Date().toLocaleTimeString()}
            </p>
            {isMonitoring && (
              <p className="text-xs text-gray-400 dark:text-gray-500">
                自动刷新: {refreshInterval / 1000}秒
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" />
            <p className="text-red-700 dark:text-red-400">{error}</p>
          </div>
        </div>
      )}

      {/* 系统指标卡片 */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* CPU 使用率 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <Cpu className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">CPU 使用率</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {metrics.cpu_usage.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
            <SimpleChart data={cpuHistory} color="#3B82F6" unit="%" />
          </div>

          {/* 内存使用率 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <MemoryStick className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">内存使用</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatBytes(metrics.memory_usage)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    / {formatBytes(metrics.memory_total)}
                  </p>
                </div>
              </div>
            </div>
            <SimpleChart data={memoryHistory} color="#10B981" unit="%" />
          </div>

          {/* 连接数 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">活跃连接</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {metrics.connections_count}
                  </p>
                </div>
              </div>
            </div>
            <SimpleChart data={connectionsHistory} color="#8B5CF6" />
          </div>

          {/* 消息统计 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                  <MessageSquare className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">总消息数</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {(metrics.messages_received + metrics.messages_sent).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
            <SimpleChart data={messagesHistory} color="#F59E0B" />
          </div>
        </div>
      )}

      {/* 详细统计 */}
      {metrics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 消息流量统计 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Network className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
              消息流量统计
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center">
                  <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400 mr-2" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">接收消息</span>
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {metrics.messages_received.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center">
                  <TrendingDown className="w-4 h-4 text-blue-600 dark:text-blue-400 mr-2" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">发送消息</span>
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {metrics.messages_sent.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center">
                  <Database className="w-4 h-4 text-purple-600 dark:text-purple-400 mr-2" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">接收字节</span>
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {formatBytes(metrics.bytes_received)}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center">
                  <Database className="w-4 h-4 text-orange-600 dark:text-orange-400 mr-2" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">发送字节</span>
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {formatBytes(metrics.bytes_sent)}
                </span>
              </div>
            </div>
          </div>

          {/* 系统信息 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
              系统信息
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center">
                  <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400 mr-2" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">运行时间</span>
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {formatUptime(metrics.uptime)}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center">
                  <Users className="w-4 h-4 text-purple-600 dark:text-purple-400 mr-2" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">活跃订阅</span>
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {metrics.subscriptions_count.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center">
                  <MemoryStick className="w-4 h-4 text-green-600 dark:text-green-400 mr-2" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">内存使用率</span>
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {((metrics.memory_usage / metrics.memory_total) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center">
                  <Cpu className="w-4 h-4 text-red-600 dark:text-red-400 mr-2" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">CPU 负载</span>
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {metrics.cpu_usage.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonitorPage;