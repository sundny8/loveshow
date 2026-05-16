'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import { 
  Search, 
  Plus,
  RefreshCw,
  Loader2,
  Building2,
  Eye,
  Edit,
  Trash2,
  Users,
  Crown,
  X,
  Save,
  UserPlus,
  MoreVertical,
} from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  ownerId: string;
  ownerName: string | null;
  ownerEmail: string | null;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

interface Member {
  id: string;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  userImage: string | null;
  role: string;
  createdAt: string;
}

interface Stats {
  total: number;
  totalMembers: number;
}

export default function AdminOrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, totalMembers: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [viewingOrg, setViewingOrg] = useState<Organization | null>(null);
  const [deleteOrg, setDeleteOrg] = useState<Organization | null>(null);
  const [newOrg, setNewOrg] = useState<Partial<Organization> | null>(null);
  
  // Members management
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('member');
  const [addingMember, setAddingMember] = useState(false);
  
  // Action states
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const emptyOrg: Partial<Organization> = {
    name: '',
    slug: '',
    logo: '',
  };

  const fetchOrganizations = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ search: searchQuery });
      const res = await fetch(`/api/admin/organizations?${params}`);
      if (res.ok) {
        const data = await res.json();
        setOrganizations(data.organizations);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch organizations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMembers = async (orgId: string) => {
    setLoadingMembers(true);
    try {
      const res = await fetch(`/api/admin/organizations/${orgId}/members`);
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members);
      }
    } catch (error) {
      console.error('Failed to fetch members:', error);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleView = async (org: Organization) => {
    setViewingOrg(org);
    await fetchMembers(org.id);
  };

  const handleCreate = async () => {
    if (!newOrg) return;
    if (!newOrg.name || !newOrg.slug) {
      alert('Name and Slug are required');
      return;
    }
    setIsCreating(true);
    try {
      const res = await fetch('/api/admin/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrg),
      });
      if (res.ok) {
        setNewOrg(null);
        fetchOrganizations();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to create organization');
      }
    } catch {
      alert('Failed to create organization');
    } finally {
      setIsCreating(false);
    }
  };

  const handleSave = async () => {
    if (!editingOrg) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/organizations/${editingOrg.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingOrg),
      });
      if (res.ok) {
        setEditingOrg(null);
        fetchOrganizations();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to save');
      }
    } catch {
      alert('Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteOrg) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/organizations/${deleteOrg.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setDeleteOrg(null);
        fetchOrganizations();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to delete');
      }
    } catch {
      alert('Failed to delete');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddMember = async () => {
    if (!viewingOrg || !newMemberEmail) return;
    setAddingMember(true);
    try {
      const res = await fetch(`/api/admin/organizations/${viewingOrg.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newMemberEmail, role: newMemberRole }),
      });
      if (res.ok) {
        setNewMemberEmail('');
        setNewMemberRole('member');
        fetchMembers(viewingOrg.id);
        fetchOrganizations();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to add member');
      }
    } catch {
      alert('Failed to add member');
    } finally {
      setAddingMember(false);
    }
  };

  const handleUpdateMemberRole = async (memberId: string, newRole: string) => {
    if (!viewingOrg) return;
    try {
      const res = await fetch(`/api/admin/organizations/${viewingOrg.id}/members/${memberId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        setEditingMember(null);
        fetchMembers(viewingOrg.id);
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to update member');
      }
    } catch {
      alert('Failed to update member');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!viewingOrg) return;
    if (!confirm('Are you sure you want to remove this member?')) return;
    try {
      const res = await fetch(`/api/admin/organizations/${viewingOrg.id}/members/${memberId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchMembers(viewingOrg.id);
        fetchOrganizations();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to remove member');
      }
    } catch {
      alert('Failed to remove member');
    }
  };

  useEffect(() => {
    fetchOrganizations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrganizations();
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Organizations</h1>
          <p className="text-slate-500">Manage teams and their members</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchOrganizations} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => setNewOrg(emptyOrg)}>
            <Plus className="h-4 w-4 mr-2" />
            New Organization
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30">
                <Building2 className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Organizations</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Members</p>
                <p className="text-2xl font-bold">{stats.totalMembers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="pt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search organizations by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Organizations Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            </div>
          ) : organizations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Building2 className="h-12 w-12 text-slate-300 mb-4" />
              <p className="text-slate-500 mb-2">No organizations found</p>
              <p className="text-sm text-slate-400 mb-4">Create your first organization to get started</p>
              <Button onClick={() => setNewOrg(emptyOrg)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Organization
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left p-4 text-sm font-medium text-slate-500">Organization</th>
                    <th className="text-left p-4 text-sm font-medium text-slate-500">Owner</th>
                    <th className="text-left p-4 text-sm font-medium text-slate-500">Members</th>
                    <th className="text-left p-4 text-sm font-medium text-slate-500">Created</th>
                    <th className="text-left p-4 text-sm font-medium text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {organizations.map((org) => (
                    <tr key={org.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {org.logo ? (
                            <Image 
                              src={org.logo} 
                              alt={org.name}
                              width={40}
                              height={40}
                              className="rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
                              <Building2 className="h-5 w-5 text-white" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{org.name}</p>
                            <p className="text-sm text-slate-500">/{org.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Crown className="h-4 w-4 text-amber-500" />
                          <span className="text-sm">{org.ownerName || org.ownerEmail || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1 text-sm">
                          <Users className="h-4 w-4 text-slate-400" />
                          {org.memberCount}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-slate-500">{formatDate(org.createdAt)}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button 
                            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700" 
                            title="View Members"
                            onClick={() => handleView(org)}
                          >
                            <Eye className="h-4 w-4 text-slate-500" />
                          </button>
                          <button 
                            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700" 
                            title="Edit"
                            onClick={() => setEditingOrg(org)}
                          >
                            <Edit className="h-4 w-4 text-slate-500" />
                          </button>
                          <button 
                            className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20" 
                            title="Delete"
                            onClick={() => setDeleteOrg(org)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Members Modal */}
      {viewingOrg && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                {viewingOrg.logo ? (
                  <Image src={viewingOrg.logo} alt={viewingOrg.name} width={40} height={40} className="rounded-lg" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-white" />
                  </div>
                )}
                <div>
                  <h2 className="text-lg font-semibold">{viewingOrg.name}</h2>
                  <p className="text-sm text-slate-500">{members.length} members</p>
                </div>
              </div>
              <button 
                onClick={() => { setViewingOrg(null); setMembers([]); }}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Add Member */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              <p className="text-sm font-medium mb-3">Add New Member</p>
              <div className="flex gap-3">
                <Input
                  placeholder="Enter email address"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  className="flex-1"
                />
                <select
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  <option value="admin">Admin</option>
                  <option value="member">Member</option>
                  <option value="viewer">Viewer</option>
                </select>
                <Button onClick={handleAddMember} disabled={addingMember || !newMemberEmail}>
                  {addingMember ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4 mr-2" />}
                  Add
                </Button>
              </div>
            </div>

            {/* Members List */}
            <div className="flex-1 overflow-auto p-4">
              {loadingMembers ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
                </div>
              ) : members.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Users className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                  <p>No members yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-3">
                        {member.userImage ? (
                          <Image src={member.userImage} alt={member.userName || ''} width={40} height={40} className="rounded-full" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                            <span className="text-sm font-medium">{(member.userName || member.userEmail || '?').charAt(0).toUpperCase()}</span>
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{member.userName || 'Unknown'}</p>
                          <p className="text-sm text-slate-500">{member.userEmail}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {editingMember?.id === member.id ? (
                          <select
                            value={editingMember.role}
                            onChange={(e) => handleUpdateMemberRole(member.id, e.target.value)}
                            className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100"
                            autoFocus
                            onBlur={() => setEditingMember(null)}
                          >
                            <option value="owner">Owner</option>
                            <option value="admin">Admin</option>
                            <option value="member">Member</option>
                            <option value="viewer">Viewer</option>
                          </select>
                        ) : (
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${getRoleBadgeColor(member.role)}`}>
                            {member.role}
                          </span>
                        )}
                        <div className="relative group">
                          <button className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700">
                            <MoreVertical className="h-4 w-4 text-slate-400" />
                          </button>
                          <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                            <button 
                              className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700 rounded-t-lg"
                              onClick={() => setEditingMember(member)}
                            >
                              Change Role
                            </button>
                            <button 
                              className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-b-lg"
                              onClick={() => handleRemoveMember(member.id)}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end p-4 border-t border-slate-200 dark:border-slate-700">
              <Button variant="outline" onClick={() => { setViewingOrg(null); setMembers([]); }}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Organization Modal */}
      {editingOrg && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Edit Organization</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Name</label>
                <Input
                  value={editingOrg.name}
                  onChange={(e) => setEditingOrg({ ...editingOrg, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Slug</label>
                <Input
                  value={editingOrg.slug}
                  onChange={(e) => setEditingOrg({ ...editingOrg, slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Logo URL</label>
                <Input
                  value={editingOrg.logo || ''}
                  onChange={(e) => setEditingOrg({ ...editingOrg, logo: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setEditingOrg(null)}>Cancel</Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* New Organization Modal */}
      {newOrg && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Create Organization</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Name <span className="text-red-500">*</span></label>
                <Input
                  value={newOrg.name || ''}
                  onChange={(e) => setNewOrg({ ...newOrg, name: e.target.value })}
                  placeholder="My Organization"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Slug <span className="text-red-500">*</span></label>
                <Input
                  value={newOrg.slug || ''}
                  onChange={(e) => setNewOrg({ ...newOrg, slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') })}
                  placeholder="my-organization"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Logo URL</label>
                <Input
                  value={newOrg.logo || ''}
                  onChange={(e) => setNewOrg({ ...newOrg, logo: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setNewOrg(null)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={isCreating}>
                {isCreating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                Create
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteOrg && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Delete Organization</h2>
                <p className="text-sm text-slate-500">This will also remove all members</p>
              </div>
            </div>
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              Are you sure you want to delete <strong>&quot;{deleteOrg.name}&quot;</strong>?
            </p>
            <div className="flex items-center justify-end gap-3">
              <Button variant="outline" onClick={() => setDeleteOrg(null)}>Cancel</Button>
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
    </div>
  );
}
