# API Reference

> **Document Version:** 1.0  
> **Last Updated:** 2024-03-16  
> **Status:** Active

---

## 1. Overview

### 1.1 Base URL
```
Production: https://your-domain.com/api
Development: http://localhost:3000/api
```

### 1.2 Authentication
All authenticated endpoints require a valid session cookie obtained through the authentication flow.

### 1.3 Response Format
```typescript
// Success Response
{
  "data": { ... },
  "message": "Success"
}

// Error Response
{
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

### 1.4 HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Internal Server Error |

---

## 2. Authentication APIs

### 2.1 Sign Up
Create a new user account.

```
POST /api/auth/sign-up
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "user": {
    "id": "user_abc123",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "member"
  }
}
```

### 2.2 Sign In
Authenticate user and create session.

```
POST /api/auth/sign-in
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

### 2.3 Sign Out
End current session.

```
POST /api/auth/sign-out
```

### 2.4 Get Session
Get current authenticated session.

```
GET /api/auth/session
```

**Response:**
```json
{
  "user": {
    "id": "user_abc123",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "member"
  }
}
```

---

## 3. User APIs

### 3.1 Get Profile
```
GET /api/user/profile
```

**Response:**
```json
{
  "id": "user_abc123",
  "name": "John Doe",
  "email": "john@example.com",
  "image": "https://...",
  "role": "member",
  "createdAt": "2024-01-15T10:00:00Z"
}
```

### 3.2 Update Profile
```
PUT /api/user/profile
```

**Request Body:**
```json
{
  "name": "John Smith",
  "image": "https://..."
}
```

---

## 4. Organization APIs

### 4.1 List User Organizations
Get all organizations the current user belongs to.

```
GET /api/organizations
```

**Response:**
```json
{
  "organizations": [
    {
      "id": "org_abc123",
      "name": "Acme Corp",
      "slug": "acme-corp",
      "logo": "https://...",
      "role": "owner",
      "memberCount": 5
    }
  ]
}
```

### 4.2 Create Organization
```
POST /api/organizations
```

**Request Body:**
```json
{
  "name": "New Organization",
  "slug": "new-org",
  "description": "Optional description"
}
```

### 4.3 Get Organization Details
```
GET /api/organizations/:id
```

### 4.4 Update Organization
Requires: Admin or Owner role in organization.

```
PUT /api/organizations/:id
```

**Request Body:**
```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "logo": "https://..."
}
```

### 4.5 Delete Organization
Requires: Owner role in organization.

```
DELETE /api/organizations/:id
```

### 4.6 Leave Organization
```
POST /api/organizations/:id/leave
```

### 4.7 Transfer Ownership
Requires: Owner role in organization.

```
POST /api/organizations/:id/transfer
```

**Request Body:**
```json
{
  "newOwnerId": "user_xyz789"
}
```

---

## 5. Member APIs

### 5.1 List Organization Members
```
GET /api/organizations/:id/members
```

