'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
  Send,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Copy,
  Eye,
  EyeOff,
} from 'lucide-react';

interface PublishMessage {
  topic: string;
  payload: string;
  qos: 0 | 1 | 2;
  retain: boolean;
}

interface PublishResult {
  success: boolean;
  message: string;
  timestamp: Date;
}

const PublishPage: React.FC = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [message, setMessage] = useState<PublishMessage>({
    topic: '',
    payload: '',
    qos: 0,
    retain: false,
  });
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishResults, setPublishResults] = useState<PublishResult[]>([]);
  const [showPayload, setShowPayload] = useState(true);
  const [payloadFormat, setPayloadFormat] = useState<'text' | 'json'>('text');

  // 认证检查
  React.useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/signin');
    }
  }, [isAuthenticated, authLoading, router]);

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

  const handlePublish = async () => {
    if (!message.topic.trim() || !message.payload.trim()) {
      const result: PublishResult = {
        success: false,
        message: '主题和消息内容不能为空',
        timestamp: new Date(),
      };
      setPublishResults(prev => [result, ...prev]);
      return;
    }

    setIsPublishing(true);
    
    try {
      const response = await fetch('/api/nanomq/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: message.topic,
          payload: message.payload,
          qos: message.qos,
          retain: message.retain,
        }),
      });

      const data = await response.json();
      
      const result: PublishResult = {
        success: response.ok,
        message: response.ok ? '消息发布成功' : data.error || '发布失败',
        timestamp: new Date(),
      };
      
      setPublishResults(prev => [result, ...prev]);
      
      // 如果发布成功，清空表单
      if (response.ok) {
        setMessage({
          topic: '',
          payload: '',
          qos: 0,
          retain: false,
        });
      }
    } catch {
      const result: PublishResult = {
        success: false,
        message: '网络错误，请检查连接',
        timestamp: new Date(),
      };
      setPublishResults(prev => [result, ...prev]);
    } finally {
      setIsPublishing(false);
    }
  };

  const formatPayload = () => {
    if (payloadFormat === 'json') {
      try {
        return JSON.stringify(JSON.parse(message.payload), null, 2);
      } catch {
        return message.payload;
      }
    }
    return message.payload;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getQoSDescription = (qos: number) => {
    const descriptions = {
      0: '最多一次 (At most once)',
      1: '至少一次 (At least once)',
      2: '恰好一次 (Exactly once)',
    };
    return descriptions[qos as keyof typeof descriptions];
  };

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">消息发布</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            向 MQTT 主题发布消息
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            已连接
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 消息发布表单 */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center mb-6">
              <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">发布消息</h2>
            </div>

            <div className="space-y-6">
              {/* 主题输入 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  主题 (Topic) *
                </label>
                <input
                  type="text"
                  value={message.topic}
                  onChange={(e) => setMessage(prev => ({ ...prev, topic: e.target.value }))}
                  placeholder="例如: sensors/temperature"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  支持通配符：+ (单级) 和 # (多级)
                </p>
              </div>

              {/* QoS 选择 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  服务质量 (QoS)
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[0, 1, 2].map((qos) => (
                    <button
                      key={qos}
                      onClick={() => setMessage(prev => ({ ...prev, qos: qos as 0 | 1 | 2 }))}
                      className={`p-3 rounded-lg border text-center transition-colors ${
                        message.qos === qos
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                      }`}
                    >
                      <div className="font-semibold">QoS {qos}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {getQoSDescription(qos).split(' (')[0]}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Retain 选项 */}
              <div>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={message.retain}
                    onChange={(e) => setMessage(prev => ({ ...prev, retain: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    保留消息 (Retain)
                  </span>
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-7">
                  保留消息会被服务器存储，新订阅者会立即收到最后一条保留消息
                </p>
              </div>

              {/* 消息内容 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    消息内容 (Payload) *
                  </label>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setPayloadFormat(payloadFormat === 'text' ? 'json' : 'text')}
                      className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      {payloadFormat === 'text' ? 'JSON' : 'Text'}
                    </button>
                    <button
                      onClick={() => setShowPayload(!showPayload)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showPayload ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <textarea
                  value={showPayload ? formatPayload() : '••••••••••••••••••••'}
                  onChange={(e) => setMessage(prev => ({ ...prev, payload: e.target.value }))}
                  placeholder={payloadFormat === 'json' ? '{\n  "temperature": 25.6,\n  "humidity": 60.2\n}' : '消息内容...'}
                  rows={8}
                  readOnly={!showPayload}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                />
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    字符数: {message.payload.length}
                  </p>
                  <button
                    onClick={() => copyToClipboard(message.payload)}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center"
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    复制
                  </button>
                </div>
              </div>

              {/* 发布按钮 */}
              <button
                onClick={handlePublish}
                disabled={isPublishing || !message.topic.trim() || !message.payload.trim()}
                className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isPublishing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                {isPublishing ? '发布中...' : '发布消息'}
              </button>
            </div>
          </div>
        </div>

        {/* 侧边栏 */}
        <div className="space-y-6">
          {/* 消息预览 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center mb-4">
              <Eye className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">消息预览</h3>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">主题</label>
                <p className="text-sm text-gray-900 dark:text-white font-mono bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded mt-1">
                  {message.topic || '未设置'}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">QoS</label>
                <p className="text-sm text-gray-900 dark:text-white mt-1">
                  {message.qos} - {getQoSDescription(message.qos).split(' (')[0]}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">保留消息</label>
                <p className="text-sm text-gray-900 dark:text-white mt-1">
                  {message.retain ? '是' : '否'}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">消息大小</label>
                <p className="text-sm text-gray-900 dark:text-white mt-1">
                  {new Blob([message.payload]).size} 字节
                </p>
              </div>
            </div>
          </div>

          {/* 发布历史 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">发布历史</h3>
              </div>
              {publishResults.length > 0 && (
                <button
                  onClick={() => setPublishResults([])}
                  className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  清空
                </button>
              )}
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {publishResults.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  暂无发布记录
                </p>
              ) : (
                publishResults.map((result, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${
                      result.success
                        ? 'border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20'
                        : 'border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/20'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      {result.success ? (
                        <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                      )}
                      <span className={`text-sm font-medium ${
                        result.success
                          ? 'text-green-700 dark:text-green-400'
                          : 'text-red-700 dark:text-red-400'
                      }`}>
                        {result.message}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {result.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublishPage;