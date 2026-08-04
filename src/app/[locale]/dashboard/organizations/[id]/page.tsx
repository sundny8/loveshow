'use client';

import { useState, useEffect, use } from 'react';
import { useSession } from '@/lib/auth-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import { Link, useRouter } from '@/i18n/routing';
import { 
  Building2, 
  Users, 
  Crown, 
  Settings,
  Trash2,
  Loader2,
  X,
  UserPlus,
  ArrowLeft,
  Mail,
  Shield,
  Eye,
  UserMinus,
  Clock,
  RefreshCw,
  ArrowRightLeft,
} from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  role: string;
  memberCount: number;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

interface Member {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string;
  joinedAt: string;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: string;
  createdAt: string;
}

type TabType = 'general' | 'members' | 'invitations';

export default function OrganizationSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { data: session } = useSession();
  const [org, setOrg] = useState<Organization | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('general');
  
  // General tab state
  const [editForm, setEditForm] = useState({ name: '', slug: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Members tab state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [isInviting, setIsInviting] = useState(false);
  const [changingRole, setChangingRole] = useState<string | null>(null);
  const [removingMember, setRemovingMember] = useState<Member | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [transferTarget, setTransferTarget] = useState<Member | null>(null);
  const [isTransferring, setIsTransferring] = useState(false);

  const isOwner = org?.role === 'owner';
  const isAdmin = org?.role === 'admin' || isOwner;

  const fetchOrganization = async () => {
    try {
      const res = await fetch(`/api/organizations/${resolvedParams.id}`);
      if (res.ok) {
        const data = await res.json();
        setOrg(data.organization);
        setEditForm({ name: data.organization.name, slug: data.organization.slug });
      }
    } catch (error) {
      console.error('Failed to fetch organization:', error);
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await fetch(`/api/organizations/${resolvedParams.id}/members`);
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members);
      }
    } catch (error) {
      console.error('Failed to fetch members:', error);
    }
  };

  const fetchInvitations = async () => {
    try {
      const res = await fetch(`/api/organizations/${resolvedParams.id}/invitations`);
      if (res.ok) {
        const data = await res.json();
        setInvitations(data.invitations);
      }
    } catch (error) {
      console.error('Failed to fetch invitations:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchOrganization(), fetchMembers(), fetchInvitations()]);
      setIsLoading(false);
    };
    if (session) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, resolvedParams.id]);

  const handleSaveGeneral = async () => {
    if (!editForm.name || !editForm.slug) {
      alert('Name and slug are required');
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch(`/api/organizations/${resolvedParams.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        fetchOrganization();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to update organization');
      }
    } catch {
      alert('Failed to update organization');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/organizations/${resolvedParams.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        router.push('/dashboard/organizations');
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to delete organization');
      }
    } catch {
      alert('Failed to delete organization');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail) {
      alert('Email is required');
      return;
    }
    setIsInviting(true);
    try {
      const res = await fetch(`/api/organizations/${resolvedParams.id}/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      if (res.ok) {
        setShowInviteModal(false);
        setInviteEmail('');
        setInviteRole('member');
        fetchInvitations();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to send invitation');
      }
    } catch {
      alert('Failed to send invitation');
    } finally {
      setIsInviting(false);
    }
  };

  const handleChangeRole = async (memberId: string, newRole: string) => {
    setChangingRole(memberId);
    try {
      const res = await fetch(`/api/organizations/${resolvedParams.id}/members/${memberId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        fetchMembers();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to change role');
      }
    } catch {
      alert('Failed to change role');
    } finally {
      setChangingRole(null);
    }
  };

  const handleRemoveMember = async () => {
    if (!removingMember) return;
    setIsRemoving(true);
    try {
      const res = await fetch(`/api/organizations/${resolvedParams.id}/members/${removingMember.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setRemovingMember(null);
        fetchMembers();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to remove member');
      }
    } catch {
      alert('Failed to remove member');
    } finally {
      setIsRemoving(false);
    }
  };

  const handleTransferOwnership = async () => {
    if (!transferTarget) return;
    setIsTransferring(true);
    try {
      const res = await fetch(`/api/organizations/${resolvedParams.id}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newOwnerId: transferTarget.id }),
      });
      if (res.ok) {
        setTransferTarget(null);
        fetchOrganization();
        fetchMembers();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to transfer ownership');
      }
    } catch {
      alert('Failed to transfer ownership');
    } finally {
      setIsTransferring(false);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      const res = await fetch(`/api/organizations/${resolvedParams.id}/invitations/${invitationId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchInvitations();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to cancel invitation');
      }
    } catch {
      alert('Failed to cancel invitation');
    }
  };

  const handleResendInvitation = async (invitationId: string) => {
    try {
      const res = await fetch(`/api/organizations/${resolvedParams.id}/invitations/${invitationId}/resend`, {
        method: 'POST',
      });
      if (res.ok) {
        alert('Invitation resent successfully');
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to resend invitation');
      }
    } catch {
      alert('Failed to resend invitation');
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      case 'admin': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'member': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'viewer': return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="h-3 w-3" />;
      case 'admin': return <Shield className="h-3 w-3" />;
      case 'viewer': return <Eye className="h-3 w-3" />;
      default: return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!org) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Building2 className="h-12 w-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Organization not found</h3>
          <Link href="/dashboard/organizations">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Organizations
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/organizations">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          {org.logo ? (
            <Image src={org.logo} alt={org.name} width={40} height={40} className="rounded-lg" />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-white" />
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold">{org.name}</h1>
            <p className="text-sm text-slate-500">/{org.slug}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setActiveTab('general')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'general' 
              ? 'border-primary-600 text-primary-600' 
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Settings className="h-4 w-4 inline mr-2" />
          General
        </button>
        <button
          onClick={() => setActiveTab('members')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'members' 
              ? 'border-primary-600 text-primary-600' 
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Users className="h-4 w-4 inline mr-2" />
          Members ({members.length})
        </button>
        {isAdmin && (
          <button
            onClick={() => setActiveTab('invitations')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'invitations' 
                ? 'border-primary-600 text-primary-600' 
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Mail className="h-4 w-4 inline mr-2" />
            Invitations ({invitations.filter(i => i.status === 'pending').length})
          </button>
        )}
      </div>

      {/* General Tab */}
      {activeTab === 'general' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Organization Profile</CardTitle>
              <CardDescription>Update your organization information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Organization Name</label>
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="My Company"
                  disabled={!isAdmin}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">URL Slug</label>
                <Input
                  value={editForm.slug}
                  onChange={(e) => setEditForm({ 
                    ...editForm, 
                    slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') 
                  })}
                  placeholder="my-company"
                  disabled={!isAdmin}
                />
                <p className="text-xs text-slate-500 mt-1">
                  URL: /org/{editForm.slug || 'my-company'}
                </p>
              </div>
              {isAdmin && (
                <div className="flex justify-end">
                  <Button onClick={handleSaveGeneral} disabled={isSaving}>
                    {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                    Save Changes
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {isOwner && (
            <Card className="border-red-200 dark:border-red-900">
              <CardHeader>
                <CardTitle className="text-red-600">Danger Zone</CardTitle>
                <CardDescription>Irreversible actions for this organization</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 rounded-lg bg-red-50 dark:bg-red-900/20">
                  <div>
                    <h4 className="font-medium text-red-900 dark:text-red-100">Delete Organization</h4>
                    <p className="text-sm text-red-600 dark:text-red-400">
                      Permanently delete this organization and all its data
                    </p>
                  </div>
                  <Button 
                    variant="destructive" 
                    onClick={() => setShowDeleteConfirm(true)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Members Tab */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Team Members ({members.length})</h3>
            {isAdmin && (
              <Button onClick={() => setShowInviteModal(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Member
              </Button>
            )}
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center gap-4 p-4">
                    {member.image ? (
                      <Image 
                        src={member.image} 
                        alt={member.name} 
                        width={40} 
                        height={40} 
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                        <span className="text-sm font-medium">
                          {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{member.name}</span>
                        {member.id === session?.user?.id && (
                          <span className="text-xs text-slate-500">(you)</span>
                        )}
                      </div>
                      <span className="text-sm text-slate-500 truncate">{member.email}</span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize flex items-center gap-1 ${getRoleBadgeColor(member.role)}`}>
                      {getRoleIcon(member.role)}
                      {member.role}
                    </span>
                    {/* Transfer ownership button for owner viewing other members */}
                    {isOwner && member.role !== 'owner' && member.id !== session?.user?.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setTransferTarget(member)}
                        className="text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                        title="Transfer Ownership"
                      >
                        <ArrowRightLeft className="h-4 w-4" />
                      </Button>
                    )}
                    {isAdmin && member.role !== 'owner' && member.id !== session?.user?.id && (
                      <div className="flex items-center gap-2">
                        <select
                          value={member.role}
                          onChange={(e) => handleChangeRole(member.id, e.target.value)}
                          disabled={changingRole === member.id}
                          className="text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 bg-white dark:bg-slate-800"
                        >
                          {isOwner && <option value="admin">Admin</option>}
                          <option value="member">Member</option>
                          <option value="viewer">Viewer</option>
                        </select>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setRemovingMember(member)}
                          className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Invitations Tab */}
      {activeTab === 'invitations' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Pending Invitations ({invitations.filter(i => i.status === 'pending').length})</h3>
            {isAdmin && (
              <Button onClick={() => setShowInviteModal(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Send Invitation
              </Button>
            )}
          </div>

          <Card>
            <CardContent className="p-0">
              {invitations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Mail className="h-12 w-12 text-slate-300 mb-4" />
                  <h3 className="font-semibold mb-2">No invitations</h3>
                  <p className="text-sm text-slate-500 mb-4">
                    Invite team members to collaborate
                  </p>
                  {isAdmin && (
                    <Button onClick={() => setShowInviteModal(true)}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Send Invitation
                    </Button>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {invitations.map((invitation) => (
                    <div key={invitation.id} className="flex items-center gap-4 p-4">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <Mail className="h-5 w-5 text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-medium truncate">{invitation.email}</span>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <Clock className="h-3 w-3" />
                          Expires {new Date(invitation.expiresAt).toLocaleDateString()}
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${getRoleBadgeColor(invitation.role)}`}>
                        {invitation.role}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        invitation.status === 'pending' 
                          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : invitation.status === 'accepted'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {invitation.status}
                      </span>
                      {isAdmin && invitation.status === 'pending' && (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleResendInvitation(invitation.id)}
                            title="Resend"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCancelInvitation(invitation.id)}
                            className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                            title="Cancel"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Invite Team Member</h2>
              <button 
                onClick={() => setShowInviteModal(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <Input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Role</label>
                <div className="space-y-2">
                  {isOwner && (
                    <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800">
                      <input
                        type="radio"
                        name="role"
                        value="admin"
                        checked={inviteRole === 'admin'}
                        onChange={(e) => setInviteRole(e.target.value)}
                        className="text-primary-600"
                      />
                      <div>
                        <span className="font-medium">Admin</span>
                        <p className="text-sm text-slate-500">Can manage team members and settings</p>
                      </div>
                    </label>
                  )}
                  <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800">
                    <input
                      type="radio"
                      name="role"
                      value="member"
                      checked={inviteRole === 'member'}
                      onChange={(e) => setInviteRole(e.target.value)}
                      className="text-primary-600"
                    />
                    <div>
                      <span className="font-medium">Member</span>
                      <p className="text-sm text-slate-500">Can access all features</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800">
                    <input
                      type="radio"
                      name="role"
                      value="viewer"
                      checked={inviteRole === 'viewer'}
                      onChange={(e) => setInviteRole(e.target.value)}
                      className="text-primary-600"
                    />
                    <div>
                      <span className="font-medium">Viewer</span>
                      <p className="text-sm text-slate-500">Read-only access</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowInviteModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleInvite} disabled={isInviting}>
                {isInviting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Mail className="h-4 w-4 mr-2" />}
                Send Invitation
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Member Modal */}
      {removingMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30">
                <UserMinus className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Remove Member</h2>
                <p className="text-sm text-slate-500">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              Are you sure you want to remove <strong>{removingMember.name}</strong> from this organization?
            </p>
            <div className="flex items-center justify-end gap-3">
              <Button variant="outline" onClick={() => setRemovingMember(null)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleRemoveMember}
                disabled={isRemoving}
                className="bg-red-600 hover:bg-red-700"
              >
                {isRemoving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <UserMinus className="h-4 w-4 mr-2" />}
                Remove
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Delete Organization</h2>
                <p className="text-sm text-slate-500">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              Are you sure you want to delete <strong>{org.name}</strong>? 
              This will permanently remove all organization data and remove all members.
            </p>
            <div className="flex items-center justify-end gap-3">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isDeleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Ownership Modal */}
      {transferTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30">
                <ArrowRightLeft className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Transfer Ownership</h2>
                <p className="text-sm text-slate-500">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              Are you sure you want to transfer ownership of <strong>{org.name}</strong> to <strong>{transferTarget.name}</strong>?
              You will become an admin and lose owner privileges.
            </p>
            <div className="flex items-center justify-end gap-3">
              <Button variant="outline" onClick={() => setTransferTarget(null)}>
                Cancel
              </Button>
              <Button 
                onClick={handleTransferOwnership}
                disabled={isTransferring}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isTransferring ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ArrowRightLeft className="h-4 w-4 mr-2" />}
                Transfer Ownership
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
