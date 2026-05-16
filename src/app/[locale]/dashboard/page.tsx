'use client';

import { useSession } from '@/lib/auth-client';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { User, Settings, CreditCard, Shield, Bell, Key } from 'lucide-react';

export default function DashboardPage() {
  const { data: session, isPending } = useSession();
  const t = useTranslations('dashboard');

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
        <h2 className="text-2xl font-bold mb-4">{t('signIn.title')}</h2>
        <p className="text-slate-600 dark:text-slate-300 mb-6">
          {t('signIn.description')}
        </p>
        <Link href="/auth/signin">
          <Button>{t('signIn.button')}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* User Profile Header */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-6">
            <Avatar
              src={session.user?.image}
              fallback={session.user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
              size="xl"
            />
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{session.user?.name || t('profile.user')}</h1>
              <p className="text-slate-500">{session.user?.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-slate-500">{t('profile.memberSince')}</span>
              </div>
            </div>
            <Link href="/dashboard/profile">
              <Button variant="outline">{t('profile.editProfile')}</Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Quick Links Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link href="/dashboard/profile">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-primary-100 dark:bg-primary-900/30">
                  <User className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold">{t('profile.title')}</h3>
                  <p className="text-sm text-slate-500 mt-1">{t('profile.subtitle')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/billing">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <CreditCard className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold">{t('billing.title')}</h3>
                  <p className="text-sm text-slate-500 mt-1">{t('billing.subtitle')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/settings">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800">
                  <Settings className="h-6 w-6 text-slate-600" />
                </div>
                <div>
                  <h3 className="font-semibold">{t('settings.title')}</h3>
                  <p className="text-sm text-slate-500 mt-1">{t('settings.subtitle')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold">{t('security.title')}</h3>
                <p className="text-sm text-slate-500 mt-1">{t('security.subtitle')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                <Bell className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold">{t('notifications.title')}</h3>
                <p className="text-sm text-slate-500 mt-1">{t('notifications.subtitle')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Key className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold">{t('apiKeys.title')}</h3>
                <p className="text-sm text-slate-500 mt-1">{t('apiKeys.subtitle')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{t('activity.title')}</CardTitle>
          <CardDescription>{t('activity.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { action: t('activity.passwordChanged'), time: t('activity.hoursAgo', { count: 2 }), icon: Key },
              { action: t('activity.newDevice'), time: t('activity.daysAgo', { count: 1 }), icon: Shield },
              { action: t('activity.profileUpdated'), time: t('activity.daysAgo', { count: 3 }), icon: User },
              { action: t('activity.subscriptionRenewed'), time: t('activity.weeksAgo', { count: 1 }), icon: CreditCard },
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <div className="p-2 rounded-lg bg-white dark:bg-slate-800">
                  <item.icon className="h-4 w-4 text-slate-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.action}</p>
                </div>
                <span className="text-xs text-slate-500">{item.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
