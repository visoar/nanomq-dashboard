'use client';

import axios, { AxiosInstance, AxiosResponse } from 'axios';

// API 响应类型定义
export interface ApiResponse<T = unknown> {
  code: number;
  data: T;
}

// Broker 信息类型
export interface BrokerInfo {
  datetime: string;
  node_status: string;
  sysdescr: string;
  uptime: string;
  version: string;
}

// 节点信息类型
export interface NodeInfo {
  connections: number;
  node_status: string;
  uptime: string;
  version: string;
}

// 客户端信息类型
export interface ClientInfo {
  client_id: string;
  username: string;
  proto_name: string;
  proto_ver: number;
  connected: boolean;
  keepalive: number;
  clean_start: boolean;
  recv_msg: number;
  conn_state: 'connected' | 'idle' | 'disconnected';
}

// 订阅信息类型
export interface SubscriptionInfo {
  clientid: string;
  topic: string;
  qos: number;
}

// 统计信息类型
export interface MetricsInfo {
  // CPU 和内存信息
  cpu_usage?: number;
  memory_usage?: number;
  memory_total?: number;
  cpuinfo?: string;
  memory?: string;
  
  // 连接和订阅统计
  connections_count?: number;
  connections_max?: number;
  subscriptions_count?: number;
  subscriptions_max?: number;
  
  // 消息统计
  messages_received?: number;
  messages_sent?: number;
  messages_dropped?: number;
  messages_retained?: number;
  
  // 字节统计
  bytes_received?: number;
  bytes_sent?: number;
  
  // 运行时间
  uptime?: number;
  
  // 时间戳
  timestamp?: number;
  
  // 原始 metrics 数据（兼容性）
  metrics?: Record<string, unknown>[];
}

// 发布消息参数类型
export interface PublishMessage {
  topic?: string;
  topics?: string;
  clientid?: string;
  payload: string;
  encoding?: 'plain' | 'base64';
  qos?: 0 | 1 | 2;
  retain?: boolean;
}

// API 端点类型
export interface ApiEndpoint {
  path: string;
  name: string;
  method: string;
  descr: string;
}

class NanoMQAPI {
  private client: AxiosInstance;
  private baseURL: string;
  private authConfig: { baseURL: string; username: string; password: string } | null = null;

  constructor() {
    // 使用 Next.js API 路由作为代理
    this.baseURL = '/api/nanomq';

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 请求拦截器
    this.client.interceptors.request.use(
      (config) => {
        console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
        
        // 添加认证信息到请求头
        if (this.authConfig) {
          config.headers['x-nanomq-auth'] = JSON.stringify(this.authConfig);
        }
        
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        // 直接返回响应，错误处理由 API 代理层处理
        return response;
      },
      (error) => {
        // 统一错误处理
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  // 设置认证配置
  setAuthConfig(config: { baseURL: string; username: string; password: string }) {
    this.authConfig = config;
  }

  // 清除认证配置
  clearAuthConfig() {
    this.authConfig = null;
  }

  // 测试连接
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.get('/brokers');
      return response.status === 200 && response.data && response.data.code === 0;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  // 获取所有 API 端点
  async getEndpoints(): Promise<ApiEndpoint[]> {
    const response = await this.client.get('/');
    return response.data.data;
  }

  // 获取 Broker 信息
  async getBrokerInfo(): Promise<BrokerInfo[]> {
    const response = await this.client.get('/brokers');
    return response.data.data;
  }

  // 获取节点信息
  async getNodeInfo(): Promise<NodeInfo[]> {
    const response = await this.client.get('/nodes');
    return response.data.data;
  }

  // 获取统计信息
  async getMetrics(): Promise<MetricsInfo> {
    const response = await this.client.get('/metrics');
    return response.data;
  }

  // 获取 Prometheus 统计数据
  async getPrometheusMetrics(): Promise<string> {
    const response = await this.client.get('/prometheus');
    return response.data;
  }

  // 获取客户端列表
  async getClients(params?: {
    clientid?: string;
    username?: string;
    conn_state?: 'connected' | 'idle' | 'disconnected';
    clean_start?: boolean;
    proto_name?: 'MQTT' | 'CoAP' | 'LwM2M' | 'MQTT-SN';
    proto_ver?: number;
  }): Promise<ClientInfo[]> {
    const response = await this.client.get('/clients', {
      params,
    });
    return response.data.data;
  }

  // 根据 ClientID 获取客户端信息
  async getClientById(clientid: string): Promise<ClientInfo[]> {
    const response = await this.client.get(`/clients/${encodeURIComponent(clientid)}`);
    return response.data.data;
  }

  // 根据用户名获取客户端信息
  async getClientByUsername(username: string): Promise<ClientInfo[]> {
    const response = await this.client.get(`/clients/username/${encodeURIComponent(username)}`);
    return response.data.data;
  }

  // 获取订阅列表
  async getSubscriptions(params?: {
    clientid?: string;
    topic?: string;
    qos?: 0 | 1 | 2;
    share?: string;
  }): Promise<SubscriptionInfo[]> {
    const response = await this.client.get('/subscriptions', {
      params,
    });
    return response.data.data;
  }

  // 根据 ClientID 获取订阅信息
  async getSubscriptionsByClientId(clientid: string): Promise<SubscriptionInfo[]> {
    const response = await this.client.get(`/subscriptions/${encodeURIComponent(clientid)}`);
    return response.data.data;
  }

  // 发布消息
  async publishMessage(message: PublishMessage): Promise<ApiResponse> {
    const response = await this.client.post('/mqtt/publish', message);
    return response.data;
  }

  // 获取主题树
  async getTopicTree(): Promise<Record<string, unknown>> {
    const response = await this.client.get('/topic-tree');
    return response.data.data;
  }

  // 获取配置
  async getConfiguration(): Promise<Record<string, unknown>> {
    const response = await this.client.get('/configuration');
    return response.data;
  }

  // 设置配置
  async setConfiguration(config: Record<string, unknown>): Promise<ApiResponse> {
    const response = await this.client.post('/configuration', config);
    return response.data;
  }

  // 控制 Broker（停止或重启）
  async controlBroker(action: 'stop' | 'restart'): Promise<ApiResponse> {
    const response = await this.client.post(`/ctrl/${action}`);
    return response.data;
  }
}

// 导出单例实例
export const nanomqAPI = new NanoMQAPI();
export default nanomqAPI;