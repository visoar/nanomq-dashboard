'use client';

import React, { useState } from 'react';
import {
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Info,
  Server,
  Shield,
  Database,
  Zap,
  Globe,
} from 'lucide-react';

interface ConfigSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
}

interface ConfigItem {
  key: string;
  label: string;
  type: 'text' | 'number' | 'boolean' | 'select';
  value: string | number | boolean;
  description?: string;
  options?: { value: string | number | boolean; label: string }[];
  min?: number;
  max?: number;
  required?: boolean;
}

const ConfigurationPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState('broker');
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  
  // 模拟配置数据
  const [config, setConfig] = useState({
    broker: {
      port: 1883,
      max_connections: 1000,
      keepalive_timeout: 60,
      max_packet_size: 1048576,
      allow_anonymous: true,
      retain_available: true,
      wildcard_subscription: true,
      subscription_identifier: true,
      shared_subscription: true,
    },
    security: {
      ssl_enabled: false,
      ssl_port: 8883,
      ssl_cert_file: '/etc/nanomq/cert.pem',
      ssl_key_file: '/etc/nanomq/key.pem',
      ssl_ca_file: '/etc/nanomq/ca.pem',
      ssl_verify_peer: false,
      auth_enabled: false,
      auth_file: '/etc/nanomq/auth.conf',
    },
    websocket: {
      enabled: true,
      port: 8083,
      path: '/mqtt',
      max_connections: 500,
    },
    logging: {
      level: 'info',
      file: '/var/log/nanomq/nanomq.log',
      max_file_size: 10485760,
      max_file_count: 5,
      console_output: true,
    },
    performance: {
      worker_threads: 4,
      max_queued_messages: 1000,
      message_expiry_interval: 3600,
      session_expiry_interval: 7200,
      max_inflight_messages: 32,
    },
  });

  const configSections: ConfigSection[] = [
    {
      id: 'broker',
      title: 'Broker 设置',
      icon: <Server className="w-5 h-5" />,
      description: '基本的 MQTT Broker 配置',
    },
    {
      id: 'security',
      title: '安全设置',
      icon: <Shield className="w-5 h-5" />,
      description: 'SSL/TLS 和认证配置',
    },
    {
      id: 'websocket',
      title: 'WebSocket',
      icon: <Globe className="w-5 h-5" />,
      description: 'WebSocket 连接配置',
    },
    {
      id: 'logging',
      title: '日志设置',
      icon: <Database className="w-5 h-5" />,
      description: '日志记录和输出配置',
    },
    {
      id: 'performance',
      title: '性能调优',
      icon: <Zap className="w-5 h-5" />,
      description: '性能和资源配置',
    },
  ];

  const getConfigItems = (sectionId: string): ConfigItem[] => {
    switch (sectionId) {
      case 'broker':
        return [
          {
            key: 'port',
            label: 'MQTT 端口',
            type: 'number',
            value: config.broker.port,
            description: 'MQTT 服务监听端口',
            min: 1,
            max: 65535,
            required: true,
          },
          {
            key: 'max_connections',
            label: '最大连接数',
            type: 'number',
            value: config.broker.max_connections,
            description: '允许的最大并发连接数',
            min: 1,
            max: 100000,
          },
          {
            key: 'keepalive_timeout',
            label: 'Keep-alive 超时 (秒)',
            type: 'number',
            value: config.broker.keepalive_timeout,
            description: '客户端 keep-alive 超时时间',
            min: 1,
            max: 3600,
          },
          {
            key: 'max_packet_size',
            label: '最大数据包大小 (字节)',
            type: 'number',
            value: config.broker.max_packet_size,
            description: '允许的最大 MQTT 数据包大小',
            min: 1024,
            max: 268435456,
          },
          {
            key: 'allow_anonymous',
            label: '允许匿名连接',
            type: 'boolean',
            value: config.broker.allow_anonymous,
            description: '是否允许不提供用户名密码的连接',
          },
          {
            key: 'retain_available',
            label: '支持保留消息',
            type: 'boolean',
            value: config.broker.retain_available,
            description: '是否支持 MQTT 保留消息功能',
          },
          {
            key: 'wildcard_subscription',
            label: '支持通配符订阅',
            type: 'boolean',
            value: config.broker.wildcard_subscription,
            description: '是否支持通配符主题订阅',
          },
        ];
      case 'security':
        return [
          {
            key: 'ssl_enabled',
            label: '启用 SSL/TLS',
            type: 'boolean',
            value: config.security.ssl_enabled,
            description: '启用 SSL/TLS 加密连接',
          },
          {
            key: 'ssl_port',
            label: 'SSL 端口',
            type: 'number',
            value: config.security.ssl_port,
            description: 'SSL/TLS 连接监听端口',
            min: 1,
            max: 65535,
          },
          {
            key: 'ssl_cert_file',
            label: 'SSL 证书文件',
            type: 'text',
            value: config.security.ssl_cert_file,
            description: 'SSL 证书文件路径',
          },
          {
            key: 'ssl_key_file',
            label: 'SSL 私钥文件',
            type: 'text',
            value: config.security.ssl_key_file,
            description: 'SSL 私钥文件路径',
          },
          {
            key: 'ssl_verify_peer',
            label: '验证客户端证书',
            type: 'boolean',
            value: config.security.ssl_verify_peer,
            description: '是否验证客户端提供的证书',
          },
          {
            key: 'auth_enabled',
            label: '启用认证',
            type: 'boolean',
            value: config.security.auth_enabled,
            description: '启用用户名密码认证',
          },
        ];
      case 'websocket':
        return [
          {
            key: 'enabled',
            label: '启用 WebSocket',
            type: 'boolean',
            value: config.websocket.enabled,
            description: '启用 WebSocket 支持',
          },
          {
            key: 'port',
            label: 'WebSocket 端口',
            type: 'number',
            value: config.websocket.port,
            description: 'WebSocket 服务监听端口',
            min: 1,
            max: 65535,
          },
          {
            key: 'path',
            label: 'WebSocket 路径',
            type: 'text',
            value: config.websocket.path,
            description: 'WebSocket 连接路径',
          },
          {
            key: 'max_connections',
            label: '最大 WebSocket 连接',
            type: 'number',
            value: config.websocket.max_connections,
            description: '允许的最大 WebSocket 连接数',
            min: 1,
            max: 10000,
          },
        ];
      case 'logging':
        return [
          {
            key: 'level',
            label: '日志级别',
            type: 'select',
            value: config.logging.level,
            description: '日志记录级别',
            options: [
              { value: 'trace', label: 'Trace' },
              { value: 'debug', label: 'Debug' },
              { value: 'info', label: 'Info' },
              { value: 'warn', label: 'Warning' },
              { value: 'error', label: 'Error' },
              { value: 'fatal', label: 'Fatal' },
            ],
          },
          {
            key: 'file',
            label: '日志文件路径',
            type: 'text',
            value: config.logging.file,
            description: '日志文件存储路径',
          },
          {
            key: 'max_file_size',
            label: '最大文件大小 (字节)',
            type: 'number',
            value: config.logging.max_file_size,
            description: '单个日志文件的最大大小',
            min: 1024,
            max: 1073741824,
          },
          {
            key: 'max_file_count',
            label: '最大文件数量',
            type: 'number',
            value: config.logging.max_file_count,
            description: '保留的日志文件数量',
            min: 1,
            max: 100,
          },
          {
            key: 'console_output',
            label: '控制台输出',
            type: 'boolean',
            value: config.logging.console_output,
            description: '是否同时输出到控制台',
          },
        ];
      case 'performance':
        return [
          {
            key: 'worker_threads',
            label: '工作线程数',
            type: 'number',
            value: config.performance.worker_threads,
            description: '处理消息的工作线程数量',
            min: 1,
            max: 32,
          },
          {
            key: 'max_queued_messages',
            label: '最大队列消息数',
            type: 'number',
            value: config.performance.max_queued_messages,
            description: '每个客户端的最大队列消息数',
            min: 1,
            max: 100000,
          },
          {
            key: 'message_expiry_interval',
            label: '消息过期时间 (秒)',
            type: 'number',
            value: config.performance.message_expiry_interval,
            description: '消息的默认过期时间',
            min: 1,
            max: 86400,
          },
          {
            key: 'session_expiry_interval',
            label: '会话过期时间 (秒)',
            type: 'number',
            value: config.performance.session_expiry_interval,
            description: '客户端会话的过期时间',
            min: 1,
            max: 604800,
          },
          {
            key: 'max_inflight_messages',
            label: '最大飞行消息数',
            type: 'number',
            value: config.performance.max_inflight_messages,
            description: '每个客户端的最大飞行消息数',
            min: 1,
            max: 65535,
          },
        ];
      default:
        return [];
    }
  };

  const handleConfigChange = (sectionId: string, key: string, value: string | number | boolean) => {
    setConfig(prev => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId as keyof typeof prev],
        [key]: value,
      },
    }));
    setHasChanges(true);
    setSaveStatus('idle');
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // 模拟保存配置的 API 调用
      await new Promise(resolve => setTimeout(resolve, 2000));
      setSaveStatus('success');
      setHasChanges(false);
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const renderConfigItem = (item: ConfigItem, sectionId: string) => {
    const handleChange = (value: string | number | boolean) => {
      handleConfigChange(sectionId, item.key, value);
    };

    return (
      <div key={item.key} className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {item.label}
            {item.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {item.description && (
            <div className="group relative">
              <Info className="w-4 h-4 text-gray-400 cursor-help" />
              <div className="absolute right-0 top-6 w-64 p-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10">
                {item.description}
              </div>
            </div>
          )}
        </div>
        
        {item.type === 'text' && (
          <input
            type="text"
            value={typeof item.value === 'boolean' ? String(item.value) : item.value}
            onChange={(e) => handleChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        )}
        
        {item.type === 'number' && (
          <input
            type="number"
            value={typeof item.value === 'boolean' ? (item.value ? 1 : 0) : item.value}
            min={item.min}
            max={item.max}
            onChange={(e) => handleChange(parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        )}
        
        {item.type === 'boolean' && (
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(item.value)}
              onChange={(e) => handleChange(e.target.checked)}
              className="sr-only"
            />
            <div className={`relative w-11 h-6 rounded-full transition-colors ${
              item.value ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
            }`}>
              <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                item.value ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </div>
            <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
              {item.value ? '启用' : '禁用'}
            </span>
          </label>
        )}
        
        {item.type === 'select' && (
          <select
            value={typeof item.value === 'boolean' ? String(item.value) : item.value}
            onChange={(e) => handleChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {item.options?.map(option => (
              <option key={String(option.value)} value={String(option.value)}>
                {option.label}
              </option>
            ))}
          </select>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">系统配置</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            管理 NanoMQ 的系统配置和参数设置
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {saveStatus === 'success' && (
            <div className="flex items-center text-green-600 dark:text-green-400">
              <CheckCircle className="w-4 h-4 mr-2" />
              <span className="text-sm">保存成功</span>
            </div>
          )}
          {saveStatus === 'error' && (
            <div className="flex items-center text-red-600 dark:text-red-400">
              <AlertTriangle className="w-4 h-4 mr-2" />
              <span className="text-sm">保存失败</span>
            </div>
          )}
          <button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {isSaving ? '保存中...' : '保存配置'}
          </button>
        </div>
      </div>

      {/* 配置界面 */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 配置分类侧边栏 */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">配置分类</h3>
            <nav className="space-y-2">
              {configSections.map(section => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${
                    activeSection === section.id
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {section.icon}
                  <div className="ml-3">
                    <div className="text-sm font-medium">{section.title}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {section.description}
                    </div>
                  </div>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* 配置内容 */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            {(() => {
              const section = configSections.find(s => s.id === activeSection);
              const items = getConfigItems(activeSection);
              
              return (
                <div>
                  <div className="flex items-center mb-6">
                    {section?.icon}
                    <div className="ml-3">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {section?.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {section?.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    {items.map(item => renderConfigItem(item, activeSection))}
                  </div>
                </div>
              );
            })()
            }
          </div>
        </div>
      </div>

      {/* 警告信息 */}
      {hasChanges && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-3" />
            <div>
              <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                配置已修改
              </h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                您有未保存的配置更改。请点击&quot;保存配置&quot;按钮来应用这些更改。
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConfigurationPage;