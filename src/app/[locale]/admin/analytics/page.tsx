'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  TrendingUp, 
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Loader2,
  Eye,
  Clock,
  Globe,
} from 'lucide-react';

interface Stats {
  users: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    growth: string;
    admins: number;
    verified: number;
  };
}

interface DailyStat {
  day: string;
  date: string;
  users: number;
}

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
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

  const maxUsers = Math.max(...dailyStats.map(d => d.users), 1);
  const totalWeekUsers = dailyStats.reduce((sum, d) => sum + d.users, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-slate-500">Monitor your application&apos;s performance and user activity.</p>
        </div>
        <Button variant="outline" onClick={fetchStats}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Users</p>
                <p className="text-2xl font-bold">{stats?.users.total || 0}</p>
              </div>
              <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30">
                <Users className="h-5 w-5 text-primary-600" />
              </div>
            </div>
            <div className="flex items-center mt-2">
              {Number(stats?.users.growth) >= 0 ? (
                <ArrowUpRight className="h-4 w-4 text-green-500" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-red-500" />
              )}
              <span className={`text-sm ${Number(stats?.users.growth) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {stats?.users.growth}% from last month
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Weekly Signups</p>
                <p className="text-2xl font-bold">{totalWeekUsers}</p>
              </div>
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <p className="text-sm text-slate-500 mt-2">Past 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Verified Rate</p>
                <p className="text-2xl font-bold">
                  {stats?.users.total ? Math.round((stats.users.verified / stats.users.total) * 100) : 0}%
                </p>
              </div>
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Eye className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <p className="text-sm text-slate-500 mt-2">{stats?.users.verified || 0} verified users</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">This Month</p>
                <p className="text-2xl font-bold">{stats?.users.thisMonth || 0}</p>
              </div>
              <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
            </div>
            <p className="text-sm text-slate-500 mt-2">Last month: {stats?.users.lastMonth || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* User Registration Trend */}
        <Card>
          <CardHeader>
            <CardTitle>User Registration Trend</CardTitle>
            <CardDescription>Daily new user registrations (past 7 days)</CardDescription>
          </CardHeader>
          <CardContent>
            {dailyStats.length > 0 ? (
              <div className="flex items-end justify-between gap-2 h-64">
                {dailyStats.map((day) => (
                  <div key={day.date} className="flex flex-col items-center flex-1">
                    <span className="text-xs text-slate-500 mb-1">{day.users}</span>
                    <div
                      className="w-full bg-gradient-to-t from-primary-600 to-primary-400 rounded-t hover:from-primary-700 hover:to-primary-500 transition-colors cursor-pointer"
                      style={{ height: `${Math.max((day.users / maxUsers) * 200, 4)}px` }}
                    />
                    <span className="text-sm text-slate-600 dark:text-slate-400 mt-2">{day.day}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-slate-400">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>User Distribution</CardTitle>
            <CardDescription>Breakdown by role and verification status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Verified Users</span>
                  <span className="text-sm text-slate-500">
                    {stats?.users.verified || 0} / {stats?.users.total || 0}
                  </span>
                </div>
                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 rounded-full"
                    style={{ 
                      width: `${stats?.users.total ? (stats.users.verified / stats.users.total) * 100 : 0}%` 
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Admin Users</span>
                  <span className="text-sm text-slate-500">
                    {stats?.users.admins || 0} / {stats?.users.total || 0}
                  </span>
                </div>
                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-purple-500 rounded-full"
                    style={{ 
                      width: `${stats?.users.total ? (stats.users.admins / stats.users.total) * 100 : 0}%` 
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Regular Members</span>
                  <span className="text-sm text-slate-500">
                    {(stats?.users.total || 0) - (stats?.users.admins || 0)} / {stats?.users.total || 0}
                  </span>
                </div>
                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full"
                    style={{ 
                      width: `${stats?.users.total ? ((stats.users.total - stats.users.admins) / stats.users.total) * 100 : 0}%` 
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
              <h4 className="text-sm font-medium mb-4">Monthly Comparison</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800">
                  <p className="text-xs text-slate-500">This Month</p>
                  <p className="text-xl font-bold">{stats?.users.thisMonth || 0}</p>
                </div>
                <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800">
                  <p className="text-xs text-slate-500">Last Month</p>
                  <p className="text-xl font-bold">{stats?.users.lastMonth || 0}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Globe className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Want More Analytics?</h3>
              <p className="text-sm text-slate-500 mb-3">
                For advanced analytics like page views, user sessions, and event tracking, 
                connect your PostHog account in the environment variables.
              </p>
              <p className="text-xs text-slate-400">
                Set <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">NEXT_PUBLIC_POSTHOG_KEY</code> and <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">NEXT_PUBLIC_POSTHOG_HOST</code> in your .env.local file.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
