# Organization & Member Management Requirements

> **Document Version:** 1.1  
> **Last Updated:** 2024-03-16  
> **Status:** Implemented

---

## Table of Contents

1. [Overview](#overview)
2. [Data Model](#data-model)
3. [Role-Based Access Control (RBAC)](#role-based-access-control-rbac)
4. [User Dashboard Features](#user-dashboard-features)
5. [API Endpoints](#api-endpoints)
6. [UI Mockups](#ui-mockups)
7. [Implementation Plan](#implementation-plan)

---

## Overview

### Purpose

This document outlines the requirements for implementing organization and member management features in the user dashboard. These features enable:

- **Multi-tenant architecture**: Users can create and join multiple organizations
- **Team collaboration**: Organization owners can invite team members
- **Role-based permissions**: Different access levels within each organization

### Current State vs Target State

| Module | Admin Panel (`/admin`) | User Dashboard (`/dashboard`) |
|--------|:----------------------:|:-----------------------------:|
| Organizations | ✅ Full CRUD | ✅ Full CRUD |
| Members | ✅ Manage all | ✅ Manage (owner/admin) |
| Invitations | ✅ Full CRUD | ✅ Send/Cancel/Resend |
| Role Permissions | ✅ View only | ✅ Implemented |

---

## Data Model

### Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                          Users                              │
│  (Global users with system-level roles)                     │
│  - owner/admin: Can access /admin panel                     │
│  - member/viewer: Regular users                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ can belong to multiple
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Organizations                          │
│  (Teams / Companies / Workspaces)                           │
│  - Each org has one owner                                   │
│  - Multiple members with different roles                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ contains
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Organization Members                       │
│  - owner: Full control of the organization                  │
│  - admin: Manage members, settings                          │
│  - member: Normal access                                    │
│  - viewer: Read-only access                                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ invited via
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Invitations                            │
│  - Pending invitations with expiration                      │
│  - Token-based acceptance                                   │
└─────────────────────────────────────────────────────────────┘
```

### Database Schema

```typescript
// Users table
users {
  id: string (PK)
  name: string
  email: string (unique)
  emailVerified: boolean
  image: string | null
  role: 'owner' | 'admin' | 'member' | 'viewer'  // System-level role
  createdAt: timestamp
  updatedAt: timestamp
}

// Organizations table
organizations {
  id: string (PK)
  name: string
  slug: string (unique)
  logo: string | null
  ownerId: string (FK -> users.id)
  createdAt: timestamp
  updatedAt: timestamp
}

// Organization Members (junction table)
organization_members {
  id: string (PK)
  organizationId: string (FK -> organizations.id)
  userId: string (FK -> users.id)
  role: 'owner' | 'admin' | 'member' | 'viewer'  // Org-level role
  createdAt: timestamp
  updatedAt: timestamp
}

// Invitations table
invitations {
  id: string (PK)
  email: string
  organizationId: string (FK -> organizations.id)
  role: 'admin' | 'member' | 'viewer'
  token: string (unique)
  status: 'pending' | 'accepted' | 'expired' | 'revoked'
  invitedBy: string (FK -> users.id)
  expiresAt: timestamp
  createdAt: timestamp
  updatedAt: timestamp
}
```

### Two-Level RBAC

| Level | Scope | Roles | Purpose |
|-------|-------|-------|---------|
| **System** | Global (Admin Panel) | owner, admin, member, viewer | Controls who can access `/admin` |
| **Organization** | Per-Team | owner, admin, member, viewer | Controls permissions within a team |

---

## Role-Based Access Control (RBAC)

### Permission Matrix

| Action | Owner | Admin | Member | Viewer |
|--------|:-----:|:-----:|:------:|:------:|
| View org dashboard | ✅ | ✅ | ✅ | ✅ |
| View members list | ✅ | ✅ | ✅ | ✅ |
| Invite members | ✅ | ✅ | ❌ | ❌ |
| Remove members | ✅ | ✅ | ❌ | ❌ |
| Change member role | ✅ | ✅* | ❌ | ❌ |
| Edit org settings | ✅ | ✅ | ❌ | ❌ |
| View billing | ✅ | ✅ | ❌ | ❌ |
| Manage billing | ✅ | ❌ | ❌ | ❌ |
| Delete organization | ✅ | ❌ | ❌ | ❌ |
| Transfer ownership | ✅ | ❌ | ❌ | ❌ |
| Leave organization | ❌ | ✅ | ✅ | ✅ |

> *Admin can only assign roles: member, viewer (cannot promote to admin/owner)

### Role Descriptions

| Role | Description |
|------|-------------|
| **Owner** | Full control. Can delete org, transfer ownership, manage billing. Only one per org. |
| **Admin** | Can manage members and settings. Cannot delete org or manage billing. |
| **Member** | Standard access. Can use all features but cannot manage team. |
| **Viewer** | Read-only access. Can view but not modify anything. |

---

## User Dashboard Features

### 1. My Organizations Page

**Route:** `/dashboard/organizations`

**Features:**
- [x] List all organizations user belongs to
- [x] Show user's role in each organization
- [x] Show member count per organization
- [x] Create new organization button
- [ ] Join organization via invite code/link
- [ ] Quick switch between organizations

**UI Mockup:**
```
┌────────────────────────────────────────────────────────────────┐
│  My Organizations                              [+ Create New]  │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐│
│  │  🏢 Acme Inc    │  │  🏢 Side Project│  │  ➕ Join Org    ││
│  │                 │  │                 │  │                 ││
│  │  Role: Owner    │  │  Role: Member   │  │  Have an invite ││
│  │  👥 5 members   │  │  👥 3 members   │  │  code? Enter it ││
│  │                 │  │                 │  │  here.          ││
│  │  [Manage]       │  │  [View]         │  │  [Join]         ││
│  └─────────────────┘  └─────────────────┘  └─────────────────┘│
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

### 2. Organization Settings Page

**Route:** `/dashboard/organizations/[id]/settings`

**Tabs:**
- General Settings
- Members
- Invitations
- Billing (if applicable)

#### 2.1 General Settings Tab

**Features:**
- [x] Edit organization name
- [x] Edit organization slug
- [ ] Upload/change organization logo
- [x] Delete organization (owner only)

**UI Mockup:**
```
┌────────────────────────────────────────────────────────────────┐
│  ← Back to Organizations        Acme Inc Settings              │
├────────────────────────────────────────────────────────────────┤
│  [General] [Members] [Invitations] [Billing]                   │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Organization Profile                                          │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │                                                          │ │
│  │  Logo:  [🏢]  [Upload New]                               │ │
│  │                                                          │ │
│  │  Name:  [Acme Inc                    ]                   │ │
│  │                                                          │ │
│  │  Slug:  [acme-inc                    ]                   │ │
│  │         URL: app.example.com/org/acme-inc                │ │
│  │                                                          │ │
│  │                                    [Save Changes]        │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  ⚠️ Danger Zone                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Delete Organization                                     │ │
│  │  This will permanently delete Acme Inc and remove all    │ │
│  │  members. This action cannot be undone.                  │ │
│  │                                                          │ │
│  │  [Delete Organization]                                   │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

### 3. Members Management

**Route:** `/dashboard/organizations/[id]/members`

**Features:**
- [x] List all members with roles
- [ ] Search/filter members
- [x] Invite new member by email
- [x] Change member role (with permission check)
- [x] Remove member (with confirmation)
- [x] Transfer ownership (owner only)
- [x] Leave organization

**UI Mockup:**
```
┌────────────────────────────────────────────────────────────────┐
│  [General] [Members] [Invitations] [Billing]                   │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Team Members (5)                              [+ Invite]      │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  🔍 Search members...                                    │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  👤 Alice Johnson           alice@example.com            │ │
│  │     Owner                              [Transfer Owner ▼]│ │
│  ├──────────────────────────────────────────────────────────┤ │
│  │  👤 Bob Smith               bob@example.com              │ │
│  │     Admin                   [Change Role ▼] [Remove]     │ │
│  ├──────────────────────────────────────────────────────────┤ │
│  │  👤 Charlie Brown           charlie@example.com          │ │
│  │     Member                  [Change Role ▼] [Remove]     │ │
│  ├──────────────────────────────────────────────────────────┤ │
│  │  👤 Diana Prince            diana@example.com            │ │
│  │     Viewer                  [Change Role ▼] [Remove]     │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  [Leave Organization]                                    │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

### 4. Invitations Management

**Route:** `/dashboard/organizations/[id]/invitations`

**Features:**
- [x] View pending invitations
- [x] Resend invitation email
- [x] Cancel/revoke invitation
- [x] View invitation history

**UI Mockup:**
```
┌────────────────────────────────────────────────────────────────┐
│  [General] [Members] [Invitations] [Billing]                   │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Pending Invitations (2)                       [+ Invite]      │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  📧 eve@example.com                                      │ │
│  │     Role: Member    Expires: 7 days    [Resend] [Cancel] │ │
│  ├──────────────────────────────────────────────────────────┤ │
│  │  📧 frank@example.com                                    │ │
│  │     Role: Viewer    Expires: 5 days    [Resend] [Cancel] │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  Invitation History                                            │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  ✅ bob@example.com      Accepted     Jan 10, 2024       │ │
│  │  ❌ grace@example.com    Declined     Jan 8, 2024        │ │
│  │  ⏰ henry@example.com    Expired      Jan 5, 2024        │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

### 5. Invite Member Modal

**Features:**
- [x] Enter email address
- [x] Select role for invitee
- [x] Send invitation email
- [x] Show success/error feedback

**UI Mockup:**
```
┌────────────────────────────────────────────────────────────────┐
│  Invite Team Member                                      [✕]  │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Email Address                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  newuser@example.com                                     │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  Role                                                          │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  ○ Admin   - Can manage team members and settings        │ │
│  │  ● Member  - Can access all features                     │ │
│  │  ○ Viewer  - Read-only access                            │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  Personal Message (optional)                                   │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Hey! Join our team on StartFast...                      │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│                              [Cancel]  [Send Invitation]       │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

### 6. Accept Invitation Page

**Route:** `/invite/[token]`

**Features:**
- [x] Display invitation details
- [x] Accept or decline invitation
- [ ] Redirect to registration if new user
- [x] Auto-join if already logged in

**UI Mockup:**
```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│                         🏢                                     │
│                                                                │
│            You've been invited to join                         │
│                                                                │
│                    "Acme Inc"                                  │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │                                                          │ │
│  │  Invited by:  Alice Johnson (alice@example.com)          │ │
│  │  Your role:   Member                                     │ │
│  │  Expires:     January 20, 2024                           │ │
│  │                                                          │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│         [Accept Invitation]      [Decline]                     │
│                                                                │
│  ─────────────────────────────────────────────────────────────│
│                                                                │
│  Don't have an account? You'll be prompted to create one      │
│  after accepting the invitation.                               │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### Organizations

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/organizations` | List user's organizations | User |
| `POST` | `/api/organizations` | Create new organization | User |
| `GET` | `/api/organizations/[id]` | Get organization details | Member |
| `PUT` | `/api/organizations/[id]` | Update organization | Admin+ |
| `DELETE` | `/api/organizations/[id]` | Delete organization | Owner |
| `POST` | `/api/organizations/[id]/leave` | Leave organization | Member |

### Members

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/organizations/[id]/members` | List members | Member |
| `POST` | `/api/organizations/[id]/members/invite` | Invite member | Admin+ |
| `PUT` | `/api/organizations/[id]/members/[userId]` | Change role | Admin+ |
| `DELETE` | `/api/organizations/[id]/members/[userId]` | Remove member | Admin+ |
| `POST` | `/api/organizations/[id]/transfer` | Transfer ownership | Owner |

### Invitations

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/organizations/[id]/invitations` | List invitations | Admin+ |
| `DELETE` | `/api/organizations/[id]/invitations/[inviteId]` | Cancel invite | Admin+ |
| `POST` | `/api/organizations/[id]/invitations/[inviteId]/resend` | Resend invite | Admin+ |
| `GET` | `/api/invitations/[token]` | Get invitation details | Public |
| `POST` | `/api/invitations/[token]/accept` | Accept invitation | User |
| `POST` | `/api/invitations/[token]/decline` | Decline invitation | User |

---

## Implementation Plan

### Phase 1: Core Organization Features (High Priority)

| Task | Route/Component | Estimate |
|------|-----------------|----------|
| My Organizations list page | `/dashboard/organizations` | 4h |
| Create organization modal | Component | 2h |
| Organization API (list, create) | `/api/organizations` | 3h |
| Leave organization | API + UI | 2h |

**Total: ~11 hours**

### Phase 2: Organization Settings (High Priority)

| Task | Route/Component | Estimate |
|------|-----------------|----------|
| Settings page layout with tabs | `/dashboard/organizations/[id]/settings` | 2h |
| General settings tab | Component | 3h |
| Update/Delete organization API | `/api/organizations/[id]` | 2h |

**Total: ~7 hours**

### Phase 3: Members Management (High Priority)

| Task | Route/Component | Estimate |
|------|-----------------|----------|
| Members list tab | Component | 3h |
| Invite member modal | Component | 2h |
| Change role functionality | Component | 2h |
| Remove member | Component | 1h |
| Members API endpoints | `/api/.../members` | 4h |

**Total: ~12 hours**

### Phase 4: Invitations (Medium Priority)

| Task | Route/Component | Estimate |
|------|-----------------|----------|
| Invitations tab | Component | 3h |
| Resend/Cancel invitation | Component | 2h |
| Accept invitation page | `/invite/[token]` | 4h |
| Invitation email template | Email | 2h |
| Invitations API | `/api/invitations` | 4h |

**Total: ~15 hours**

### Phase 5: Advanced Features (Low Priority)

| Task | Route/Component | Estimate |
|------|-----------------|----------|
| Transfer ownership | Component + API | 3h |
| Organization billing integration | Component | 8h |
| Activity log | Component | 4h |

**Total: ~15 hours**

---

## Summary

### Total Estimated Time

| Phase | Priority | Estimate |
|-------|----------|----------|
| Phase 1 | High | 11h |
| Phase 2 | High | 7h |
| Phase 3 | High | 12h |
| Phase 4 | Medium | 15h |
| Phase 5 | Low | 15h |
| **Total** | | **~60h** |

### Dependencies

```
Phase 1 (Organizations) 
    └── Phase 2 (Settings)
            └── Phase 3 (Members)
                    └── Phase 4 (Invitations)
                            └── Phase 5 (Advanced)
```

### Success Criteria

- [ ] Users can create and manage multiple organizations
- [ ] Users can invite team members via email
- [ ] Role-based permissions work correctly
- [ ] Invitation flow is complete (send → accept → join)
- [ ] All actions have proper authorization checks

---

## Appendix

### Common Use Cases

1. **Multi-tenant SaaS** (e.g., Slack, Notion)
   - Users join multiple organizations (workspaces)
   - Each organization has its own data, settings, billing
   - User role varies per organization

2. **Team Collaboration** (e.g., GitHub)
   - Organization = Company/Team
   - Members can have different permissions per project
   - Invite users via email to join teams

3. **B2B SaaS** (e.g., Stripe Dashboard)
   - Organization = Customer company
   - Company admin manages their team
   - Billing is per-organization

### Related Documents

- [Database Schema](/docs/database/schema)
- [Authentication Guide](/docs/auth/email)
- [Role Permissions](/docs/roles)
