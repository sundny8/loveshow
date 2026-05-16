import { auth } from '@/lib/auth';
import { toNextJsHandler } from 'better-auth/next-js';

// 强制动态渲染，防止 Next.js 尝试对认证路由做静态路径生成
export const dynamic = 'force-dynamic';

export const { POST, GET } = toNextJsHandler(auth);
