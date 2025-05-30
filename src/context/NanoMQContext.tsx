'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { nanomqAPI, BrokerInfo, NodeInfo, ClientInfo, SubscriptionInfo, MetricsInfo } from '@/lib/nanomq-api';
import { useAuth } from './AuthContext';

interface NanoMQContextType {
  // 连接状态
  isConnected: boolean;
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
  isLoading: boolean;
  error: string | null;
  
  // 数据
  brokerInfo: BrokerInfo | null;
  nodeInfo: NodeInfo | null;
  clients: ClientInfo[];
  subscriptions: SubscriptionInfo[];
  metrics: MetricsInfo | null;
  
  // 方法
  testConnection: () => Promise<boolean>;
  refreshData: () => Promise<void>;
  refreshBrokerInfo: () => Promise<void>;
  refreshNodeInfo: () => Promise<void>;
  refreshClients: () => Promise<void>;
  refreshSubscriptions: () => Promise<void>;
  refreshMetrics: () => Promise<void>;
}

const NanoMQContext = createContext<NanoMQContextType | undefined>(undefined);

interface NanoMQProviderProps {
  children: ReactNode;
}

export const NanoMQProvider: React.FC<NanoMQProviderProps> = ({ children }) => {
  const { isAuthenticated, config } = useAuth();
  
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [brokerInfo, setBrokerInfo] = useState<BrokerInfo | null>(null);
  const [nodeInfo, setNodeInfo] = useState<NodeInfo | null>(null);
  const [clients, setClients] = useState<ClientInfo[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionInfo[]>([]);
  const [metrics, setMetrics] = useState<MetricsInfo | null>(null);

  // 当认证状态或配置变化时，更新 API 配置
  useEffect(() => {
    if (isAuthenticated && config) {
      nanomqAPI.setAuthConfig(config);
    } else {
      nanomqAPI.clearAuthConfig();
    }
  }, [isAuthenticated, config]);

  // 测试连接
  const testConnection = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setConnectionStatus('connecting');
    setError(null);
    
    try {
      const connected = await nanomqAPI.testConnection();
      setIsConnected(connected);
      setConnectionStatus(connected ? 'connected' : 'disconnected');
      
      if (!connected) {
        setError('无法连接到 NanoMQ 服务器');
      }
      
      return connected;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '连接测试失败';
      setError(errorMessage);
      setIsConnected(false);
      setConnectionStatus('disconnected');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 刷新 Broker 信息
  const refreshBrokerInfo = useCallback(async () => {
    try {
      const data = await nanomqAPI.getBrokerInfo();
      setBrokerInfo(data[0] || null);
    } catch (err) {
      console.error('Failed to fetch broker info:', err);
    }
  }, []);

  // 刷新节点信息
  const refreshNodeInfo = useCallback(async () => {
    try {
      const data = await nanomqAPI.getNodeInfo();
      setNodeInfo(data[0] || null);
    } catch (err) {
      console.error('Failed to fetch node info:', err);
    }
  }, []);

  // 刷新客户端信息
  const refreshClients = useCallback(async () => {
    try {
      const data = await nanomqAPI.getClients();
      setClients(data);
    } catch (err) {
      console.error('Failed to fetch clients:', err);
    }
  }, []);

  // 刷新订阅信息
  const refreshSubscriptions = useCallback(async () => {
    try {
      const data = await nanomqAPI.getSubscriptions();
      setSubscriptions(data);
    } catch (err) {
      console.error('Failed to fetch subscriptions:', err);
    }
  }, []);

  // 刷新统计信息
  const refreshMetrics = useCallback(async () => {
    try {
      const data = await nanomqAPI.getMetrics();
      setMetrics(data);
      // 如果成功获取数据，更新连接状态
      if (!isConnected) {
        setIsConnected(true);
        setConnectionStatus('connected');
        setError(null);
      }
    } catch (err) {
      console.error('Failed to fetch metrics:', err);
      // 如果获取数据失败，可能是连接问题
      setIsConnected(false);
      setConnectionStatus('disconnected');
      const errorMessage = err instanceof Error ? err.message : '获取统计信息失败';
      setError(errorMessage);
    }
  }, [isConnected]);

  // 刷新所有数据
  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 先测试连接
      const connected = await testConnection();
      if (connected) {
        await Promise.all([
          refreshBrokerInfo(),
          refreshNodeInfo(),
          refreshClients(),
          refreshSubscriptions(),
          refreshMetrics(),
        ]);
      }
    } catch (err) {
      console.error('Failed to refresh data:', err);
      setIsConnected(false);
      setConnectionStatus('disconnected');
      const errorMessage = err instanceof Error ? err.message : '刷新数据失败';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [testConnection, refreshBrokerInfo, refreshNodeInfo, refreshClients, refreshSubscriptions, refreshMetrics]);

  // 初始化时测试连接
  useEffect(() => {
    if (isAuthenticated && config) {
      testConnection();
    }
  }, [isAuthenticated, config, testConnection]);



  // 自动刷新数据
  useEffect(() => {
    if (isConnected) {
      refreshData();
      
      // 设置定时刷新
      const interval = setInterval(refreshData, 30000); // 每30秒刷新一次
      return () => clearInterval(interval);
    }
  }, [isConnected, refreshData]);

  const value: NanoMQContextType = {
    // 连接状态
    isConnected,
    connectionStatus,
    isLoading,
    error,
    
    // 数据
    brokerInfo,
    nodeInfo,
    clients,
    subscriptions,
    metrics,
    
    // 方法
    testConnection,
    refreshData,
    refreshBrokerInfo,
    refreshNodeInfo,
    refreshClients,
    refreshSubscriptions,
    refreshMetrics,
  };

  return (
    <NanoMQContext.Provider value={value}>
      {children}
    </NanoMQContext.Provider>
  );
};

export const useNanoMQ = (): NanoMQContextType => {
  const context = useContext(NanoMQContext);
  if (context === undefined) {
    throw new Error('useNanoMQ must be used within a NanoMQProvider');
  }
  return context;
};