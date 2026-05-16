'use client';

import { useState, useEffect } from 'react';
import { useSession } from '@/lib/auth-client';
import { useTranslations } from 'next-intl';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { User, Mail, Camera, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const { data: session, isPending } = useSession();
  const t = useTranslations('dashboard.profile');
  
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (session?.user?.name && !initialized) {
      setName(session.user.name);
      setInitialized(true);
    }
  }, [session, initialized]);

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage('');

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessage(t('updateSuccess'));
    } catch {
      setMessage(t('updateFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t('title')}</h1>
        <p className="text-slate-600 dark:text-slate-300">
          {t('subtitle')}
        </p>
      </div>

      {/* Avatar Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t('profilePicture')}</CardTitle>
          <CardDescription>{t('updatePicture')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar
                src={session.user?.image}
                fallback={session.user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                size="xl"
              />
              <button className="absolute bottom-0 right-0 p-2 rounded-full bg-primary-600 text-white hover:bg-primary-700 transition-colors">
                <Camera className="h-4 w-4" />
              </button>
            </div>
            <div>
              <p className="font-medium">{session.user?.name || t('user')}</p>
              <p className="text-sm text-slate-500">{session.user?.email}</p>
              <Button variant="outline" size="sm" className="mt-2">
                {t('changePicture')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Form */}
      <Card>
        <CardHeader>
          <CardTitle>{t('personalInfo')}</CardTitle>
          <CardDescription>{t('updateDetails')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            {message && (
              <div className={`p-3 rounded-lg text-sm ${
                message.includes('success') || message.includes('成功')
                  ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                  : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
              }`}>
                {message}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                {t('name')}
              </label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {t('email')}
              </label>
              <Input
                id="email"
                type="email"
                value={session.user?.email || ''}
                disabled
                className="bg-slate-50 dark:bg-slate-800"
              />
              <p className="text-xs text-slate-500">
                {t('emailCannotChange')}
              </p>
            </div>

            <div className="pt-4">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('saving')}
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {t('saveChanges')}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="mt-6 border-red-200 dark:border-red-800">
        <CardHeader>
          <CardTitle className="text-red-600">{t('dangerZone')}</CardTitle>
          <CardDescription>{t('irreversible')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{t('deleteAccount')}</p>
              <p className="text-sm text-slate-500">
                {t('deleteWarning')}
              </p>
            </div>
            <Button variant="outline" className="text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20">
              {t('deleteAccount')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
