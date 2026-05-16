# Admin Backend Requirements

> **Document Version:** 1.0  
> **Last Updated:** 2024-03-16  
> **Status:** Implemented

---

## 1. Overview

### 1.1 Purpose
Provide administrators with a comprehensive backend to manage the entire platform, including users, organizations, content, invitations, and system settings.

### 1.2 Access Control
- **Route:** `/admin`
- **Authentication:** Required
- **Roles:** Owner, Admin only
- **Protection:** Middleware checks user role before allowing access

---

## 2. Admin Layout

### 2.1 Structure
```
┌────────────────────────────────────────────────────────────────┐
│                           Header                                │
│   Logo | Admin Panel | Search | Notifications | User Menu      │
├──────────────┬─────────────────────────────────────────────────┤
│              │                                                  │
│   Sidebar    │              Main Content Area                  │
│              │                                                  │
│  Dashboard   │   ┌────────────────────────────────────────┐    │
│  Users       │   │         Page Header                     │    │
│  Orgs        │   │   Title | Description | Actions         │    │
│  Content     │   └────────────────────────────────────────┘    │
│  Invitations │                                                  │
│  Roles       │   ┌────────────────────────────────────────┐    │
│  Orders      │   │         Content Section                 │    │
│  Emails      │   │   Tables / Forms / Cards                │    │
│  Analytics   │   │                                          │    │
│  Settings    │   └────────────────────────────────────────┘    │
│              │                                                  │
└──────────────┴─────────────────────────────────────────────────┘
```

### 2.2 Sidebar Navigation

| Menu Item | Icon | Route | Description |
|-----------|------|-------|-------------|
| Dashboard | LayoutDashboard | `/admin` | Overview & stats |
| Users | Users | `/admin/users` | User management |
| Organizations | Building2 | `/admin/organizations` | Org management |
| Content | FileText | `/admin/content` | Content management |
| Invitations | Mail | `/admin/invitations` | Invitation management |
| Roles | Shield | `/admin/roles` | Role management |
| Orders | ShoppingCart | `/admin/orders` | Order management |
| Emails | Mail | `/admin/emails` | Email templates |
| Analytics | BarChart3 | `/admin/analytics` | System analytics |
| Settings | Settings | `/admin/settings` | System settings |

---

## 3. Pages & Features

### 3.1 Admin Dashboard (`/admin`)

#### Stats Cards
- [x] Total Users (with growth percentage)
- [x] New Users This Month
- [x] Verified Users
- [x] Admin Users Count
- [x] Subscription Stats

#### Charts
- [x] User Registration Chart (7-day bar chart)
- [x] Subscription Status Summary

#### Quick Actions
- [x] Refresh data
- [x] Export data
- [x] Manage Users button

#### Recent Users Table
- [x] Name & Email
- [x] Role badge
- [x] Registration time
- [x] View All link

---

### 3.2 Users Page (`/admin/users`)

#### Features
- [x] User list table with pagination
- [x] Search by name/email
- [x] Filter by role
- [x] Filter by status (verified/unverified)
- [x] Create new user
- [x] Edit user details
- [x] Change user role
- [x] Delete user
- [x] Bulk actions

#### Table Columns
| Column | Sortable | Description |
|--------|----------|-------------|
| User | No | Avatar, name, email |
| Role | Yes | Role badge |
| Status | Yes | Verified/Unverified |
| Created | Yes | Registration date |
| Actions | No | Edit, Delete |

#### Create/Edit User Modal
| Field | Type | Validation |
|-------|------|------------|
| Name | Text | Required |
| Email | Email | Required, unique |
| Password | Password | Required (create only) |
| Role | Select | owner/admin/member/viewer |

---

### 3.3 Organizations Page (`/admin/organizations`)

#### Features
- [x] Organization list table
- [x] Search by name
- [x] Create new organization
- [x] Edit organization
- [x] View members
- [x] Delete organization

#### Table Columns
| Column | Description |
|--------|-------------|
| Organization | Logo, name, slug |
| Owner | Owner name |
| Members | Member count |
| Created | Creation date |
| Actions | Edit, Members, Delete |

---

### 3.4 Invitations Page (`/admin/invitations`)

#### Features
- [x] Invitation list table
- [x] Filter by status (pending/accepted/revoked/expired)
- [x] Search by email
- [x] Create new invitation
- [x] Resend invitation
- [x] Revoke invitation
- [x] Delete invitation

#### Stats Dashboard
- Total invitations count
- Pending invitations
- Accepted invitations
- Expired invitations

