'use client';

import { useState } from 'react';
import { useSession } from '@/lib/auth-client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, Mail, Shield, Megaphone, Package, CreditCard, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';

const notificationSettings = [
  {
    category: 'Account',
    items: [
      { key: 'security_alerts', label: 'Security Alerts', description: 'Get notified about suspicious activity', icon: Shield, defaultOn: true },
      { key: 'login_alerts', label: 'Login Notifications', description: 'Receive alerts for new login attempts', icon: Bell, defaultOn: true },
    ],
  },
  {
    category: 'Billing',
    items: [
      { key: 'payment_reminders', label: 'Payment Reminders', description: 'Reminders before subscription renewal', icon: CreditCard, defaultOn: true },
      { key: 'invoice_notifications', label: 'Invoice Notifications', description: 'Get notified when invoices are generated', icon: Mail, defaultOn: true },
    ],
  },
  {
    category: 'Product',
    items: [
      { key: 'product_updates', label: 'Product Updates', description: 'New features and improvements', icon: Package, defaultOn: true },
      { key: 'tips_tutorials', label: 'Tips & Tutorials', description: 'Helpful tips to get the most out of the product', icon: Megaphone, defaultOn: false },
    ],
  },
  {
    category: 'Marketing',
    items: [
      { key: 'newsletter', label: 'Newsletter', description: 'Monthly newsletter with news and updates', icon: Mail, defaultOn: false },
      { key: 'promotions', label: 'Promotions & Offers', description: 'Special offers and discounts', icon: Megaphone, defaultOn: false },
    ],
  },
];

export default function NotificationsPage() {
  const { data: session, isPending } = useSession();
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  
  const [settings, setSettings] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    notificationSettings.forEach(category => {
      category.items.forEach(item => {
        initial[item.key] = item.defaultOn;
      });
    });
    return initial;
  });

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
          You need to be signed in to manage notifications
        </p>
        <Link href="/auth/signin">
          <Button>Sign In</Button>
        </Link>
      </div>
    );
  }

  const handleToggle = (key: string) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage('');

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessage('Notification preferences saved successfully!');
    } catch {
      setMessage('Failed to save preferences. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1">Notification Preferences</h1>
          <p className="text-slate-600 dark:text-slate-300">
            Choose what notifications you want to receive
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Changes
        </Button>
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-sm mb-6 ${
          message.includes('success') 
            ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400'
            : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
        }`}>
          {message}
        </div>
      )}

      <div className="space-y-6">
        {notificationSettings.map((category) => (
          <Card key={category.category}>
            <CardHeader>
              <CardTitle>{category.category}</CardTitle>
              <CardDescription>Manage {category.category.toLowerCase()} notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {category.items.map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                        <item.icon className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                      </div>
                      <div>
                        <p className="font-medium">{item.label}</p>
                        <p className="text-sm text-slate-500">{item.description}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggle(item.key)}
                      className={`relative w-11 h-6 rounded-full transition-colors ${
                        settings[item.key]
                          ? 'bg-primary-600'
                          : 'bg-slate-300 dark:bg-slate-600'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                          settings[item.key] ? 'translate-x-5' : ''
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Email Digest */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Email Digest</CardTitle>
          <CardDescription>Choose how often you receive email summaries</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-3 gap-3">
            {['Daily', 'Weekly', 'Never'].map((option) => (
              <button
                key={option}
                className="p-4 rounded-lg border-2 border-slate-200 dark:border-slate-700 hover:border-primary-500 transition-colors text-center"
              >
                <p className="font-medium">{option}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {option === 'Daily' && 'Get a daily summary'}
                  {option === 'Weekly' && 'Get a weekly digest'}
                  {option === 'Never' && 'No email summaries'}
                </p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
