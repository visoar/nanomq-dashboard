'use client';

import React, { useState, useMemo } from 'react';
import { useNanoMQ } from '@/context/NanoMQContext';
import {
  MessageSquare,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Hash,
  User,
  TrendingUp,
  Activity,
} from 'lucide-react';

// QoS 过滤器
type QoSFilter = 'all' | '0' | '1' | '2';

const SubscriptionsPage: React.FC = () => {
  const { subscriptions, isLoading, refreshSubscriptions } = useNanoMQ();
  const [searchTerm, setSearchTerm] = useState('');
  const [qosFilter, setQoSFilter] = useState<QoSFilter>('all');
  const [selectedSubscription, setSelectedSubscription] = useState<string | null>(null);

  // 过滤和搜索订阅
  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter(subscription => {
      // 搜索过滤
      const matchesSearch = 
        subscription.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subscription.clientid.toLowerCase().includes(searchTerm.toLowerCase());

      // QoS 过滤
      const matchesQoS = 
        qosFilter === 'all' ||
        subscription.qos.toString() === qosFilter;

      return matchesSearch && matchesQoS;
    });
  }, [subscriptions, searchTerm, qosFilter]);

  // 统计数据
  const stats = useMemo(() => {
    const total = subscriptions.length;
    const qosStats = subscriptions.reduce((acc, sub) => {
      acc[sub.qos] = (acc[sub.qos] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    
    const topicStats = subscriptions.reduce((acc, sub) => {
      const topicParts = sub.topic.split('/');
      const rootTopic = topicParts[0] || sub.topic;
      acc[rootTopic] = (acc[rootTopic] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const uniqueClients = new Set(subscriptions.map(sub => sub.clientid)).size;
    const wildcardSubscriptions = subscriptions.filter(sub => 
      sub.topic.includes('+') || sub.topic.includes('#')
    ).length;

    return { 
      total, 
      qosStats, 
      topicStats, 
      uniqueClients, 
      wildcardSubscriptions 
    };
  }, [subscriptions]);

  const handleRefresh = async () => {
    await refreshSubscriptions();
  };

  const getQoSColor = (qos: number) => {
    const colors = {
      0: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
      1: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      2: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    };
    return colors[qos as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
  };

  const getQoSDescription = (qos: number) => {
    const descriptions = {
      0: '最多一次',
      1: '至少一次',
      2: '恰好一次',
    };
    return descriptions[qos as keyof typeof descriptions] || '未知';
  };

  const isWildcardTopic = (topic: string) => {
    return topic.includes('+') || topic.includes('#');
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">订阅管理</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            管理和监控所有活跃的主题订阅
          </p>
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
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">总订阅数</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
              <MessageSquare className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">订阅客户端</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.uniqueClients}</p>
            </div>
            <div className="p-3 rounded-lg bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400">
              <User className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">通配符订阅</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.wildcardSubscriptions}</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400">
              <Hash className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">主题类型</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {Object.keys(stats.topicStats).length}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* QoS 统计 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">QoS 分布</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[0, 1, 2].map(qos => (
            <div key={qos} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    getQoSColor(qos)
                  }`}>
                    QoS {qos}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {getQoSDescription(qos)}
                  </span>
                </div>
              </div>
              <div className="text-xl font-bold text-gray-900 dark:text-white">
                {stats.qosStats[qos] || 0}
              </div>
            </div>
          ))}
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
                placeholder="搜索主题或客户端 ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* QoS 过滤 */}
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={qosFilter}
              onChange={(e) => setQoSFilter(e.target.value as QoSFilter)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">全部 QoS</option>
              <option value="0">QoS 0</option>
              <option value="1">QoS 1</option>
              <option value="2">QoS 2</option>
            </select>
          </div>
        </div>
      </div>

      {/* 订阅列表 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            订阅列表 ({filteredSubscriptions.length})
          </h3>
        </div>

        {filteredSubscriptions.length === 0 ? (
          <div className="p-8 text-center">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              {subscriptions.length === 0 ? '暂无活跃订阅' : '没有找到匹配的订阅'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    主题
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    客户端 ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    QoS
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    类型
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredSubscriptions.map((subscription, index) => (
                  <tr key={`${subscription.clientid}-${subscription.topic}-${index}`} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            isWildcardTopic(subscription.topic)
                              ? 'bg-purple-100 dark:bg-purple-900/20'
                              : 'bg-blue-100 dark:bg-blue-900/20'
                          }`}>
                            {isWildcardTopic(subscription.topic) ? (
                              <Hash className={`w-5 h-5 ${
                                isWildcardTopic(subscription.topic)
                                  ? 'text-purple-600 dark:text-purple-400'
                                  : 'text-blue-600 dark:text-blue-400'
                              }`} />
                            ) : (
                              <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            )}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white break-all">
                            {subscription.topic}
                          </div>
                          {isWildcardTopic(subscription.topic) && (
                            <div className="text-xs text-purple-600 dark:text-purple-400">
                              通配符订阅
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center mr-3">
                          <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {subscription.clientid}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        getQoSColor(subscription.qos)
                      }`}>
                        QoS {subscription.qos}
                      </span>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {getQoSDescription(subscription.qos)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {isWildcardTopic(subscription.topic) ? (
                          <>
                            <Hash className="w-4 h-4 text-purple-500 mr-1" />
                            <span className="text-sm text-purple-600 dark:text-purple-400">通配符</span>
                          </>
                        ) : (
                          <>
                            <Activity className="w-4 h-4 text-blue-500 mr-1" />
                            <span className="text-sm text-blue-600 dark:text-blue-400">精确</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setSelectedSubscription(`${subscription.clientid}-${subscription.topic}`)}
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

      {/* 订阅详情模态框 */}
      {selectedSubscription && (
        <div className="fixed inset-0 bg-black bg-opacity-10 flex items-center justify-center p-4 z-99999">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  订阅详情
                </h3>
                <button
                  onClick={() => setSelectedSubscription(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6">
              {(() => {
                const [clientId, topic] = selectedSubscription.split('-', 2);
                const subscription = subscriptions.find(s => 
                  s.clientid === clientId && s.topic === topic
                );
                if (!subscription) return null;

                return (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">主题</label>
                        <p className="text-gray-900 dark:text-white break-all">{subscription.topic}</p>
                        {isWildcardTopic(subscription.topic) && (
                          <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">
                            这是一个通配符订阅，可以匹配多个主题
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">客户端 ID</label>
                        <p className="text-gray-900 dark:text-white">{subscription.clientid}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">服务质量 (QoS)</label>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            getQoSColor(subscription.qos)
                          }`}>
                            QoS {subscription.qos}
                          </span>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {getQoSDescription(subscription.qos)}
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">订阅类型</label>
                        <div className="flex items-center space-x-2 mt-1">
                          {isWildcardTopic(subscription.topic) ? (
                            <>
                              <Hash className="w-4 h-4 text-purple-500" />
                              <span className="text-purple-600 dark:text-purple-400">通配符订阅</span>
                            </>
                          ) : (
                            <>
                              <Activity className="w-4 h-4 text-blue-500" />
                              <span className="text-blue-600 dark:text-blue-400">精确订阅</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionsPage;