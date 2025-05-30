'use client';

import React, { useState, useMemo } from 'react';
import { useNanoMQ } from '@/context/NanoMQContext';
import {
  BarChart3,
  TrendingUp,
  Activity,
  RefreshCw,
  Clock,
  Database,
  Cpu,
  MemoryStick,
  Network,
  MessageSquare,
  Users,
  Zap,
  HardDrive,
} from 'lucide-react';

const StatisticsPage: React.FC = () => {
  const { metrics, nodeInfo, isLoading, refreshMetrics } = useNanoMQ();
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d'>('1h');

  // 计算统计数据
  const stats = useMemo(() => {
    if (!metrics) return null;

    return {
      // 消息统计
      messages: {
        received: Number(metrics.messages_received) || 0,
        sent: Number(metrics.messages_sent) || 0,
        dropped: Number(metrics.messages_dropped) || 0,
        retained: Number(metrics.messages_retained) || 0,
      },
      // 连接统计
      connections: {
        current: Number(metrics.connections_count) || 0,
        max: Number(metrics.connections_max) || 0,
      },
      // 订阅统计
      subscriptions: {
        current: Number(metrics.subscriptions_count) || 0,
        max: Number(metrics.subscriptions_max) || 0,
      },
      // 字节统计
      bytes: {
        received: Number(metrics.bytes_received) || 0,
        sent: Number(metrics.bytes_sent) || 0,
      },
      // 系统统计
      system: {
        uptime: metrics.uptime || nodeInfo?.uptime || 0,
        version: nodeInfo?.version || 'Unknown',
      },
    };
  }, [metrics, nodeInfo]);

  const handleRefresh = async () => {
    await refreshMetrics();
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (uptime: string | number | undefined) => {
    // 处理不同格式的运行时间数据
    let seconds = 0;
    
    if (typeof uptime === 'number') {
      seconds = uptime;
    } else if (typeof uptime === 'string') {
      // 尝试解析字符串格式的运行时间
      const parsed = parseInt(uptime);
      if (!isNaN(parsed)) {
        seconds = parsed;
      }
    }
    
    // 如果仍然无效，返回默认值
    if (isNaN(seconds) || seconds < 0) {
      return '数据不可用';
    }
    
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

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">加载统计数据中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">统计分析</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            查看 NanoMQ 的详细性能指标和统计数据
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {/* 时间范围选择器 */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as '1h' | '6h' | '24h' | '7d')}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="1h">最近 1 小时</option>
            <option value="6h">最近 6 小时</option>
            <option value="24h">最近 24 小时</option>
            <option value="7d">最近 7 天</option>
          </select>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            刷新
          </button>
        </div>
      </div>

      {/* 核心指标卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* 消息接收 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">消息接收</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {formatNumber(stats.messages.received)}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                <TrendingUp className="w-3 h-3 inline mr-1" />
                总计
              </p>
            </div>
            <div className="p-3 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
              <MessageSquare className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* 消息发送 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">消息发送</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {formatNumber(stats.messages.sent)}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                <TrendingUp className="w-3 h-3 inline mr-1" />
                总计
              </p>
            </div>
            <div className="p-3 rounded-lg bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400">
              <Zap className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* 当前连接 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">当前连接</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {formatNumber(stats.connections.current)}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                最大: {formatNumber(stats.connections.max)}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* 运行时间 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">运行时间</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                {formatUptime(stats.system.uptime)}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                版本: {stats.system.version}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* 详细统计 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 消息统计 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <MessageSquare className="w-5 h-5 mr-2" />
            消息统计
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">接收消息</span>
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {formatNumber(stats.messages.received)}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">发送消息</span>
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {formatNumber(stats.messages.sent)}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">丢弃消息</span>
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {formatNumber(stats.messages.dropped)}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">保留消息</span>
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {formatNumber(stats.messages.retained)}
              </span>
            </div>
          </div>
        </div>

        {/* 网络统计 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Network className="w-5 h-5 mr-2" />
            网络统计
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">接收字节</span>
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {formatBytes(stats.bytes.received)}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">发送字节</span>
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {formatBytes(stats.bytes.sent)}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">当前连接</span>
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {formatNumber(stats.connections.current)}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-orange-500 rounded-full mr-3"></div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">活跃订阅</span>
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {formatNumber(stats.subscriptions.current)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 性能指标 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <BarChart3 className="w-5 h-5 mr-2" />
          性能指标
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 消息吞吐量 */}
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <Activity className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">消息吞吐量</h4>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-2">
              {formatNumber(stats.messages.received + stats.messages.sent)}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">总消息数</p>
          </div>

          {/* 连接效率 */}
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">连接效率</h4>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-2">
              {stats.connections.max > 0 
                ? Math.round((stats.connections.current / stats.connections.max) * 100)
                : 0}%
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">连接利用率</p>
          </div>

          {/* 数据传输 */}
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <HardDrive className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">数据传输</h4>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-2">
              {formatBytes(stats.bytes.received + stats.bytes.sent)}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">总传输量</p>
          </div>
        </div>
      </div>

      {/* 系统信息 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Database className="w-5 h-5 mr-2" />
          系统信息
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <Clock className="w-4 h-4 text-gray-600 dark:text-gray-400 mr-2" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">运行时间</span>
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {formatUptime(stats.system.uptime)}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <Cpu className="w-4 h-4 text-gray-600 dark:text-gray-400 mr-2" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">版本</span>
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {stats.system.version}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <MemoryStick className="w-4 h-4 text-gray-600 dark:text-gray-400 mr-2" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">最大连接</span>
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {formatNumber(stats.connections.max)}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <Activity className="w-4 h-4 text-gray-600 dark:text-gray-400 mr-2" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">最大订阅</span>
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {formatNumber(stats.subscriptions.max)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatisticsPage;