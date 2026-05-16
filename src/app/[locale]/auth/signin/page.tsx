'use client';

import { useState } from 'react';
import { Link } from '@/i18n/routing';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { signIn } from '@/lib/auth-client';
import { Camera, Loader2 } from 'lucide-react';

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      setError('密码格式错误：需至少8位，且包含字母、数字、特殊字符中的至少两种。');
      return;
    }

    setIsLoading(true);

    try {
      const result = await signIn.email({ email, password });
      if (result?.error) {
        setError(result.error.message || '登录失败，请检查您的账号或密码。');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || '登录失败，请检查您的账号或密码。');
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
          <CardTitle className="text-2xl">欢迎回来</CardTitle>
          <CardDescription>登录您的账号，继续创作</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-900/30">
                {error}
              </div>
            )}
            
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
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium">
                  账户密码
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs text-primary-600 hover:underline"
                >
                  忘记密码？
                </Link>
              </div>
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
                需符合：至少8位，字母/数字/特殊字符至少两种
              </p>
            </div>

            <Button type="submit" className="w-full py-6 text-base font-semibold" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  登录中...
                </>
              ) : (
                '立即登录'
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center border-t border-slate-100 dark:border-slate-800 mt-4 pt-6">
          <p className="text-sm text-slate-500">
            还没有账号？{' '}
            <Link href="/auth/signup" className="text-primary-600 hover:underline font-bold">
              立即注册
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
