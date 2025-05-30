import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

interface PublishRequest {
  topic: string;
  payload: string;
  qos: 0 | 1 | 2;
  retain: boolean;
}

// 从请求头获取认证配置
function getAuthConfig(request: NextRequest) {
  const authHeader = request.headers.get('x-nanomq-auth');
  if (authHeader) {
    try {
      return JSON.parse(authHeader);
    } catch (error) {
      console.error('Failed to parse auth header:', error);
    }
  }
  
  // 回退到环境变量
  return {
    baseURL: process.env.NANOMQ_API_URL || 'http://localhost:8081',
    username: process.env.NANOMQ_USERNAME || 'admin',
    password: process.env.NANOMQ_PASSWORD || 'public'
  };
}

// 创建 NanoMQ 客户端
function createNanoMQClient(config: { baseURL: string; username: string; password: string }) {
  return axios.create({
    baseURL: config.baseURL,
    timeout: 10000,
    auth: {
      username: config.username,
      password: config.password
    },
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

export async function POST(request: NextRequest) {
  try {
    const body: PublishRequest = await request.json();
    
    // 验证请求参数
    if (!body.topic || typeof body.topic !== 'string') {
      return NextResponse.json(
        { error: '主题 (topic) 是必需的且必须是字符串' },
        { status: 400 }
      );
    }
    
    if (!body.payload || typeof body.payload !== 'string') {
      return NextResponse.json(
        { error: '消息内容 (payload) 是必需的且必须是字符串' },
        { status: 400 }
      );
    }
    
    if (![0, 1, 2].includes(body.qos)) {
      return NextResponse.json(
        { error: 'QoS 必须是 0、1 或 2' },
        { status: 400 }
      );
    }
    
    if (typeof body.retain !== 'boolean') {
      return NextResponse.json(
        { error: 'retain 必须是布尔值' },
        { status: 400 }
      );
    }

    // 获取认证配置并创建客户端
    const authConfig = getAuthConfig(request);
    const nanomqClient = createNanoMQClient(authConfig);
    
    // 构建发布请求的数据
    const publishData = {
      topic: body.topic,
      payload: body.payload,
      qos: body.qos,
      retain: body.retain,
      // 可以添加其他 NanoMQ 支持的参数
      encoding: 'plain' // 或者根据需要设置为 'base64'
    };
    
    // 发送发布请求到 NanoMQ
    const response = await nanomqClient.post('/publish', publishData);
    
    return NextResponse.json({
      success: true,
      message: '消息发布成功',
      data: response.data
    });
    
  } catch (error) {
    console.error('Publish message error:', error);
    
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ECONNREFUSED') {
      return NextResponse.json(
        { error: '无法连接到 NanoMQ 服务器，请检查服务器状态' },
        { status: 503 }
      );
    }
    
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ETIMEDOUT') {
      return NextResponse.json(
        { error: '连接超时，请检查网络连接' },
        { status: 408 }
      );
    }
    
    if (error && typeof error === 'object' && 'response' in error && error.response) {
      const response = error.response as { status: number; data?: { error?: string; message?: string } };
      const status = response.status;
      const message = response.data?.error || response.data?.message || '发布消息失败';
      
      if (status === 401) {
        return NextResponse.json(
          { error: '认证失败，请检查用户名和密码' },
          { status: 401 }
        );
      }
      
      if (status === 403) {
        return NextResponse.json(
          { error: '权限不足，无法发布消息到此主题' },
          { status: 403 }
        );
      }
      
      if (status === 400) {
        return NextResponse.json(
          { error: `请求参数错误: ${message}` },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: `服务器错误: ${message}` },
        { status: status }
      );
    }
    
    return NextResponse.json(
      { error: '发布消息时发生未知错误' },
      { status: 500 }
    );
  }
}

// 支持 OPTIONS 请求用于 CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-nanomq-auth',
    },
  });
}