**Response:**
```json
{
  "members": [
    {
      "id": "member_abc",
      "userId": "user_123",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "admin",
      "joinedAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

### 5.2 Update Member Role
Requires: Admin or Owner role.

```
PUT /api/organizations/:id/members/:memberId
```

**Request Body:**
```json
{
  "role": "admin"
}
```

### 5.3 Remove Member
Requires: Admin or Owner role.

```
DELETE /api/organizations/:id/members/:memberId
```

---

## 6. Invitation APIs

### 6.1 List Organization Invitations
Requires: Admin or Owner role.

```
GET /api/organizations/:id/invitations
```

**Response:**
```json
{
  "invitations": [
    {
      "id": "inv_abc123",
      "email": "new@example.com",
      "role": "member",
      "status": "pending",
      "expiresAt": "2024-03-23T10:00:00Z",
      "createdAt": "2024-03-16T10:00:00Z"
    }
  ]
}
```

### 6.2 Create Invitation
Requires: Admin or Owner role.

```
POST /api/organizations/:id/invitations
```

**Request Body:**
```json
{
  "email": "new@example.com",
  "role": "member"
}
```

### 6.3 Revoke Invitation
Requires: Admin or Owner role.

```
DELETE /api/organizations/:id/invitations/:invitationId
```

### 6.4 Accept Invitation
```
POST /api/invitations/:token/accept
```

### 6.5 Decline Invitation
```
POST /api/invitations/:token/decline
```

### 6.6 Get Invitation by Token
```
GET /api/invitations/:token
```

---

## 7. Admin APIs

> All admin APIs require `owner` or `admin` system role.

### 7.1 Dashboard Stats
```
GET /api/admin/stats
```

**Response:**
```json
{
  "stats": {
    "users": {
      "total": 150,
      "thisMonth": 25,
      "lastMonth": 20,
      "growth": "25.00",
      "admins": 3,
      "verified": 120
    },
    "subscriptions": {
      "total": 50,
      "active": 45,
      "pro": 30
    }
  },
  "recentUsers": [...],
  "dailyStats": [...]
}
```

### 7.2 User Management

#### List Users
```
GET /api/admin/users?search=john&role=admin&page=1&limit=10
```

#### Create User
```
POST /api/admin/users
```

**Request Body:**
```json
{
  "name": "New User",
  "email": "new@example.com",
  "password": "password123",
  "role": "member"
}
```

#### Update User
```
PUT /api/admin/users/:id
```

#### Delete User
```
DELETE /api/admin/users/:id
```

### 7.3 Organization Management

#### List Organizations
```
GET /api/admin/organizations
```

#### Create Organization
```
POST /api/admin/organizations
```

#### Update Organization
```
PUT /api/admin/organizations/:id
```

#### Delete Organization
```
DELETE /api/admin/organizations/:id
```

#### Get Organization Members
```
GET /api/admin/organizations/:id/members
```

### 7.4 Invitation Management

#### List All Invitations
```
GET /api/admin/invitations?status=pending&search=email
```

#### Create Invitation
```
POST /api/admin/invitations
```

**Request Body:**
```json
{
  "email": "new@example.com",
  "organizationId": "org_abc123",
  "role": "member"
}
```

#### Delete Invitation
```
DELETE /api/admin/invitations/:id
```

#### Resend Invitation
```
POST /api/admin/invitations/:id/resend
```

---

## 8. Blog APIs

### 8.1 List Posts (Public)
```
GET /api/blog/posts?page=1&limit=9
```

### 8.2 Get Post by Slug (Public)
```
GET /api/blog/posts/:slug
```

### 8.3 Admin: Create Post
```
POST /api/admin/posts
```

**Request Body:**
```json
{
  "title": "Post Title",
  "slug": "post-title",
  "excerpt": "Brief description",
  "content": "Full MDX content...",
  "featuredImage": "https://...",
  "category": "tutorials",
  "status": "published"
}
```

### 8.4 Admin: Update Post
```
PUT /api/admin/posts/:id
```

### 8.5 Admin: Delete Post
```
DELETE /api/admin/posts/:id
```

---

## 9. Error Codes

| Code | Description |
|------|-------------|
| `UNAUTHORIZED` | Authentication required |
| `FORBIDDEN` | Insufficient permissions |
| `NOT_FOUND` | Resource not found |
| `VALIDATION_ERROR` | Invalid input data |
| `EMAIL_EXISTS` | Email already registered |
| `INVALID_CREDENTIALS` | Wrong email or password |
| `EXPIRED_TOKEN` | Token has expired |
| `INVALID_TOKEN` | Invalid or malformed token |
| `RATE_LIMITED` | Too many requests |
| `INTERNAL_ERROR` | Server error |

---

## 10. Rate Limiting

| Endpoint | Limit |
|----------|-------|
| Auth endpoints | 10 requests/minute |
| API endpoints | 100 requests/minute |
| Admin endpoints | 50 requests/minute |

---

## 11. Webhooks (Planned)

### 11.1 Available Events
- `user.created`
- `user.deleted`
- `organization.created`
- `organization.deleted`
- `member.joined`
- `member.left`
- `subscription.created`
- `subscription.cancelled`

---

## 12. Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-03-16 | Initial documentation |
