'use client';

import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { LocaleToggle } from '@/components/locale-toggle';
import { useSession } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Bell, Search, ShieldAlert, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

type UserRole = string | null;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, isPending } = useSession();
  const [role, setRole] = useState<UserRole>(null);
  const [isCheckingRole, setIsCheckingRole] = useState(true);

  useEffect(() => {
    async function checkRole() {
      if (!session) {
        setIsCheckingRole(false);
        return;
      }

      try {
        const res = await fetch('/api/user/role');
        if (res.ok) {
          const data = await res.json();
          setRole(data.role);
        }
      } catch (error) {
        console.error('Failed to check role:', error);
      } finally {
        setIsCheckingRole(false);
      }
    }

    if (session) {
      checkRole();
    } else if (!isPending) {
      setIsCheckingRole(false);
    }
  }, [session, isPending]);

  // Loading state
  if (isPending || isCheckingRole) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600 mb-4" />
        <p className="text-slate-500">正在验证访问权限...</p>
      </div>
    );
  }

  // Not logged in
  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <ShieldAlert className="h-16 w-16 text-slate-400 mb-4" />
        <h2 className="text-2xl font-bold mb-2">需要访问权限</h2>
        <p className="text-slate-600 mb-6">
          请先登录以访问管理后台
        </p>
        <Link href="/auth/signin">
          <Button>登录</Button>
        </Link>
      </div>
    );
  }

  // Check if user has ADMIN or OWNER role
  const isAdmin = role === 'ADMIN' || role === 'OWNER';

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <ShieldAlert className="h-16 w-16 text-red-400 mb-4" />
        <h2 className="text-2xl font-bold mb-2">拒绝访问</h2>
        <p className="text-slate-600 mb-2">
          您没有管理员权限
        </p>
        <p className="text-sm text-slate-500 mb-6">
          只有管理员才能访问此页面
        </p>
        <div className="flex gap-3">
          <Link href="/dashboard">
            <Button variant="outline">前往仪表盘</Button>
          </Link>
          <Link href="/">
            <Button>返回首页</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-100">
      {/* Left Sidebar */}
      <AdminSidebar />
      
      {/* Right Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="搜索..."
                className="pl-10 pr-4 py-2 w-64 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <LocaleToggle />
            <ThemeToggle />
            <button className="relative p-2 rounded-lg hover:bg-slate-100">
              <Bell className="h-5 w-5 text-slate-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-loveshow-gradient flex items-center justify-center text-white text-sm font-medium">
                {session.user?.name?.charAt(0) || 'A'}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium">{session.user?.name || '管理员'}</p>
                <p className="text-xs text-slate-500">管理员</p>
              </div>
            </div>
          </div>
        </header>
        
        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
