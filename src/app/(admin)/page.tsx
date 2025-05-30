'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useNanoMQ } from '@/context/NanoMQContext';
import {
  Activity,
  Users,
  MessageSquare,
  Database,
  Cpu,
  HardDrive,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

// 统计卡片组件
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  description?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, description }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    green: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400',
    yellow: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400',
    red: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 min-h-[120px]">
      <div className="flex items-center justify-between h-full">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 truncate">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1 break-words">{value}</p>
          {description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">{description}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg flex-shrink-0 ml-4 ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

// 连接状态组件
const ConnectionStatus: React.FC = () => {
  const { isConnected, isLoading, error, brokerInfo } = useNanoMQ();

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="text-gray-600 dark:text-gray-400">正在连接...</span>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-red-200 dark:border-red-800 p-6">
        <div className="flex items-center space-x-3">
          <AlertCircle className="w-6 h-6 text-red-500" />
          <div>
            <h3 className="text-lg font-semibold text-red-700 dark:text-red-400">连接失败</h3>
            <p className="text-sm text-red-600 dark:text-red-500">
              {error || '无法连接到 NanoMQ 服务器'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-green-200 dark:border-green-800 p-6">
      <div className="flex items-center space-x-3 mb-4">
        <CheckCircle className="w-6 h-6 text-green-500" />
        <div>
          <h3 className="text-lg font-semibold text-green-700 dark:text-green-400">连接正常</h3>
          <p className="text-sm text-green-600 dark:text-green-500">NanoMQ 服务器运行正常</p>
        </div>
      </div>
      
      {brokerInfo && (
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">版本</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{brokerInfo.version}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">运行时间</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{brokerInfo.uptime}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">状态</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{brokerInfo.node_status}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">描述</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{brokerInfo.sysdescr}</p>
          </div>
        </div>
      )}
    </div>
  );
};

// 快速操作组件
const QuickActions: React.FC = () => {
  const router = useRouter();

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">快速操作</h3>
      <div className="grid grid-cols-2 gap-3">
        <button 
          onClick={() => handleNavigation('/publish')}
          className="flex items-center justify-center p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
        >
          <MessageSquare className="w-5 h-5 mr-2" />
          发布消息
        </button>
        <button 
          onClick={() => handleNavigation('/clients')}
          className="flex items-center justify-center p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
        >
          <Users className="w-5 h-5 mr-2" />
          查看客户端
        </button>
        <button 
          onClick={() => handleNavigation('/statistics')}
          className="flex items-center justify-center p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
        >
          <Activity className="w-5 h-5 mr-2" />
          实时监控
        </button>
        <button 
          onClick={() => handleNavigation('/settings')}
          className="flex items-center justify-center p-3 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors"
        >
          <Database className="w-5 h-5 mr-2" />
          系统配置
        </button>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const {
    clients,
    subscriptions,
    metrics,
    nodeInfo,
  } = useNanoMQ();

  // 计算统计数据
  const connectedClients = clients?.filter(client => client.conn_state === 'connected')?.length || 0;
  const totalSubscriptions = subscriptions?.length || 0;
  const memoryUsage = metrics?.memory ? `${(parseInt(metrics.memory) / 1024 / 1024).toFixed(1)} MB` : '0 MB';
  const cpuUsage = metrics?.cpuinfo || '0%';

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">NanoMQ 仪表板</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          实时监控 NanoMQ MQTT Broker 的运行状态和性能指标
        </p>
      </div>

      {/* 连接状态 */}
      <ConnectionStatus />

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="在线客户端"
          value={connectedClients}
          icon={<Users className="w-6 h-6" />}
          color="blue"
          description={`总计 ${clients?.length || 0} 个客户端`}
        />
        <StatCard
          title="活跃订阅"
          value={totalSubscriptions}
          icon={<MessageSquare className="w-6 h-6" />}
          color="green"
          description="当前订阅数量"
        />
        <StatCard
          title="内存使用"
          value={memoryUsage}
          icon={<HardDrive className="w-6 h-6" />}
          color="purple"
          description="当前内存占用"
        />
        <StatCard
          title="CPU 使用率"
          value={cpuUsage}
          icon={<Cpu className="w-6 h-6" />}
          color="yellow"
          description="当前 CPU 占用"
        />
      </div>

      {/* 详细信息和快速操作 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 节点信息 */}
        {nodeInfo && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">节点信息</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">连接数</span>
                <span className="font-medium text-gray-900 dark:text-white">{nodeInfo.connections}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">节点状态</span>
                <span className="font-medium text-gray-900 dark:text-white">{nodeInfo.node_status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">运行时间</span>
                <span className="font-medium text-gray-900 dark:text-white">{nodeInfo.uptime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">版本</span>
                <span className="font-medium text-gray-900 dark:text-white">{nodeInfo.version}</span>
              </div>
            </div>
          </div>
        )}

        {/* 快速操作 */}
        <QuickActions />
      </div>

      {/* 最近客户端 */}
      {clients.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">最近连接的客户端</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 text-gray-600 dark:text-gray-400">客户端 ID</th>
                  <th className="text-left py-2 text-gray-600 dark:text-gray-400">用户名</th>
                  <th className="text-left py-2 text-gray-600 dark:text-gray-400">协议</th>
                  <th className="text-left py-2 text-gray-600 dark:text-gray-400">状态</th>
                  <th className="text-left py-2 text-gray-600 dark:text-gray-400">消息数</th>
                </tr>
              </thead>
              <tbody>
                {clients.slice(0, 5).map((client) => (
                  <tr key={client.client_id} className="border-b border-gray-100 dark:border-gray-700">
                    <td className="py-2 font-medium text-gray-900 dark:text-white">
                      {client.client_id}
                    </td>
                    <td className="py-2 text-gray-600 dark:text-gray-400">
                      {client.username || '-'}
                    </td>
                    <td className="py-2 text-gray-600 dark:text-gray-400">
                      {client.proto_name} v{client.proto_ver}
                    </td>
                    <td className="py-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        client.conn_state === 'connected'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                      }`}>
                        {client.conn_state === 'connected' ? '在线' : '离线'}
                      </span>
                    </td>
                    <td className="py-2 text-gray-600 dark:text-gray-400">
                      {client.recv_msg || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {clients.length > 5 && (
            <div className="mt-4 text-center">
              <button 
                onClick={() => router.push('/clients')}
                className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
              >
                查看全部 {clients.length} 个客户端
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
