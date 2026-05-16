'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Settings,
  FileText,
  ShoppingCart,
  Shield,
  ChevronLeft,
  ChevronRight,
  Camera,
  ExternalLink,
  Home,
  Image,
  Coins,
  Ticket,
} from 'lucide-react';
import { useState } from 'react';

export function AdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const t = useTranslations('admin');

  const navSections = [
    {
      title: t('overview'),
      items: [
        { key: 'dashboard', href: '/admin', icon: LayoutDashboard, label: t('dashboard') },
        { key: 'analytics', href: '/admin/analytics', icon: BarChart3, label: t('analytics') },
      ],
    },
    {
      title: t('management'),
      items: [
        { key: 'users', href: '/admin/users', icon: Users, label: t('users') },
        { key: 'tasks', href: '/admin/tasks', icon: Image, label: t('tasks') },
        { key: 'orders', href: '/admin/orders', icon: ShoppingCart, label: t('orders') },
        { key: 'points', href: '/admin/point-usage', icon: Coins, label: t('points') },
        { key: 'redeemCodes', href: '/admin/redeem-codes', icon: Ticket, label: t('redeemCodes') },
        { key: 'content', href: '/admin/content', icon: FileText, label: t('content') },
      ],
    },
    {
      title: t('system'),
      items: [
        { key: 'roles', href: '/admin/roles', icon: Shield, label: t('roles') },
        { key: 'settings', href: '/admin/settings', icon: Settings, label: t('settings') },
      ],
    },
  ];

  return (
    <aside
      className={cn(
        'bg-slate-900 text-white flex flex-col transition-all duration-300 min-h-screen',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
        {!collapsed && (
          <Link href="/admin" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-loveshow-gradient flex items-center justify-center">
              <Camera className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold">LoveShow</span>
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "p-1.5 rounded-lg hover:bg-slate-800 text-slate-400",
            collapsed && "mx-auto"
          )}
        >
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {navSections.map((section) => (
          <div key={section.title} className="mb-6">
            {!collapsed && (
              <p className="px-4 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {section.title}
              </p>
            )}
            <div className="space-y-1 px-2">
              {section.items.map((item) => {
                const isActive = pathname === item.href || 
                  (item.href !== '/admin' && pathname.startsWith(item.href));
                
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                      isActive
                        ? 'bg-violet-600 text-white'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white',
                      collapsed && 'justify-center'
                    )}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    {!collapsed && (
                       <span className="font-medium">{item.label}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="p-4 border-t border-slate-800">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors mb-3"
          >
            <Home className="h-4 w-4" />
            <span className="text-sm">{t('backToSite')}</span>
            <ExternalLink className="h-3 w-3 ml-auto" />
          </Link>
          <div className="p-3 rounded-lg bg-slate-800">
            <p className="text-xs font-medium text-violet-400 mb-1">LoveShow Pro</p>
            <p className="text-xs text-slate-500">{t('panel')}</p>
          </div>
        </div>
      )}
      {collapsed && (
        <div className="p-2 border-t border-slate-800">
          <Link
            href="/"
            className="flex items-center justify-center p-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            title={t('backToSite')}
          >
            <Home className="h-5 w-5" />
          </Link>
        </div>
      )}
    </aside>
  );
}
