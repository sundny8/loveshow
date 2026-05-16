'use client';

import { useState } from 'react';
import { useSession } from '@/lib/auth-client';
import { useTranslations } from 'next-intl';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Modal } from '@/components/ui/modal';
import { Users, UserPlus, Mail, MoreVertical, Shield, Crown, Eye, User } from 'lucide-react';
import Link from 'next/link';

// Sample team data (in production, this would come from database)
const teamMembers = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'owner',
    avatar: null,
    joinedAt: '2024-01-01',
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'admin',
    avatar: null,
    joinedAt: '2024-01-15',
  },
  {
    id: '3',
    name: 'Bob Wilson',
    email: 'bob@example.com',
    role: 'member',
    avatar: null,
    joinedAt: '2024-02-01',
  },
];

const pendingInvitations = [
  {
    id: '1',
    email: 'alice@example.com',
    role: 'member',
    invitedAt: '2024-03-01',
    expiresAt: '2024-03-08',
  },
];

const roleIcons = {
  owner: Crown,
  admin: Shield,
  member: User,
  viewer: Eye,
};

const roleBadgeVariants: Record<string, 'default' | 'secondary' | 'warning' | 'outline'> = {
  owner: 'default',
  admin: 'secondary',
  member: 'outline',
  viewer: 'outline',
};

export default function TeamPage() {
  const { data: session, isPending } = useSession();
  const t = useTranslations('team');
  const tRoles = useTranslations('roles');
  
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');

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
          You need to be signed in to manage your team
        </p>
        <Link href="/auth/signin">
          <Button>Sign In</Button>
        </Link>
      </div>
    );
  }

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    // In production, this would send an invitation
    console.log('Inviting:', inviteEmail, 'as', inviteRole);
    setIsInviteModalOpen(false);
    setInviteEmail('');
    setInviteRole('member');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-3xl font-bold">{t('title')}</h1>
            <span className="text-xs bg-gradient-to-r from-primary-600 to-secondary-600 text-white px-2 py-0.5 rounded font-semibold">PRO</span>
          </div>
          <p className="text-slate-600 dark:text-slate-300">
            Manage your team members and invitations
          </p>
        </div>
        <Button onClick={() => setIsInviteModalOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          {t('invite')}
        </Button>
      </div>

      {/* Team Members */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t('members')}
          </CardTitle>
          <CardDescription>
            {teamMembers.length} members in your team
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {teamMembers.map((member) => {
              const RoleIcon = roleIcons[member.role as keyof typeof roleIcons];
              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-700"
                >
                  <div className="flex items-center gap-4">
                    <Avatar
                      src={member.avatar}
                      fallback={member.name.split(' ').map(n => n[0]).join('')}
                      size="md"
                    />
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-sm text-slate-500">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={roleBadgeVariants[member.role]}>
                      <RoleIcon className="h-3 w-3 mr-1" />
                      {tRoles(member.role)}
                    </Badge>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            {t('invitations')}
          </CardTitle>
          <CardDescription>
            {pendingInvitations.length} pending invitation{pendingInvitations.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingInvitations.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">
              No pending invitations
            </p>
          ) : (
            <div className="space-y-4">
              {pendingInvitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-700"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <Mail className="h-5 w-5 text-slate-400" />
                    </div>
                    <div>
                      <p className="font-medium">{invitation.email}</p>
                      <p className="text-sm text-slate-500">
                        Invited on {new Date(invitation.invitedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="warning">{t('pending')}</Badge>
                    <Badge variant="outline">{tRoles(invitation.role)}</Badge>
                    <Button variant="outline" size="sm">
                      {t('revoke')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite Modal */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title={t('invite')}
      >
        <form onSubmit={handleInvite} className="space-y-4">
          <p className="text-sm text-slate-500">{t('inviteSubtitle')}</p>
          
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              {t('inviteEmail')}
            </label>
            <Input
              id="email"
              type="email"
              placeholder="colleague@example.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="role" className="text-sm font-medium">
              {t('inviteRole')}
            </label>
            <select
              id="role"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="admin">{tRoles('admin')}</option>
              <option value="member">{tRoles('member')}</option>
              <option value="viewer">{tRoles('viewer')}</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setIsInviteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              {t('sendInvite')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
