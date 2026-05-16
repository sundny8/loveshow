'use client';

import { useState, useEffect } from 'react';
import { useSession } from '@/lib/auth-client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Building2, 
  Plus, 
  Users, 
  Crown, 
  Settings,
  LogOut,
  Loader2,
  X,
  UserPlus,
} from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  role: string;
  memberCount: number;
  createdAt: string;
}

export default function MyOrganizationsPage() {
  const { data: session } = useSession();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newOrg, setNewOrg] = useState<{ name: string; slug: string } | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [leaveOrg, setLeaveOrg] = useState<Organization | null>(null);
  const [isLeaving, setIsLeaving] = useState(false);

  const fetchOrganizations = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/organizations');
      if (res.ok) {
        const data = await res.json();
        setOrganizations(data.organizations);
      }
    } catch (error) {
      console.error('Failed to fetch organizations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newOrg || !newOrg.name || !newOrg.slug) {
      alert('Name and slug are required');
      return;
    }
    setIsCreating(true);
    try {
      const res = await fetch('/api/organizations', {
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

  const handleLeave = async () => {
    if (!leaveOrg) return;
    setIsLeaving(true);
    try {
      const res = await fetch(`/api/organizations/${leaveOrg.id}/leave`, {
        method: 'POST',
      });
      if (res.ok) {
        setLeaveOrg(null);
        fetchOrganizations();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to leave organization');
      }
    } catch {
      alert('Failed to leave organization');
    } finally {
      setIsLeaving(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchOrganizations();
    }
  }, [session]);

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
          <h1 className="text-2xl font-bold">My Organizations</h1>
          <p className="text-slate-500">Create and manage your teams</p>
        </div>
        <Button onClick={() => setNewOrg({ name: '', slug: '' })}>
          <Plus className="h-4 w-4 mr-2" />
          Create Organization
        </Button>
      </div>

      {/* Organizations Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      ) : organizations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No organizations yet</h3>
            <p className="text-slate-500 text-center mb-6 max-w-md">
              Create an organization to collaborate with your team members.
            </p>
            <Button onClick={() => setNewOrg({ name: '', slug: '' })}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Organization
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {organizations.map((org) => (
            <Card key={org.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  {org.logo ? (
                    <Image 
                      src={org.logo} 
                      alt={org.name} 
                      width={48} 
                      height={48} 
                      className="rounded-lg"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-white" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{org.name}</h3>
                    <p className="text-sm text-slate-500 truncate">/{org.slug}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-4">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${getRoleBadgeColor(org.role)}`}>
                    {org.role === 'owner' && <Crown className="h-3 w-3 inline mr-1" />}
                    {org.role}
                  </span>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {org.memberCount} {org.memberCount === 1 ? 'member' : 'members'}
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <Link href={`/dashboard/organizations/${org.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      <Settings className="h-4 w-4 mr-2" />
                      Manage
                    </Button>
                  </Link>
                  {org.role !== 'owner' && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setLeaveOrg(org)}
                      className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Join Organization Card */}
          <Card className="border-dashed hover:border-primary-300 dark:hover:border-primary-700 cursor-pointer">
            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                <UserPlus className="h-6 w-6 text-slate-400" />
              </div>
              <h3 className="font-semibold mb-1">Join an Organization</h3>
              <p className="text-sm text-slate-500 mb-4">
                Have an invite? Accept it from email
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create Organization Modal */}
      {newOrg && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Create Organization</h2>
              <button 
                onClick={() => setNewOrg(null)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Organization Name <span className="text-red-500">*</span>
                </label>
                <Input
                  value={newOrg.name}
                  onChange={(e) => setNewOrg({ 
                    ...newOrg, 
                    name: e.target.value,
                    slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
                  })}
                  placeholder="My Company"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  URL Slug <span className="text-red-500">*</span>
                </label>
                <Input
                  value={newOrg.slug}
                  onChange={(e) => setNewOrg({ 
                    ...newOrg, 
                    slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') 
                  })}
                  placeholder="my-company"
                />
                <p className="text-xs text-slate-500 mt-1">
                  This will be used in URLs: /org/{newOrg.slug || 'my-company'}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setNewOrg(null)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={isCreating}>
                {isCreating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                Create
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Leave Organization Modal */}
      {leaveOrg && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30">
                <LogOut className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Leave Organization</h2>
                <p className="text-sm text-slate-500">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              Are you sure you want to leave <strong>{leaveOrg.name}</strong>? 
              You will lose access to all resources in this organization.
            </p>
            <div className="flex items-center justify-end gap-3">
              <Button variant="outline" onClick={() => setLeaveOrg(null)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleLeave}
                disabled={isLeaving}
                className="bg-red-600 hover:bg-red-700"
              >
                {isLeaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <LogOut className="h-4 w-4 mr-2" />}
                Leave
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
