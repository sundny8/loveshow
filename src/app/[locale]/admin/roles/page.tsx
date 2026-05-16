'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { 
  Shield, 
  Crown, 
  Users, 
  Eye,
  Check,
  X,
} from 'lucide-react';

const roles = [
  {
    id: 'owner',
    name: 'Owner',
    description: 'Full access to all resources and settings. Can transfer ownership.',
    icon: Crown,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    permissions: {
      'Organization': ['Read', 'Update', 'Delete', 'Manage Billing'],
      'Members': ['Read', 'Invite', 'Remove', 'Update Role'],
      'Content': ['Read', 'Create', 'Update', 'Delete', 'Publish'],
      'Settings': ['Read', 'Update'],
      'Analytics': ['Read', 'Export'],
    },
  },
  {
    id: 'admin',
    name: 'Admin',
    description: 'Can manage members, settings, and most resources.',
    icon: Shield,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    permissions: {
      'Organization': ['Read', 'Update', 'Manage Billing'],
      'Members': ['Read', 'Invite', 'Remove'],
      'Content': ['Read', 'Create', 'Update', 'Delete', 'Publish'],
      'Settings': ['Read', 'Update'],
      'Analytics': ['Read', 'Export'],
    },
  },
  {
    id: 'member',
    name: 'Member',
    description: 'Can create and edit content. Limited access to settings.',
    icon: Users,
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    permissions: {
      'Organization': ['Read'],
      'Members': ['Read'],
      'Content': ['Read', 'Create', 'Update'],
      'Settings': ['Read'],
      'Analytics': ['Read'],
    },
  },
  {
    id: 'viewer',
    name: 'Viewer',
    description: 'Read-only access to content and resources.',
    icon: Eye,
    color: 'text-slate-600',
    bgColor: 'bg-slate-100 dark:bg-slate-800',
    permissions: {
      'Organization': ['Read'],
      'Members': ['Read'],
      'Content': ['Read'],
      'Settings': ['Read'],
      'Analytics': [],
    },
  },
];

const allPermissions = {
  'Organization': ['Read', 'Update', 'Delete', 'Manage Billing'],
  'Members': ['Read', 'Invite', 'Remove', 'Update Role'],
  'Content': ['Read', 'Create', 'Update', 'Delete', 'Publish'],
  'Settings': ['Read', 'Update'],
  'Analytics': ['Read', 'Export'],
};

export default function AdminRolesPage() {
  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Roles & Permissions</h1>
        <p className="text-slate-500">Manage user roles and their access permissions</p>
      </div>

      {/* Role Cards */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {roles.map((role) => {
          const Icon = role.icon;
          return (
            <Card key={role.id}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${role.bgColor}`}>
                    <Icon className={`h-5 w-5 ${role.color}`} />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{role.name}</CardTitle>
                    <CardDescription>{role.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(role.permissions).map(([category, perms]) => (
                    <div key={category} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{category}</span>
                      <div className="flex gap-1">
                        {perms.length > 0 ? (
                          perms.map((perm) => (
                            <span
                              key={perm}
                              className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                            >
                              {perm}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400">No access</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Permissions Matrix */}
      <Card>
        <CardHeader>
          <CardTitle>Permissions Matrix</CardTitle>
          <CardDescription>Complete overview of all role permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left p-3 text-sm font-medium text-slate-500">Permission</th>
                  {roles.map((role) => (
                    <th key={role.id} className="text-center p-3 text-sm font-medium text-slate-500">
                      {role.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(allPermissions).map(([category, perms]) => (
                  <>
                    <tr key={category} className="bg-slate-50 dark:bg-slate-800/50">
                      <td colSpan={5} className="p-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {category}
                      </td>
                    </tr>
                    {perms.map((perm) => (
                      <tr key={`${category}-${perm}`} className="border-b border-slate-100 dark:border-slate-800">
                        <td className="p-3 text-sm text-slate-600 dark:text-slate-300 pl-6">{perm}</td>
                        {roles.map((role) => {
                          const hasPermission = role.permissions[category as keyof typeof role.permissions]?.includes(perm);
                          return (
                            <td key={role.id} className="text-center p-3">
                              {hasPermission ? (
                                <Check className="h-5 w-5 text-green-500 mx-auto" />
                              ) : (
                                <X className="h-5 w-5 text-slate-300 dark:text-slate-600 mx-auto" />
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Info */}
      <div className="mt-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <h4 className="font-medium text-blue-700 dark:text-blue-400 mb-1">About Role Management</h4>
        <p className="text-sm text-blue-600 dark:text-blue-300">
          Role permissions are system-defined and cannot be modified. To change a user&apos;s access level, 
          assign them a different role from the Users page.
        </p>
      </div>
    </div>
  );
}
