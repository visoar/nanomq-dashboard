import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: NextRequest) {
  try {
    const { baseURL, username, password } = await request.json();
    
    if (!baseURL || !username || !password) {
      return NextResponse.json(
        { error: '缺少必要的连接参数' },
        { status: 400 }
      );
    }

    // 创建临时的 axios 实例来测试连接
    const testClient = axios.create({
      baseURL: `${baseURL}/api/v4`,
      auth: {
        username,
        password,
      },
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 尝试获取 broker 信息来测试连接
    const response = await testClient.get('/brokers');
    
    if (response.status === 200 && response.data.code === 0) {
      return NextResponse.json({
        success: true,
        message: '连接成功',
        data: response.data.data[0] || null,
      });
    } else {
      return NextResponse.json(
        { error: 'NanoMQ 服务器返回错误', details: response.data },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('[Test Connection] Error:', error instanceof Error ? error.message : 'Unknown error');
    
    if (error && typeof error === 'object' && 'response' in error) {
      // NanoMQ 返回了错误响应
      const axiosError = error as { response: { status: number; data?: { message?: string } } };
      if (axiosError.response.status === 401) {
        return NextResponse.json(
          { error: '用户名或密码错误' },
          { status: 401 }
        );
      } else {
        return NextResponse.json(
          {
            error: 'NanoMQ 服务器错误',
            message: axiosError.response.data?.message || (error instanceof Error ? error.message : 'Unknown error'),
            status: axiosError.response.status,
          },
          { status: axiosError.response.status }
        );
      }
    } else if (error && typeof error === 'object' && 'request' in error) {
      // 网络错误或连接失败
      return NextResponse.json(
        {
          error: '无法连接到 NanoMQ 服务器',
          message: '请检查服务器地址和网络连接',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 503 }
      );
    } else {
      // 其他错误
      return NextResponse.json(
        {
          error: '测试连接时发生错误',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  }
}