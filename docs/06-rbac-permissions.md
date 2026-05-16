# Role-Based Access Control (RBAC) Requirements

> **Document Version:** 1.0  
> **Last Updated:** 2024-03-16  
> **Status:** Implemented

---

## 1. Overview

### 1.1 Purpose
Implement a two-level RBAC system that provides granular access control at both system and organization levels.

### 1.2 Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    System Level RBAC                         │
│         (Controls access to /admin and system features)     │
│                                                             │
│   Owner > Admin > Member > Viewer                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│               Organization Level RBAC                        │
│        (Controls access within each organization)           │
│                                                             │
│   Owner > Admin > Member > Viewer                           │
│   (Per organization, independent from system role)          │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. System Level Roles

### 2.1 Role Hierarchy

| Role | Level | Description |
|------|-------|-------------|
| **Owner** | 1 (Highest) | Platform owner with full system access |
| **Admin** | 2 | System administrator |
| **Member** | 3 | Regular authenticated user |
| **Viewer** | 4 (Lowest) | Read-only user |

### 2.2 Role Definitions

#### Owner
- Full access to all system features
- Can manage all users including admins
- Can access system-critical settings
- Can transfer platform ownership
- Only one owner per system (or limited)

#### Admin
- Access to admin panel `/admin`
- Can manage users (except promote to owner)
- Can manage all organizations
- Can manage content and invitations
- Cannot access owner-only settings

#### Member
- Access to user dashboard `/dashboard`
- Can create and manage own content
- Can create and manage own organizations
- Cannot access admin panel

#### Viewer
- Read-only access to dashboard
- Cannot create content
- Cannot modify settings
- Limited API access

---

## 3. Organization Level Roles

### 3.1 Role Hierarchy (Per Organization)

| Role | Description |
|------|-------------|
| **Owner** | Organization creator, full control |
| **Admin** | Can manage members and settings |
| **Member** | Can access org resources |
| **Viewer** | Read-only access |

### 3.2 Permission Matrix

| Permission | Owner | Admin | Member | Viewer |
|------------|:-----:|:-----:|:------:|:------:|
| View organization | ✅ | ✅ | ✅ | ✅ |
| Edit organization details | ✅ | ✅ | ❌ | ❌ |
| Delete organization | ✅ | ❌ | ❌ | ❌ |
| View members | ✅ | ✅ | ✅ | ✅ |
| Invite members | ✅ | ✅ | ❌ | ❌ |
| Remove members | ✅ | ✅ | ❌ | ❌ |
| Change member roles | ✅ | ✅* | ❌ | ❌ |
| View invitations | ✅ | ✅ | ❌ | ❌ |
| Manage invitations | ✅ | ✅ | ❌ | ❌ |
| Transfer ownership | ✅ | ❌ | ❌ | ❌ |

*Admin cannot promote to Owner or demote Owner

---

## 4. Permission System

### 4.1 Permission Definitions
```typescript
const permissions = {
  // User management
  'user:read': ['owner', 'admin'],
  'user:create': ['owner', 'admin'],
  'user:update': ['owner', 'admin'],
  'user:delete': ['owner', 'admin'],
  'user:promote': ['owner'],
  
  // Organization management (system level)
  'org:read': ['owner', 'admin'],
  'org:create': ['owner', 'admin', 'member'],
  'org:update': ['owner', 'admin'],
  'org:delete': ['owner', 'admin'],
  
  // Content management
  'content:read': ['owner', 'admin', 'member', 'viewer'],
  'content:create': ['owner', 'admin', 'member'],
  'content:update': ['owner', 'admin'],
  'content:delete': ['owner', 'admin'],
  
  // Admin access
  'admin:access': ['owner', 'admin'],
  'admin:settings': ['owner'],
  
  // Member management (organization level)
  'member:read': ['owner', 'admin', 'member', 'viewer'],
  'member:invite': ['owner', 'admin'],
  'member:remove': ['owner', 'admin'],
  'member:role': ['owner', 'admin'],
};
```

