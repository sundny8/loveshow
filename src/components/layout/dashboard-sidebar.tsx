'use client';

import { Link } from '@/i18n/routing';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  User,
  CreditCard,
  Settings,
  Shield,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';

export function DashboardSidebar() {
  const t = useTranslations('dashboard');
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { key: 'dashboard', label: t('sidebar.overview'), href: '/dashboard', icon: LayoutDashboard },
    { key: 'profile', label: t('sidebar.profile'), href: '/dashboard/profile', icon: User },
    { key: 'billing', label: t('sidebar.billing'), href: '/dashboard/billing', icon: CreditCard },
    { key: 'security', label: t('sidebar.security'), href: '/dashboard/security', icon: Shield },
    { key: 'settings', label: t('sidebar.settings'), href: '/dashboard/settings', icon: Settings },
  ];

  // Remove locale prefix from pathname for comparison
  const cleanPathname = pathname.replace(/^\/(zh|en)/, '') || '/dashboard';

  return (
    <aside
      className={cn(
        'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex flex-col h-fit sticky top-24 transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Sidebar Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
        {!collapsed && (
          <span className="font-semibold text-slate-900 dark:text-white">{t('sidebar.account')}</span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500",
            collapsed && "mx-auto"
          )}
        >
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = cleanPathname === item.href || 
            (item.href !== '/dashboard' && cleanPathname.startsWith(item.href));
          
          return (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                isActive
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700',
                collapsed && 'justify-center'
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && (
                <span className="font-medium flex-1">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