#### Table Columns
| Column | Description |
|--------|-------------|
| Email | Invitee email |
| Organization | Target organization |
| Role | Invited role |
| Status | Status badge |
| Invited By | Inviter name |
| Expires | Expiration date |
| Actions | Resend, Delete |

---

### 3.5 Content Page (`/admin/content`)

#### Features
- [x] Blog posts management
- [x] Create new post
- [x] Edit post
- [x] Publish/unpublish
- [x] Delete post

#### Table Columns
| Column | Description |
|--------|-------------|
| Title | Post title |
| Author | Author name |
| Status | Draft/Published |
| Date | Published date |
| Actions | Edit, Delete |

---

### 3.6 Roles Page (`/admin/roles`)

#### Features
- [x] View role definitions
- [x] Permission matrix
- [ ] Custom role creation (planned)

#### Default Roles
| Role | System Access | Description |
|------|---------------|-------------|
| Owner | Full | Platform owner, all permissions |
| Admin | Full | Administrator, manage users & content |
| Member | Dashboard | Regular user, create content |
| Viewer | Dashboard | Read-only access |

---

### 3.7 Orders Page (`/admin/orders`)

#### Features
- [ ] Order list table
- [ ] Filter by status
- [ ] View order details
- [ ] Process refunds

---

### 3.8 Emails Page (`/admin/emails`)

#### Features
- [ ] Email template list
- [ ] Edit templates
- [ ] Preview emails
- [ ] Send test emails

---

### 3.9 Analytics Page (`/admin/analytics`)

#### Features
- [ ] User growth charts
- [ ] Revenue metrics
- [ ] Popular content
- [ ] Geographic distribution

---

### 3.10 Settings Page (`/admin/settings`)

#### Features
- [ ] Site name & description
- [ ] Logo upload
- [ ] Email configuration
- [ ] Payment settings
- [ ] Feature toggles

---

## 4. API Endpoints

### 4.1 Stats API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Dashboard statistics |

### 4.2 User Management APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/users` | List users |
| POST | `/api/admin/users` | Create user |
| GET | `/api/admin/users/:id` | Get user |
| PUT | `/api/admin/users/:id` | Update user |
| DELETE | `/api/admin/users/:id` | Delete user |

### 4.3 Organization Management APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/organizations` | List organizations |
| POST | `/api/admin/organizations` | Create organization |
| GET | `/api/admin/organizations/:id` | Get organization |
| PUT | `/api/admin/organizations/:id` | Update organization |
| DELETE | `/api/admin/organizations/:id` | Delete organization |

### 4.4 Invitation Management APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/invitations` | List all invitations |
| POST | `/api/admin/invitations` | Create invitation |
| DELETE | `/api/admin/invitations/:id` | Delete invitation |
| POST | `/api/admin/invitations/:id/resend` | Resend invitation |

### 4.5 Content Management APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/content` | List content |
| POST | `/api/admin/content` | Create content |
| PUT | `/api/admin/content/:id` | Update content |
| DELETE | `/api/admin/content/:id` | Delete content |

---

## 5. Permission Matrix

### 5.1 Admin Features by Role

| Feature | Owner | Admin | Member | Viewer |
|---------|:-----:|:-----:|:------:|:------:|
| View Dashboard | ✅ | ✅ | ❌ | ❌ |
| Manage Users | ✅ | ✅ | ❌ | ❌ |
| Create Admin | ✅ | ❌ | ❌ | ❌ |
| Manage Organizations | ✅ | ✅ | ❌ | ❌ |
| Manage Content | ✅ | ✅ | ❌ | ❌ |
| Manage Invitations | ✅ | ✅ | ❌ | ❌ |
| System Settings | ✅ | ❌ | ❌ | ❌ |
| View Analytics | ✅ | ✅ | ❌ | ❌ |

---

## 6. UI Components

### 6.1 Shared Components
- DataTable (sortable, searchable, paginated)
- StatsCard
- Modal (create, edit, confirm delete)
- Badge (role, status)
- Button (with loading state)
- Search input
- Filter dropdowns
- Pagination controls

### 6.2 Layout Components
- AdminSidebar
- AdminHeader
- PageHeader
- ContentCard

---

## 7. Error Handling

| Error | HTTP Code | Message |
|-------|-----------|---------|
| Unauthorized | 401 | Authentication required |
| Forbidden | 403 | Admin access required |
| Not Found | 404 | Resource not found |
| Validation Error | 400 | Invalid input data |
| Server Error | 500 | Internal server error |

---

## 8. Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-03-16 | Initial documentation |
