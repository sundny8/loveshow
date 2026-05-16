'use client';

import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { LocaleToggle } from '@/components/locale-toggle';
import { Menu, X, Camera, User, LogOut, Coins, Settings, RefreshCw } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useSession, signOut } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

export function Header() {
  const t = useTranslations('header');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingRole, setIsCheckingRole] = useState(true);
  const [userPoints, setUserPoints] = useState<number | null>(null);
  const [refreshingPoints, setRefreshingPoints] = useState(false);

  // Fetch user points
  async function fetchPoints() {
    if (!session) return;
    try {
      const res = await fetch('/api/user/points');
      if (res.ok) {
        const data = await res.json();
        setUserPoints(data.points);
      }
    } catch (err) {
      console.error('Failed to fetch points:', err);
    }
  }

  // Check user role
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
          setIsAdmin(data.role === 'ADMIN' || data.role === 'OWNER');
        }
      } catch (error) {
        console.error('Failed to check role:', error);
      } finally {
        setIsCheckingRole(false);
      }
    }

    checkRole();
    fetchPoints();
  }, [session]);

  const handleRefreshPoints = async () => {
    setRefreshingPoints(true);
    await fetchPoints();
    setRefreshingPoints(false);
  };

  const handleSignOut = async () => {
    await signOut();
    setIsUserMenuOpen(false);
    router.push('/');
  };

  // Close user menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-loveshow-gradient shadow-md shadow-violet-500/20">
              <Camera className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">LoveShow</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {/* 证件照工作台 — 始终显示，排第一 */}
            <Link
              href="/workspace"
              className="text-sm font-medium text-slate-600 hover:text-violet-600 hover:font-semibold dark:text-slate-300 dark:hover:text-violet-400 dark:hover:font-semibold transition-all"
            >
              {t('nav.workspace')}
            </Link>
            <Link
              href="/#engines"
              className="text-sm font-medium text-slate-600 hover:text-violet-600 hover:font-semibold dark:text-slate-300 dark:hover:text-violet-400 dark:hover:font-semibold transition-all"
            >
              {t('nav.engines')}
            </Link>
            <Link
              href="/gallery"
              className="text-sm font-medium text-slate-600 hover:text-violet-600 hover:font-semibold dark:text-slate-300 dark:hover:text-violet-400 dark:hover:font-semibold transition-all"
            >
              {t('nav.gallery')}
            </Link>
            <Link
              href="/#pricing"
              className="text-sm font-medium text-slate-600 hover:text-violet-600 hover:font-semibold dark:text-slate-300 dark:hover:text-violet-400 dark:hover:font-semibold transition-all"
            >
              {t('nav.pricing')}
            </Link>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-3">
            {session && userPoints !== null && (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 mr-2 border border-yellow-200 dark:border-yellow-800/50">
                 <Coins className="h-4 w-4" />
                 <span className="text-sm font-semibold tracking-tight">{userPoints}</span>
                 <button
                   onClick={handleRefreshPoints}
                   disabled={refreshingPoints}
                   className="ml-1 p-0.5 hover:bg-yellow-200 dark:hover:bg-yellow-800/50 rounded transition-colors"
                   title="刷新积分"
                 >
                   <RefreshCw className={`h-3 w-3 ${refreshingPoints ? 'animate-spin' : ''}`} />
                 </button>
              </div>
            )}
            <LocaleToggle />
            <ThemeToggle />
            {isPending ? (
              <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
            ) : session ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="h-8 w-8 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                    <User className="h-4 w-4 text-violet-600" />
                  </div>
                  <span className="text-sm font-medium max-w-[120px] truncate">
                    {session.user?.name || session.user?.email?.split('@')[0]}
                  </span>
                </button>
                
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-2">
                    <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-700">
                      <p className="text-sm font-medium truncate">{session.user?.name || 'User'}</p>
                      <p className="text-xs text-slate-500 truncate">{session.user?.email}</p>
                    </div>
                    <Link
                      href="/dashboard"
                      className="flex items-center px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <User className="h-4 w-4 mr-2" />
                      {t('user.profile')}
                    </Link>
                    <Link
                      href="/dashboard/billing"
                      className="flex items-center px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <Coins className="h-4 w-4 mr-2" />
                      {t('user.billing')}
                    </Link>
                    {!isCheckingRole && isAdmin && (
                      <Link
                        href="/admin"
                        className="flex items-center px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        {t('user.admin')}
                      </Link>
                    )}
                    <button
                      onClick={handleSignOut}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-500 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      {t('user.signOut')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/auth/signin">
                  <Button variant="ghost" size="sm">
                    {t('auth.signIn')}
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button size="sm" className="btn-gradient text-white border-0">{t('auth.getStarted')}</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center space-x-2">
            <LocaleToggle />
            <ThemeToggle />
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-200 dark:border-slate-700">
            <nav className="flex flex-col space-y-3">
              {/* 证件照工作台 — 始终显示，排第一 */}
              <Link
                href="/workspace"
                className="text-sm font-semibold text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('nav.workspace')}
              </Link>
              <Link
                href="/#engines"
                className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('nav.engines')}
              </Link>
              <Link
                href="/gallery"
                className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('nav.gallery')}
              </Link>
              {!session && (
                <Link
                  href="/#pricing"
                  className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {t('nav.pricing')}
                </Link>
              )}
              {/* Language selector for mobile */}
              <div className="py-2 border-t border-slate-200 dark:border-slate-700">
                <LocaleToggle />
              </div>
              <div className="pt-3 flex flex-col space-y-2">
                {session ? (
                  <>
                    <div className="flex items-center space-x-2 px-2 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <div className="h-8 w-8 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                        <User className="h-4 w-4 text-violet-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{session.user?.name || 'User'}</p>
                        <p className="text-xs text-slate-500 truncate">{session.user?.email}</p>
                      </div>
                    </div>
                    <Link href="/dashboard" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="outline" className="w-full">
                        {t('user.profile')}
                      </Button>
                    </Link>
                    <Link href="/dashboard/billing" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="outline" className="w-full">
                        {t('user.billing')}
                      </Button>
                    </Link>
                    {!isCheckingRole && isAdmin && (
                      <Link href="/admin" onClick={() => setIsMenuOpen(false)}>
                        <Button variant="outline" className="w-full">
                          <Settings className="h-4 w-4 mr-2" />
                          {t('user.admin')}
                        </Button>
                      </Link>
                    )}
                    <Button 
                      variant="outline" 
                      className="w-full text-red-500"
                      onClick={() => {
                        handleSignOut();
                        setIsMenuOpen(false);
                      }}
                    >
                      {t('user.signOut')}
                    </Button>
                  </>
                ) : (
                  <>
                    <Link href="/auth/signin" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="outline" className="w-full">
                        {t('auth.signIn')}
                      </Button>
                    </Link>
                    <Link href="/auth/signup" onClick={() => setIsMenuOpen(false)}>
                      <Button className="w-full btn-gradient text-white border-0">{t('auth.getStarted')}</Button>
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
