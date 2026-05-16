'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { 
  Search, 
  UserPlus, 
  Mail, 
  Shield, 
  Trash2,
  Edit,
  CheckCircle,
  XCircle,
  Download,
  Loader2,
  RefreshCw,
  X,
  Save,
  User,
  Ban,
  Snowflake,
  Coins,
  AlertTriangle,
  KeyRound,
} from 'lucide-react';

interface UserType {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'USER';
  emailVerified: boolean;
  image: string | null;
  pointsBalance: number;
  isBanned: boolean;
  isFrozen: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Stats {
  total: number;
  admins: number;
  members: number;
  verified: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminUsersPage() {
  const t = useTranslations('admin');

  const [users, setUsers] = useState<UserType[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, admins: 0, members: 0, verified: 0 });
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  // Modal states
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [deleteUser, setDeleteUser] = useState<UserType | null>(null);
  const [newUser, setNewUser] = useState<Partial<UserType> | null>(null);
  const [changeRoleUser, setChangeRoleUser] = useState<UserType | null>(null);
  const [adjustPointsUser, setAdjustPointsUser] = useState<UserType | null>(null);

  // Action states
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const emptyUser: Partial<UserType> = {
    name: '',
    email: '',
    role: 'USER',
    emailVerified: false,
    image: '',
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search: searchQuery,
        role: selectedRole,
      });
      
