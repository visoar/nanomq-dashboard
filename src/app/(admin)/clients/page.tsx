'use client';

import React, { useState, useMemo } from 'react';
import { useNanoMQ } from '@/context/NanoMQContext';
import {
  Users,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Wifi,
  WifiOff,
  Clock,
  MessageSquare,
  User,
  Globe,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

// 客户端状态过滤器
type ClientFilter = 'all' | 'connected' | 'idle' | 'disconnected';

// 协议过滤器
type ProtocolFilter = 'all' | 'MQTT' | 'CoAP' | 'LwM2M' | 'MQTT-SN';

const ClientsPage: React.FC = () => {
  const { clients, isLoading, refreshClients } = useNanoMQ();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ClientFilter>('all');
  const [protocolFilter, setProtocolFilter] = useState<ProtocolFilter>('all');
  const [selectedClient, setSelectedClient] = useState<string | null>(null);

  // 过滤和搜索客户端
  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      // 搜索过滤
      const matchesSearch = 
        client.client_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.username && client.username.toLowerCase().includes(searchTerm.toLowerCase()));

      // 状态过滤 - 注意：API 只返回在线客户端
      const matchesStatus = 
        statusFilter === 'all' ||
        (statusFilter === 'connected' && client.conn_state === 'connected') ||
        (statusFilter === 'idle' && client.conn_state === 'idle') ||
        (statusFilter === 'disconnected' && client.conn_state === 'disconnected');

      // 协议过滤
      const matchesProtocol = 
        protocolFilter === 'all' ||
        client.proto_name === protocolFilter;

      return matchesSearch && matchesStatus && matchesProtocol;
    });
  }, [clients, searchTerm, statusFilter, protocolFilter]);

  // 统计数据
  const stats = useMemo(() => {
    const total = clients.length;
    const connected = clients.filter(c => c.conn_state === 'connected').length;
    const idle = clients.filter(c => c.conn_state === 'idle').length;
    const disconnected = clients.filter(c => c.conn_state === 'disconnected').length;
    const protocols = clients.reduce((acc, client) => {
      acc[client.proto_name] = (acc[client.proto_name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { total, connected, idle, disconnected, protocols };
  }, [clients]);

  const handleRefresh = async () => {
    await refreshClients();
  };

  const getStatusColor = (connState: string) => {
    switch (connState) {
      case 'connected':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'idle':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'disconnected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getProtocolColor = (protocol: string) => {
    const colors = {
      MQTT: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      CoAP: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
      LwM2M: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      'MQTT-SN': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400',
    };
    return colors[protocol as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">客户端管理</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            管理和监控所有连接到 NanoMQ 的客户端
          </p>
          <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              💡 提示：当前 API 主要返回活跃连接的客户端信息，离线客户端可能不会显示在列表中。
            </p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          刷新
        </button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">总客户端</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">在线客户端</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.connected}</p>
            </div>
            <div className="p-3 rounded-lg bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400">
              <Wifi className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">空闲客户端</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.idle}</p>
            </div>
            <div className="p-3 rounded-lg bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">协议类型</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {Object.keys(stats.protocols).length}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400">
              <Globe className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* 搜索和过滤 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* 搜索框 */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="搜索客户端 ID 或用户名..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* 状态过滤 */}
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ClientFilter)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">全部状态</option>
              <option value="connected">已连接</option>
              <option value="idle">空闲</option>
              <option value="disconnected">已断开</option>
            </select>
          </div>

          {/* 协议过滤 */}
          <div>
            <select
              value={protocolFilter}
              onChange={(e) => setProtocolFilter(e.target.value as ProtocolFilter)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">全部协议</option>
              <option value="MQTT">MQTT</option>
              <option value="CoAP">CoAP</option>
              <option value="LwM2M">LwM2M</option>
              <option value="MQTT-SN">MQTT-SN</option>
            </select>
          </div>
        </div>
      </div>

      {/* 客户端列表 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            客户端列表 ({filteredClients.length})
          </h3>
        </div>

        {filteredClients.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              {clients.length === 0 ? '暂无客户端连接' : '没有找到匹配的客户端'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    客户端信息
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    协议
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    连接信息
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    消息统计
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredClients.map((client) => (
                  <tr key={client.client_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                            <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {client.client_id}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {client.username || '无用户名'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        getProtocolColor(client.proto_name)
                      }`}>
                        {client.proto_name} v{client.proto_ver}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        getStatusColor(client.conn_state)
                      }`}>
                        {client.conn_state === 'connected' ? (
                          <>
                            <Wifi className="w-3 h-3 mr-1" />
                            已连接
                          </>
                        ) : client.conn_state === 'idle' ? (
                          <>
                            <Clock className="w-3 h-3 mr-1" />
                            空闲
                          </>
                        ) : (
                          <>
                            <WifiOff className="w-3 h-3 mr-1" />
                            已断开
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <div className="space-y-1">
                        <div className="flex items-center">
                          <Clock className="w-3 h-3 mr-1 text-gray-400" />
                          <span>Keep-alive: {client.keepalive}s</span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Clean Start: {client.clean_start ? '是' : '否'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <div className="flex items-center">
                        <MessageSquare className="w-3 h-3 mr-1 text-gray-400" />
                        <span>{client.recv_msg || 0} 条消息</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setSelectedClient(client.client_id)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 flex items-center"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        详情
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 客户端详情模态框 */}
      {selectedClient && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-99999 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
            {(() => {
              const client = clients.find(c => c.client_id === selectedClient);
              if (!client) return null;

              return (
                <>
                  {/* 头部 */}
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 text-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                          <User className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold">
                            客户端详情
                          </h3>
                          <p className="text-blue-100 text-sm">
                            {client.client_id}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedClient(null)}
                        className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
                      >
                        <span className="text-xl">×</span>
                      </button>
                    </div>
                  </div>

                  {/* 内容区域 */}
                  <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                    {/* 状态卡片 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-lg border border-green-200 dark:border-green-700">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-green-600 dark:text-green-400">连接状态</p>
                            <p className="text-lg font-bold text-green-700 dark:text-green-300">
                              {client.conn_state === 'connected' ? '已连接' : 
                               client.conn_state === 'idle' ? '空闲' : '已断开'}
                            </p>
                          </div>
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            client.conn_state === 'connected' ? 'bg-green-500' : 
                            client.conn_state === 'idle' ? 'bg-yellow-500' : 'bg-red-500'
                          }`}>
                            {client.conn_state === 'connected' ? 
                              <Wifi className="w-5 h-5 text-white" /> :
                              <WifiOff className="w-5 h-5 text-white" />
                            }
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-blue-600 dark:text-blue-400">协议版本</p>
                            <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
                              {client.proto_name} v{client.proto_ver}
                            </p>
                          </div>
                          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                            <Globe className="w-5 h-5 text-white" />
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-4 rounded-lg border border-purple-200 dark:border-purple-700">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-purple-600 dark:text-purple-400">接收消息</p>
                            <p className="text-lg font-bold text-purple-700 dark:text-purple-300">
                              {client.recv_msg || 0} 条
                            </p>
                          </div>
                          <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                            <MessageSquare className="w-5 h-5 text-white" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 详细信息 */}
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                        详细信息
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">客户端 ID</label>
                            <p className="text-gray-900 dark:text-white font-mono text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                              {client.client_id}
                            </p>
                          </div>
                          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">用户名</label>
                            <p className="text-gray-900 dark:text-white">
                              {client.username || (
                                <span className="text-gray-400 italic">未设置用户名</span>
                              )}
                            </p>
                          </div>
                          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">Keep-alive 间隔</label>
                            <div className="flex items-center space-x-2">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <p className="text-gray-900 dark:text-white">{client.keepalive} 秒</p>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">Clean Start</label>
                            <div className="flex items-center space-x-2">
                              {client.clean_start ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-yellow-500" />
                              )}
                              <p className="text-gray-900 dark:text-white">
                                {client.clean_start ? '启用' : '禁用'}
                              </p>
                            </div>
                          </div>
                          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">连接状态详情</label>
                            <div className="flex items-center space-x-2">
                              <div className={`w-3 h-3 rounded-full ${
                                client.conn_state === 'connected' ? 'bg-green-500' : 
                                client.conn_state === 'idle' ? 'bg-yellow-500' : 'bg-red-500'
                              }`}></div>
                              <p className="text-gray-900 dark:text-white capitalize">
                                {client.conn_state}
                              </p>
                            </div>
                          </div>
                          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">协议信息</label>
                            <div className="flex items-center space-x-2">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                getProtocolColor(client.proto_name)
                              }`}>
                                {client.proto_name} v{client.proto_ver}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => setSelectedClient(null)}
                        className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                      >
                        关闭
                      </button>
                      <button
                        onClick={() => {
                          // 这里可以添加刷新客户端信息的逻辑
                          refreshClients();
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>刷新</span>
                      </button>
                    </div>
                  </div>
                </>
              );
            })()
            }
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientsPage;