'use client';

import { useState } from 'react';
import { useSession, authClient } from '@/lib/auth-client';
import { useTranslations } from 'next-intl';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Key, Smartphone, Monitor, Globe, Clock, AlertTriangle, Loader2 } from 'lucide-react';
import { Link } from '@/i18n/routing';

export default function SecurityPage() {
  const { data: session, isPending } = useSession();
  const t = useTranslations('dashboard.securityPage');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const activeSessions = [
    { device: 'MacBook Pro', browser: 'Chrome', location: t('sessions.locationSF'), lastActive: t('sessions.now'), current: true },
    { device: 'iPhone 14', browser: 'Safari', location: t('sessions.locationSF'), lastActive: t('sessions.hoursAgo', { count: 2 }), current: false },
    { device: 'Windows PC', browser: 'Firefox', location: t('sessions.locationNY'), lastActive: t('sessions.dayAgo', { count: 1 }), current: false },
  ];

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

  const resetForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    if (!currentPassword) {
      setMessage(t('password.validation.currentRequired'));
      setMessageType('error');
      return;
    }
    if (newPassword.length < 8) {
      setMessage(t('password.validation.tooShort'));
      setMessageType('error');
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage(t('password.validation.mismatch'));
      setMessageType('error');
      return;
    }

    setIsChangingPassword(true);
    try {
      const { error } = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: false,
      });
      if (error) {
        setMessage(error.message || t('password.failed'));
        setMessageType('error');
      } else {
        setMessage(t('password.success'));
        setMessageType('success');
        setShowPasswordForm(false);
        resetForm();
      }
    } catch {
      setMessage(t('password.failed'));
      setMessageType('error');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">{t('title')}</h1>
        <p className="text-slate-600 dark:text-slate-300">
          {t('subtitle')}
        </p>
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-sm mb-6 ${
          messageType === 'success'
            ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400'
            : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
        }`}>
          {message}
        </div>
      )}

      {/* Password */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            {t('password.title')}
          </CardTitle>
          <CardDescription>{t('password.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          {!showPasswordForm ? (
            <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-700">
              <div>
                <p className="font-medium">{t('password.title')}</p>
                <p className="text-sm text-slate-500">{t('password.lastChanged', { count: 30 })}</p>
              </div>
              <Button variant="outline" onClick={() => { setShowPasswordForm(true); setMessage(''); }}>
                {t('password.change')}
              </Button>
            </div>
          ) : (
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">{t('password.current')}</label>
                <Input
                  type="password"
                  placeholder={t('password.currentPlaceholder')}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">{t('password.new')}</label>
                <Input
                  type="password"
                  placeholder={t('password.newPlaceholder')}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">{t('password.confirm')}</label>
                <Input
                  type="password"
                  placeholder={t('password.confirmPlaceholder')}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              <div className="flex gap-3">
                <Button type="submit" disabled={isChangingPassword}>
                  {isChangingPassword && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {t('password.update')}
                </Button>
                <Button type="button" variant="outline" onClick={() => { setShowPasswordForm(false); resetForm(); setMessage(''); }}>
                  {t('password.cancel')}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            {t('sessions.title')}
          </CardTitle>
          <CardDescription>{t('sessions.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activeSessions.map((s, index) => (
              <div key={index} className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                    {s.device.includes('iPhone') ? (
                      <Smartphone className="h-5 w-5 text-slate-500" />
                    ) : (
                      <Monitor className="h-5 w-5 text-slate-500" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{s.device}</p>
                      {s.current && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          {t('sessions.current')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Globe className="h-3 w-3" />
                      <span>{s.location}</span>
                      <span>•</span>
                      <span>{s.browser}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-sm text-slate-500">
                      <Clock className="h-3 w-3" />
                      <span>{s.lastActive}</span>
                    </div>
                  </div>
                  {!s.current && (
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                      {t('sessions.revoke')}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <Button variant="outline" className="w-full mt-4 text-red-600 hover:text-red-700">
            <AlertTriangle className="h-4 w-4 mr-2" />
            {t('sessions.signOutAll')}
          </Button>
        </CardContent>
      </Card>

      {/* Account Deletion */}
      <Card className="border-red-200 dark:border-red-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            {t('danger.title')}
          </CardTitle>
          <CardDescription>{t('danger.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10">
            <div>
              <p className="font-medium text-red-700 dark:text-red-400">{t('danger.deleteTitle')}</p>
              <p className="text-sm text-red-600 dark:text-red-500">{t('danger.deleteDescription')}</p>
            </div>
            <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-50">
              {t('danger.deleteButton')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
