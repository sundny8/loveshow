'use client';

import { useSession } from '@/lib/auth-client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, Users, Eye, MousePointer, TrendingUp, Clock } from 'lucide-react';
import Link from 'next/link';

// Sample analytics data (in production, this would come from Posthog API)
const analyticsData = {
  pageViews: 12543,
  uniqueVisitors: 4521,
  avgSessionDuration: '3m 24s',
  bounceRate: '42%',
  topPages: [
    { path: '/', views: 4521, change: '+12%' },
    { path: '/pricing', views: 2341, change: '+8%' },
    { path: '/blog', views: 1892, change: '+15%' },
    { path: '/docs', views: 1456, change: '+5%' },
    { path: '/auth/signup', views: 987, change: '+22%' },
  ],
  events: [
    { name: 'button_clicked', count: 8934, change: '+18%' },
    { name: 'form_submitted', count: 2341, change: '+12%' },
    { name: 'page_scrolled', count: 15678, change: '+8%' },
    { name: 'link_clicked', count: 6789, change: '+15%' },
  ],
  dailyStats: [
    { date: 'Mon', views: 1234 },
    { date: 'Tue', views: 1567 },
    { date: 'Wed', views: 1890 },
    { date: 'Thu', views: 2100 },
    { date: 'Fri', views: 1987 },
    { date: 'Sat', views: 1456 },
    { date: 'Sun', views: 1309 },
  ],
};

export default function AnalyticsPage() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold mb-4">Please Sign In</h2>
        <p className="text-slate-600 dark:text-slate-300 mb-6">
          You need to be signed in to view analytics
        </p>
        <Link href="/auth/signin">
          <Button>Sign In</Button>
        </Link>
      </div>
    );
  }

  const maxViews = Math.max(...analyticsData.dailyStats.map(d => d.views));

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-3xl font-bold">Analytics</h1>
          <span className="text-xs bg-gradient-to-r from-primary-600 to-secondary-600 text-white px-2 py-0.5 rounded font-semibold">PRO</span>
        </div>
        <p className="text-slate-600 dark:text-slate-300">
          Track your product usage and user behavior
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Page Views</p>
                <p className="text-2xl font-bold">{analyticsData.pageViews.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-full bg-primary-100 dark:bg-primary-900/30">
                <Eye className="h-5 w-5 text-primary-600" />
              </div>
            </div>
            <p className="text-xs text-green-600 mt-2">+12% from last week</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Unique Visitors</p>
                <p className="text-2xl font-bold">{analyticsData.uniqueVisitors.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-full bg-secondary-100 dark:bg-secondary-900/30">
                <Users className="h-5 w-5 text-secondary-600" />
              </div>
            </div>
            <p className="text-xs text-green-600 mt-2">+8% from last week</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Avg. Session</p>
                <p className="text-2xl font-bold">{analyticsData.avgSessionDuration}</p>
              </div>
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
                <Clock className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <p className="text-xs text-green-600 mt-2">+5% from last week</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Bounce Rate</p>
                <p className="text-2xl font-bold">{analyticsData.bounceRate}</p>
              </div>
              <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-900/30">
                <TrendingUp className="h-5 w-5 text-orange-600" />
              </div>
            </div>
            <p className="text-xs text-red-600 mt-2">-3% from last week</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Weekly Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Weekly Overview
            </CardTitle>
            <CardDescription>Page views over the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between gap-2 h-40">
              {analyticsData.dailyStats.map((day) => (
                <div key={day.date} className="flex flex-col items-center flex-1">
                  <div
                    className="w-full bg-gradient-to-t from-primary-500 to-primary-400 rounded-t"
                    style={{ height: `${(day.views / maxViews) * 100}%` }}
                  />
                  <span className="text-xs text-slate-500 mt-2">{day.date}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MousePointer className="h-5 w-5" />
              Top Events
            </CardTitle>
            <CardDescription>Most triggered events this week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.events.map((event) => (
                <div key={event.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary-500" />
                    <span className="text-sm font-medium">{event.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-500">{event.count.toLocaleString()}</span>
                    <span className="text-xs text-green-600">{event.change}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Pages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Top Pages
          </CardTitle>
          <CardDescription>Most visited pages this week</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Page</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">Views</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">Change</th>
                </tr>
              </thead>
              <tbody>
                {analyticsData.topPages.map((page) => (
                  <tr key={page.path} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="py-3 px-4">
                      <span className="text-sm font-medium">{page.path}</span>
                    </td>
                    <td className="text-right py-3 px-4">
                      <span className="text-sm text-slate-600 dark:text-slate-300">{page.views.toLocaleString()}</span>
                    </td>
                    <td className="text-right py-3 px-4">
                      <span className="text-xs text-green-600">{page.change}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