### 4.2 Permission Check Function
```typescript
type Role = 'owner' | 'admin' | 'member' | 'viewer';
type Permission = keyof typeof permissions;

function hasPermission(userRole: Role, permission: Permission): boolean {
  const allowedRoles = permissions[permission];
  return allowedRoles.includes(userRole);
}

// Usage
if (hasPermission(user.role, 'admin:access')) {
  // Allow access to admin panel
}
```

---

## 5. Implementation

### 5.1 Database Schema

#### Users Table
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT,
  role TEXT DEFAULT 'member',  -- System-level role
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Organization Members Table
```sql
CREATE TABLE organization_members (
  id TEXT PRIMARY KEY,
  organization_id TEXT REFERENCES organizations(id),
  user_id TEXT REFERENCES users(id),
  role TEXT DEFAULT 'member',  -- Organization-level role
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);
```

### 5.2 Middleware Protection

#### Admin Route Protection
```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const session = await getSession(request);
  
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!session) {
      return NextResponse.redirect(new URL('/auth/signin', request.url));
    }
    
    const user = await getUserById(session.userId);
    if (!hasPermission(user.role, 'admin:access')) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }
  
  return NextResponse.next();
}
```

#### API Route Protection
```typescript
// Example: /api/admin/users/route.ts
export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id)
  });
  
  if (!hasPermission(user.role, 'user:read')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  // Proceed with request
}
```

### 5.3 Organization Role Helper
```typescript
async function getUserOrgRole(
  userId: string, 
  organizationId: string
): Promise<Role | null> {
  const member = await db.query.organizationMembers.findFirst({
    where: and(
      eq(organizationMembers.userId, userId),
      eq(organizationMembers.organizationId, organizationId)
    )
  });
  
  return member?.role as Role || null;
}

// Check if user is admin/owner of org
async function isOrgAdmin(userId: string, orgId: string): Promise<boolean> {
  const role = await getUserOrgRole(userId, orgId);
  return role === 'owner' || role === 'admin';
}
```

---

## 6. UI Permission Rendering

### 6.1 Conditional Rendering
```tsx
function OrganizationSettings({ org, userRole }) {
  const isAdmin = userRole === 'owner' || userRole === 'admin';
  
  return (
    <div>
      <h1>{org.name}</h1>
      
      {/* Only admins can see settings */}
      {isAdmin && (
        <Button onClick={handleEdit}>Edit Settings</Button>
      )}
      
      {/* Only owners can delete */}
      {userRole === 'owner' && (
        <Button variant="destructive" onClick={handleDelete}>
          Delete Organization
        </Button>
      )}
    </div>
  );
}
```

### 6.2 Navigation Filtering
```tsx
const adminNavItems = [
  { label: 'Dashboard', href: '/admin', permission: 'admin:access' },
  { label: 'Users', href: '/admin/users', permission: 'user:read' },
  { label: 'Settings', href: '/admin/settings', permission: 'admin:settings' },
];

function AdminNav({ userRole }) {
  return (
    <nav>
      {adminNavItems
        .filter(item => hasPermission(userRole, item.permission))
        .map(item => (
          <Link key={item.href} href={item.href}>{item.label}</Link>
        ))
      }
    </nav>
  );
}
```

---

## 7. Role Management

### 7.1 Setting Admin Role
```bash
# Via Drizzle Studio
npm run db:studio
# Update user role in the users table

# Via SQL
UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
```

### 7.2 Role Transition Rules

| From | To | Allowed By |
|------|-----|------------|
| viewer | member | Admin, Owner |
| member | admin | Owner |
| admin | owner | Owner (transfer) |
| owner | admin | Owner (self-demote) |
| any | viewer | Admin, Owner |

---

## 8. Security Considerations

### 8.1 Best Practices
- Always check permissions on the server side
- Never trust client-side role information alone
- Use database-level constraints where possible
- Log all role changes for audit trail
- Implement rate limiting on sensitive operations

### 8.2 Common Vulnerabilities to Prevent
- **Privilege Escalation:** Users modifying their own role
- **IDOR:** Accessing resources of other organizations
- **Broken Access Control:** Bypassing UI restrictions via API

---

## 9. Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-03-16 | Initial documentation |
