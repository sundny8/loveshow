'use client';

import { useState } from 'react';
import { Link } from '@/i18n/routing';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { signUp } from '@/lib/auth-client';
import { Camera, Loader2 } from 'lucide-react';

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const validatePassword = (pass: string) => {
    if (pass.length < 8) return false;
    const hasLetters = /[A-Za-z]/.test(pass);
    const hasNumbers = /[0-9]/.test(pass);
    const hasSpecial = /[^A-Za-z0-9]/.test(pass);
    const typesCount = [hasLetters, hasNumbers, hasSpecial].filter(Boolean).length;
    return typesCount >= 2;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validatePassword(password)) {
      setError('密码不符合规则：需至少8位，且包含字母、数字、特殊字符中的至少两种。');
      return;
    }

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致，请重新输入。');
      return;
    }

    setIsLoading(true);

    try {
      await signUp.email({ email, password, name });
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || '创建账号失败，请稍后重试。');
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <div suppressHydrationWarning className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
      <Card className="w-full max-w-md border-none shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
        <CardHeader className="text-center">
          <Link href="/" className="inline-flex items-center justify-center space-x-2 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-loveshow-gradient shadow-md shadow-violet-500/20">
              <Camera className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight">LoveShow</span>
          </Link>
          <CardTitle className="text-2xl">创建账号</CardTitle>
          <CardDescription>开启您的 AI 创意设计之旅</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-900/30">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                姓名
              </label>
              <Input
                id="name"
                type="text"
                placeholder="您的姓名"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                电子邮箱
              </label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                设置密码
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <p className="text-[11px] text-slate-500 mt-1 flex items-center">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary-500 mr-1.5 flex-shrink-0" />
                至少8位字符，且包含字母、数字、特殊字符中的至少两种
              </p>
            </div>
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium">
                确认密码
              </label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full py-6 text-base font-semibold" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  提交中...
                </>
              ) : (
                '立即注册'
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center border-t border-slate-100 dark:border-slate-800 mt-4 pt-6">
          <p className="text-sm text-slate-500">
            已有账号？{' '}
            <Link href="/auth/signin" className="text-primary-600 hover:underline font-bold">
              立即登录
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