      const res = await fetch(`/api/admin/users?${params}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setStats(data.stats);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newUser) return;
    if (!newUser.name || !newUser.email) {
      alert(t('name') + ' and ' + t('email') + ' are required');
      return;
    }
    setIsCreating(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });
      if (res.ok) {
        setNewUser(null);
        fetchUsers();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to create user');
      }
    } catch {
      alert('Failed to create user');
    } finally {
      setIsCreating(false);
    }
  };

  const handleSave = async () => {
    if (!editingUser) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingUser),
      });
      if (res.ok) {
        setEditingUser(null);
        fetchUsers();
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
    if (!deleteUser) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/users/${deleteUser.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setDeleteUser(null);
        fetchUsers();
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

  const handleChangeRole = async (newRole: string) => {
    if (!changeRoleUser) return;
    try {
      const res = await fetch(`/api/admin/users/${changeRoleUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        setChangeRoleUser(null);
        fetchUsers();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to change role');
      }
    } catch {
      alert('Failed to change role');
    }
  };

  const handleToggleBan = async (user: UserType) => {
    const confirmMsg = user.isBanned 
      ? t('confirmUnban', { name: user.name })
      : t('confirmBan', { name: user.name });
    if (!confirm(confirmMsg)) return;
    
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isBanned: !user.isBanned }),
      });
      if (res.ok) {
        fetchUsers();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed');
      }
    } catch {
      alert('Failed');
    }
  };

  const handleToggleFreeze = async (user: UserType) => {
    const confirmMsg = user.isFrozen
      ? t('confirmUnfreeze', { name: user.name })
      : t('confirmFreeze', { name: user.name });
    if (!confirm(confirmMsg)) return;
    
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFrozen: !user.isFrozen }),
      });
      if (res.ok) {
        fetchUsers();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed');
      }
    } catch {
      alert('Failed');
    }
  };

  const handleAdjustPoints = async (amount: number, description: string) => {
    if (!adjustPointsUser) return;
    if (!description.trim()) {
      alert(t('reasonRequired'));
      return;
    }
    
    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${adjustPointsUser.id}/points`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, description }),
      });
      if (res.ok) {
        const data = await res.json();
        alert(`Points adjusted!\nPrevious: ${data.previousBalance}\nChange: ${amount > 0 ? '+' : ''}${amount}\nNew: ${data.newBalance}`);
        setAdjustPointsUser(null);
        fetchUsers();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to adjust points');
      }
    } catch {
      alert('Failed to adjust points');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetPassword = async (user: UserType) => {
    if (!confirm(t('confirmResetPassword', { name: user.name, email: user.email }))) return;
    
    try {
      const res = await fetch(`/api/admin/users/${user.id}/reset-password`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        alert(t('passwordResetSuccess'));
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to reset password');
      }
    } catch {
      alert('Failed to reset password');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUsers.length === 0) return;
    if (!confirm(t('bulkDeleteConfirm', { count: selectedUsers.length }))) return;
    
    for (const userId of selectedUsers) {
      await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
    }
    setSelectedUsers([]);
    fetchUsers();
  };

  const handleBulkChangeRole = async (newRole: string) => {
    if (selectedUsers.length === 0) return;
    
    for (const userId of selectedUsers) {
      await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
    }
    setSelectedUsers([]);
    fetchUsers();
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, selectedRole]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (pagination.page === 1) {
        fetchUsers();
      } else {
        setPagination(prev => ({ ...prev, page: 1 }));
      }
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleAllUsers = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(u => u.id));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const roleColors: Record<string, string> = {
    ADMIN: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    USER: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  };

  const roleLabel = (role: string) => role === 'ADMIN' ? t('admins') : t('members');

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{t('users')}</h1>
          <p className="text-slate-500">{t('searchUsersPlaceholder')}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchUsers} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {t('refresh')}
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            {t('export')}
          </Button>
          <Button onClick={() => setNewUser(emptyUser)}>
            <UserPlus className="h-4 w-4 mr-2" />
            {t('addNewUser')}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-slate-500">{t('total')}</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-slate-500">{t('verified')}</p>
            <p className="text-2xl font-bold text-green-600">{stats.verified}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-slate-500">{t('members')}</p>
            <p className="text-2xl font-bold text-slate-600">{stats.members}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-slate-500">{t('admins')}</p>
            <p className="text-2xl font-bold text-blue-600">{stats.admins}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder={t('searchUsersPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100"
            >
              <option value="all">{t('allRoles')}</option>
              <option value="ADMIN">{t('admins')}</option>
              <option value="USER">{t('members')}</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <User className="h-12 w-12 text-slate-300 mb-4" />
              <p className="text-slate-500 mb-2">{t('noUsersFound')}</p>
              <p className="text-sm text-slate-400 mb-4">{t('adjustFilters')}</p>
              <Button onClick={() => setNewUser(emptyUser)}>
                <UserPlus className="h-4 w-4 mr-2" />
                {t('addNewUser')}
              </Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left p-4">
                        <input
                          type="checkbox"
                          checked={selectedUsers.length === users.length && users.length > 0}
                          onChange={toggleAllUsers}
                          className="rounded border-slate-300"
                        />
                      </th>
                      <th className="text-left p-4 text-sm font-medium text-slate-500">{t('tableUser')}</th>
                      <th className="text-left p-4 text-sm font-medium text-slate-500">{t('tablePoints')}</th>
                      <th className="text-left p-4 text-sm font-medium text-slate-500">{t('tableRole')}</th>
                      <th className="text-left p-4 text-sm font-medium text-slate-500">{t('tableStatus')}</th>
                      <th className="text-left p-4 text-sm font-medium text-slate-500">{t('tableEmailVerified')}</th>
                      <th className="text-left p-4 text-sm font-medium text-slate-500">{t('tableJoined')}</th>
                      <th className="text-left p-4 text-sm font-medium text-slate-500">{t('tableActions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="p-4">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={() => toggleUserSelection(user.id)}
                            className="rounded border-slate-300"
                          />
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            {user.image ? (
                              <Image src={user.image} alt={user.name} width={40} height={40} className="rounded-full" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-100 to-secondary-100 dark:from-primary-900/30 dark:to-secondary-900/30 flex items-center justify-center text-sm font-semibold text-primary-600">
                                {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </div>
                            )}
                            <div>
                              <p className="font-medium">{user.name}</p>
                              <p className="text-sm text-slate-500">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="font-semibold text-primary-600">{user.pointsBalance}</span>
                        </td>
                        <td className="p-4">
                          <span className={`text-xs px-2 py-1 rounded-full capitalize ${roleColors[user.role] || 'bg-slate-100 text-slate-700'}`}>
                            {roleLabel(user.role)}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-1">
                            {user.isBanned && (
                              <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                <Ban className="h-3 w-3" />
                                {t('banned')}
                              </span>
                            )}
                            {user.isFrozen && (
                              <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                <Snowflake className="h-3 w-3" />
                                {t('frozen')}
                              </span>
                            )}
                            {!user.isBanned && !user.isFrozen && (
                              <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                <CheckCircle className="h-3 w-3" />
                                {t('normal')}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          {user.emailVerified ? (
                            <span className="inline-flex items-center gap-1 text-xs text-green-600">
                              <CheckCircle className="h-4 w-4" />
                              {t('isVerified')}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                              <XCircle className="h-4 w-4" />
                              {t('notVerified')}
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <span className="text-sm text-slate-500">{formatDate(user.createdAt)}</span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <button 
                              className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700" 
                              title={t('adjustPoints')}
                              onClick={() => setAdjustPointsUser(user)}
                            >
                              <Coins className="h-4 w-4 text-yellow-500" />
                            </button>
                            <button 
                              className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700" 
                              title={user.isBanned ? t('confirmUnban', { name: '' }).split('?')[0] : t('confirmBan', { name: '' }).split('?')[0]}
                              onClick={() => handleToggleBan(user)}
                            >
                              <Ban className={`h-4 w-4 ${user.isBanned ? 'text-red-500' : 'text-slate-500'}`} />
                            </button>
                            <button 
                              className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700" 
                              title={user.isFrozen ? t('confirmUnfreeze', { name: '' }).split('?')[0] : t('confirmFreeze', { name: '' }).split('?')[0]}
                              onClick={() => handleToggleFreeze(user)}
                            >
                              <Snowflake className={`h-4 w-4 ${user.isFrozen ? 'text-blue-500' : 'text-slate-500'}`} />
                            </button>
                            <button 
                              className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700" 
                              title={t('edit')}
                              onClick={() => setEditingUser(user)}
                            >
                              <Edit className="h-4 w-4 text-slate-500" />
                            </button>
                            <button 
                              className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700" 
                              title={t('sendEmail')}
                              onClick={() => window.open(`mailto:${user.email}`)}
                            >
                              <Mail className="h-4 w-4 text-slate-500" />
                            </button>
                            <button 
                              className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700" 
                              title={t('resetPassword')}
                              onClick={() => handleResetPassword(user)}
                            >
                              <KeyRound className="h-4 w-4 text-orange-500" />
                            </button>
                            <button 
                              className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700" 
                              title={t('changeRole')}
                              onClick={() => setChangeRoleUser(user)}
                            >
                              <Shield className="h-4 w-4 text-slate-500" />
                            </button>
                            <button 
                              className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20" 
                              title={t('delete')}
                              onClick={() => setDeleteUser(user)}
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
              
              {/* Pagination */}
              <div className="flex items-center justify-between p-4 border-t border-slate-200 dark:border-slate-700">
                <p className="text-sm text-slate-500">
                  {t('showingUsers', { count: users.length, total: pagination.total, page: pagination.page, totalPages: pagination.totalPages })}
                </p>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={pagination.page <= 1}
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  >
                    {t('previous')}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  >
                    {t('next')}
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-4 z-40">
          <span className="text-sm">{t('usersSelected', { count: selectedUsers.length })}</span>
          <div className="flex gap-2">
            <select
              className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-sm"
              onChange={(e) => {
                if (e.target.value) {
                  handleBulkChangeRole(e.target.value);
                  e.target.value = '';
                }
              }}
              defaultValue=""
            >
              <option value="" disabled>{t('changeRole')}</option>
              <option value="ADMIN">{t('admins')}</option>
              <option value="USER">{t('members')}</option>
            </select>
            <Button size="sm" variant="outline" className="text-red-400 border-red-600 hover:bg-red-900/30" onClick={handleBulkDelete}>
              {t('delete')}
            </Button>
          </div>
        </div>
      )}

      {/* New User Modal */}
      {newUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{t('addNewUser')}</h2>
              <button onClick={() => setNewUser(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">{t('name')} <span className="text-red-500">*</span></label>
                <Input
                  value={newUser.name || ''}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">{t('email')} <span className="text-red-500">*</span></label>
                <Input
                  type="email"
                  value={newUser.email || ''}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">{t('role')}</label>
                <select
                  value={newUser.role || 'USER'}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as UserType['role'] })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  <option value="ADMIN">{t('admins')}</option>
                  <option value="USER">{t('members')}</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="emailVerified"
                  checked={newUser.emailVerified || false}
                  onChange={(e) => setNewUser({ ...newUser, emailVerified: e.target.checked })}
                  className="rounded border-slate-300"
                />
                <label htmlFor="emailVerified" className="text-sm">{t('emailVerified')}</label>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setNewUser(null)}>{t('cancel')}</Button>
              <Button onClick={handleCreate} disabled={isCreating}>
                {isCreating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <UserPlus className="h-4 w-4 mr-2" />}
                {t('createConfirm')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{t('editUser')}</h2>
              <button onClick={() => setEditingUser(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">{t('name')}</label>
                <Input
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">{t('email')}</label>
                <Input
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">{t('role')}</label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as UserType['role'] })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  <option value="ADMIN">{t('admins')}</option>
                  <option value="USER">{t('members')}</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="editEmailVerified"
                  checked={editingUser.emailVerified}
                  onChange={(e) => setEditingUser({ ...editingUser, emailVerified: e.target.checked })}
                  className="rounded border-slate-300"
                />
                <label htmlFor="editEmailVerified" className="text-sm">{t('emailVerified')}</label>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setEditingUser(null)}>{t('cancel')}</Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                {t('saveChanges')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Change Role Modal */}
      {changeRoleUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{t('changeUserRole')}</h2>
              <button onClick={() => setChangeRoleUser(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-slate-600 dark:text-slate-300 mb-4">
              {t('selectNewRole', { name: changeRoleUser.name })}
            </p>
            <div className="space-y-2">
              {['ADMIN', 'USER'].map((role) => (
                <button
                  key={role}
                  className={`w-full p-3 rounded-lg border text-left capitalize transition-colors ${
                    changeRoleUser.role === role 
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
                      : 'border-slate-200 dark:border-slate-700 hover:border-primary-300'
                  }`}
                  onClick={() => handleChangeRole(role)}
                >
                  <span className={`inline-block text-xs px-2 py-1 rounded-full mr-2 ${roleColors[role]}`}>
                    {roleLabel(role)}
                  </span>
                  {role === changeRoleUser.role && <span className="text-xs text-primary-600">({t('current')})</span>}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-end mt-6">
              <Button variant="outline" onClick={() => setChangeRoleUser(null)}>{t('cancel')}</Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">{t('deleteUser')}</h2>
                <p className="text-sm text-slate-500">{t('deleteDescription')}</p>
              </div>
            </div>
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              {t('deleteConfirmation', { name: deleteUser.name, email: deleteUser.email })}
            </p>
            <div className="flex items-center justify-end gap-3">
              <Button variant="outline" onClick={() => setDeleteUser(null)}>{t('cancel')}</Button>
              <Button 
                variant="destructive" 
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isDeleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                {t('delete')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Adjust Points Modal */}
      {adjustPointsUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold">{t('adjustPoints')}</h2>
              <button onClick={() => setAdjustPointsUser(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">{t('tableUser')}</p>
                    <p className="font-semibold">{adjustPointsUser.name}</p>
                    <p className="text-xs text-slate-400">{adjustPointsUser.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-500">{t('currentBalance')}</p>
                    <p className="text-2xl font-bold text-primary-600">{adjustPointsUser.pointsBalance}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <AdjustPointsForm 
                user={adjustPointsUser}
                onAdjust={handleAdjustPoints}
                onCancel={() => setAdjustPointsUser(null)}
                isSaving={isSaving}
                t={t}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Adjust Points Form Component
function AdjustPointsForm({ 
  user, 
  onAdjust, 
  onCancel, 
  isSaving,
  t,
}: { 
  user: UserType; 
  onAdjust: (amount: number, description: string) => void; 
  onCancel: () => void;
  isSaving: boolean;
  t: (key: string, params?: Record<string, any>) => string;
}) {
  const [adjustType, setAdjustType] = useState<'add' | 'deduct'>('add');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [customAmount, setCustomAmount] = useState('');

  const presetAmounts = [10, 50, 100, 200, 500];

  const handleSubmit = () => {
    const finalAmount = adjustType === 'add' 
      ? (customAmount ? parseInt(customAmount) : parseInt(amount))
      : -(customAmount ? parseInt(customAmount) : parseInt(amount));
    
    if (isNaN(finalAmount) || finalAmount === 0) {
      alert(t('reasonRequired'));
      return;
    }

    if (adjustType === 'deduct' && Math.abs(finalAmount) > user.pointsBalance) {
      alert('Points insufficient. Current balance: ' + user.pointsBalance);
      return;
    }

    onAdjust(finalAmount, description);
  };

  return (
    <div className="space-y-4">
      {/* Adjust Type */}
      <div className="flex gap-2">
        <button
          onClick={() => setAdjustType('add')}
          className={`flex-1 py-2 px-4 rounded-lg border-2 font-semibold transition-all ${
            adjustType === 'add'
              ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-600'
              : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
          }`}
        >
          <Coins className="h-4 w-4 inline-block mr-2" />
          {t('grantPoints')}
        </button>
        <button
          onClick={() => setAdjustType('deduct')}
          className={`flex-1 py-2 px-4 rounded-lg border-2 font-semibold transition-all ${
            adjustType === 'deduct'
              ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-600'
              : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
          }`}
        >
          <AlertTriangle className="h-4 w-4 inline-block mr-2" />
          {t('deductPoints')}
        </button>
      </div>

      {/* Preset Amounts */}
      <div>
        <label className="block text-sm font-medium mb-2">{t('quickSelect')}</label>
        <div className="grid grid-cols-5 gap-2">
          {presetAmounts.map((preset) => (
            <button
              key={preset}
              onClick={() => {
                setAmount(preset.toString());
                setCustomAmount('');
              }}
              className={`py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                amount === preset.toString() && !customAmount
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600'
                  : 'border-slate-200 dark:border-slate-700 hover:border-primary-300'
              }`}
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Amount */}
      <div>
        <label className="block text-sm font-medium mb-2">{t('customAmount')}</label>
        <Input
          type="number"
          value={customAmount}
          onChange={(e) => {
            setCustomAmount(e.target.value);
            setAmount('');
          }}
          placeholder={t('customAmount')}
          min="1"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium mb-2">
          {t('reason')} <span className="text-red-500">*</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('reasonRequired')}
          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 resize-none"
          rows={3}
        />
      </div>

      {/* Summary */}
      {(amount || customAmount) && description && (
        <div className={`p-3 rounded-lg ${
          adjustType === 'add' 
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
        }`}>
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-600 dark:text-slate-300">{t('currentBalance')}:</span>
            <span className="font-semibold">{user.pointsBalance}</span>
          </div>
          <div className="flex justify-between items-center text-sm mt-1">
            <span className="text-slate-600 dark:text-slate-300">
              {adjustType === 'add' ? t('grantPoints') : t('deductPoints')}:
            </span>
            <span className={`font-semibold ${adjustType === 'add' ? 'text-green-600' : 'text-red-600'}`}>
              {adjustType === 'add' ? '+' : '-'}{customAmount || amount}
            </span>
          </div>
          <div className="border-t border-slate-200 dark:border-slate-700 mt-2 pt-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t('newBalance')}:</span>
              <span className={`text-lg font-bold ${
                adjustType === 'add' ? 'text-green-600' : 'text-red-600'
              }`}>
                {user.pointsBalance + (adjustType === 'add' ? parseInt(customAmount || amount) : -parseInt(customAmount || amount))}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
        <Button variant="outline" onClick={onCancel} disabled={isSaving}>
          {t('cancel')}
        </Button>
        <Button 
          onClick={handleSubmit}
          disabled={isSaving || (!amount && !customAmount) || !description.trim()}
          className={adjustType === 'add' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Coins className="h-4 w-4 mr-2" />
          )}
          {adjustType === 'add' ? t('grantPoints') : t('deductPoints')}
        </Button>
      </div>
    </div>
  );
}
