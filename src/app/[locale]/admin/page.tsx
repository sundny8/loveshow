'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  UserPlus,
  RefreshCw,
  Loader2,
  Shield,
  CheckCircle,
  CreditCard,
} from 'lucide-react';
import Link from 'next/link';

interface Stats {
  users: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    growth: string;
    admins: number;
    verified: number;
  };
  subscriptions: {
    total: number;
    free: number;
    starter: number;
    monthly: number;
    monthly_pro: number;
  };
}

interface RecentUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

interface DailyStat {
  day: string;
  date: string;
  users: number;
}

const roleColors: Record<string, string> = {
  ADMIN: 'bg-blue-100 text-blue-700',
  USER: 'bg-slate-100 text-slate-700',
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setRecentUsers(data.recentUsers);
        setDailyStats(data.dailyStats);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (hours < 1) return '刚刚';
    if (hours < 24) return `${hours} 小时前`;
    if (days < 7) return `${days} 天前`;
    return date.toLocaleDateString('zh-CN');
  };

  const maxUsers = Math.max(...dailyStats.map(d => d.users), 1);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">管理仪表盘</h1>
          <p className="text-slate-500">欢迎回来，这里是系统概览</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchStats}>
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新
          </Button>
          <Link href="/admin/users">
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              管理用户
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500">总用户数</p>
                <p className="text-2xl font-bold mt-1">{stats?.users.total || 0}</p>
                <div className="flex items-center mt-2">
                  {Number(stats?.users.growth) >= 0 ? (
                    <ArrowUpRight className="h-4 w-4 text-green-500" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-red-500" />
                  )}
                  <span className={`text-sm font-medium ${
                    Number(stats?.users.growth) >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {stats?.users.growth}%
                  </span>
                  <span className="text-xs text-slate-500 ml-1">vs 上月</span>
                </div>
              </div>
              <div className="p-2 rounded-lg bg-violet-100">
                <Users className="h-5 w-5 text-violet-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500">本月新增</p>
                <p className="text-2xl font-bold mt-1">{stats?.users.thisMonth || 0}</p>
                <div className="flex items-center mt-2">
                  <span className="text-xs text-slate-500">上月: {stats?.users.lastMonth || 0}</span>
                </div>
              </div>
              <div className="p-2 rounded-lg bg-green-100">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500">已验证用户</p>
                <p className="text-2xl font-bold mt-1">{stats?.users.verified || 0}</p>
                <div className="flex items-center mt-2">
                  <span className="text-xs text-slate-500">
                    占总用户 {stats?.users.total ? Math.round((stats.users.verified / stats.users.total) * 100) : 0}%
                  </span>
                </div>
              </div>
              <div className="p-2 rounded-lg bg-blue-100">
                <CheckCircle className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500">管理员</p>
                <p className="text-2xl font-bold mt-1">{stats?.users.admins || 0}</p>
                <div className="flex items-center mt-2">
                  <span className="text-xs text-slate-500">管理角色</span>
                </div>
              </div>
              <div className="p-2 rounded-lg bg-purple-100">
                <Shield className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* User Registration Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>用户注册趋势</CardTitle>
            <CardDescription>过去 7 天的每日新增用户数</CardDescription>
          </CardHeader>
          <CardContent>
            {dailyStats.length > 0 ? (
              <div className="flex items-end justify-between gap-2 h-48">
                {dailyStats.map((day) => (
                  <div key={day.date} className="flex flex-col items-center flex-1">
                    <span className="text-xs text-slate-500 mb-1">{day.users}</span>
                    <div
                      className="w-full bg-gradient-to-t from-violet-600 to-violet-400 rounded-t hover:from-violet-700 hover:to-violet-500 transition-colors cursor-pointer"
                      style={{ height: `${Math.max((day.users / maxUsers) * 150, 4)}px` }}
                    />
                    <span className="text-sm text-slate-600 mt-2">{day.day}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 text-slate-400">
                暂无数据
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle>订阅统计</CardTitle>
            <CardDescription>用户订阅计划分布</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-green-50">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium">免费用户</span>
              </div>
              <span className="font-bold text-green-600">{stats?.subscriptions.free || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                <span className="text-sm font-medium">入门版</span>
              </div>
              <span className="font-bold text-blue-600">{stats?.subscriptions.starter || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-indigo-50">
              <div className="flex items-center gap-3">
                <ArrowUpRight className="h-5 w-5 text-indigo-500" />
                <span className="text-sm font-medium">月订阅</span>
              </div>
              <span className="font-bold text-indigo-600">{stats?.subscriptions.monthly || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50">
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-purple-500" />
                <span className="text-sm font-medium">月订阅 Pro</span>
              </div>
              <span className="font-bold text-purple-600">{stats?.subscriptions.monthly_pro || 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Users */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>最近注册用户</CardTitle>
            <CardDescription>最新加入的用户</CardDescription>
          </div>
          <Link href="/admin/users">
            <Button variant="outline" size="sm">查看全部</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {recentUsers.length > 0 ? (
            <div className="space-y-4">
              {recentUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-100 to-fuchsia-100 flex items-center justify-center text-sm font-semibold text-violet-600">
                      {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-slate-500">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-1 rounded-full capitalize ${roleColors[user.role] || 'bg-gray-100 text-gray-700'}`}>
                      {user.role === 'ADMIN' ? '管理员' : '用户'}
                    </span>
                    <span className="text-sm text-slate-500">{formatDate(user.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              暂无用户
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
