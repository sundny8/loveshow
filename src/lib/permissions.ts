import type { Role } from '@/db/schema';

// Permission definitions
export const permissions = {
  // Organization permissions
  'organization:read': ['owner', 'admin', 'member', 'viewer'],
  'organization:update': ['owner', 'admin'],
  'organization:delete': ['owner'],
  'organization:manage_billing': ['owner', 'admin'],

  // Member permissions
  'member:read': ['owner', 'admin', 'member', 'viewer'],
  'member:invite': ['owner', 'admin'],
  'member:remove': ['owner', 'admin'],
  'member:update_role': ['owner'],

  // Content permissions
  'content:read': ['owner', 'admin', 'member', 'viewer'],
  'content:create': ['owner', 'admin', 'member'],
  'content:update': ['owner', 'admin', 'member'],
  'content:delete': ['owner', 'admin'],
  'content:publish': ['owner', 'admin'],

  // Settings permissions
  'settings:read': ['owner', 'admin', 'member', 'viewer'],
  'settings:update': ['owner', 'admin'],

  // Analytics permissions
  'analytics:read': ['owner', 'admin', 'member'],
  'analytics:export': ['owner', 'admin'],
} as const;

export type Permission = keyof typeof permissions;

export function hasPermission(role: Role, permission: Permission): boolean {
  const allowedRoles = permissions[permission];
  return (allowedRoles as readonly Role[]).includes(role);
}

export function hasAnyPermission(role: Role, permissionList: Permission[]): boolean {
  return permissionList.some((permission) => hasPermission(role, permission));
}

export function hasAllPermissions(role: Role, permissionList: Permission[]): boolean {
  return permissionList.every((permission) => hasPermission(role, permission));
}

// Role hierarchy
const roleHierarchy: Record<Role, number> = {
  owner: 4,
  admin: 3,
  member: 2,
  viewer: 1,
};

export function isRoleHigherOrEqual(userRole: Role, requiredRole: Role): boolean {
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

export function canAssignRole(assignerRole: Role, targetRole: Role): boolean {
  // Only owners can assign admin or owner roles
  if (targetRole === 'owner') return false; // Owner can't be assigned
  if (targetRole === 'admin') return assignerRole === 'owner';
  // Admins can assign member or viewer roles
  return isRoleHigherOrEqual(assignerRole, 'admin');
}

// Role labels for UI
export const roleLabels: Record<Role, string> = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
  viewer: 'Viewer',
};

export const roleDescriptions: Record<Role, string> = {
  owner: 'Full access to all resources and settings. Can transfer ownership.',
  admin: 'Can manage members, settings, and most resources.',
  member: 'Can create and edit content. Limited access to settings.',
  viewer: 'Read-only access to content and resources.',
};
