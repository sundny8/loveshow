# Authentication Requirements

> **Document Version:** 1.0  
> **Last Updated:** 2024-03-16  
> **Status:** Implemented

---

## 1. Overview

### 1.1 Purpose
Provide secure user authentication with multiple sign-in options, session management, and account verification.

### 1.2 Technology
- **Library:** Better-Auth
- **Session:** JWT-based with HTTP-only cookies
- **Password:** bcrypt hashing

---

## 2. Features

### 2.1 Sign Up

#### Functional Requirements
- [x] Email/password registration
- [x] Name field (required)
- [x] Email validation (format + uniqueness)
- [x] Password strength requirements (min 8 characters)
- [x] Email verification (optional)
- [x] Terms acceptance checkbox
- [x] Redirect to dashboard on success

#### UI Components
- Email input field
- Password input field (with show/hide toggle)
- Name input field
- Submit button with loading state
- Link to sign in page
- OAuth provider buttons

### 2.2 Sign In

#### Functional Requirements
- [x] Email/password authentication
- [x] Remember me option
- [x] Failed login attempt handling
- [x] Redirect to intended page after login
- [x] Session creation and cookie management

#### UI Components
- Email input field
- Password input field
- Remember me checkbox
- Forgot password link
- Submit button with loading state
- Link to sign up page
- OAuth provider buttons

### 2.3 OAuth Authentication

#### Supported Providers
- [x] Google
- [x] GitHub
- [ ] Apple (planned)
- [ ] Twitter (planned)

#### Flow
1. User clicks OAuth provider button
2. Redirect to provider authorization page
3. User grants permission
4. Callback with authorization code
5. Exchange code for tokens
6. Create/link user account
7. Create session and redirect

### 2.4 Password Reset

#### Functional Requirements
- [x] Request password reset via email
- [x] Generate secure reset token
- [x] Token expiration (1 hour)
- [x] Email with reset link
- [x] New password form
- [x] Password confirmation
- [x] Invalidate token after use

### 2.5 Email Verification

#### Functional Requirements
- [x] Send verification email on signup
- [x] Generate secure verification token
- [x] Token expiration (24 hours)
- [x] Verify email endpoint
- [x] Resend verification email option

---

## 3. Session Management

### 3.1 Session Properties
```typescript
interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}
```

### 3.2 Session Configuration
- **Duration:** 7 days (default)
- **Refresh:** On each request
- **Storage:** HTTP-only secure cookie

### 3.3 Session Security
- Secure flag in production
- SameSite=Lax
- HTTP-only cookies
- CSRF protection

---

## 4. API Endpoints

### 4.1 Authentication APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/sign-up` | Create new user account |
| POST | `/api/auth/sign-in` | Authenticate user |
| POST | `/api/auth/sign-out` | End user session |
| GET | `/api/auth/session` | Get current session |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password with token |
| POST | `/api/auth/verify-email` | Verify email address |
| GET | `/api/auth/callback/[provider]` | OAuth callback handler |

### 4.2 Request/Response Examples

#### Sign Up
```typescript
// Request
POST /api/auth/sign-up
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123"
}

// Response
{
  "user": {
    "id": "user_123",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "member"
  },
  "session": {
    "token": "eyJhbG..."
  }
}
```

#### Sign In
```typescript
// Request
POST /api/auth/sign-in
{
  "email": "john@example.com",
  "password": "securepassword123"
}

// Response
{
  "user": {
    "id": "user_123",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "session": {
    "token": "eyJhbG..."
  }
}
```

---

## 5. Client-Side Hooks

### 5.1 useSession
```typescript
import { useSession } from '@/lib/auth-client';

// Usage
const { data: session, isPending, error } = useSession();

if (session) {
  console.log(session.user.name);
}
```

### 5.2 signIn/signOut
```typescript
import { signIn, signOut } from '@/lib/auth-client';

// Sign in
await signIn.email({
  email: 'john@example.com',
  password: 'password123'
});

// Sign out
await signOut();
```

---

## 6. Security Requirements

### 6.1 Password Policy
- Minimum 8 characters
- At least one number (recommended)
- At least one special character (recommended)
- Password hashed with bcrypt (cost factor 10)

### 6.2 Rate Limiting
- Sign in: 5 attempts per 15 minutes per IP
- Sign up: 3 accounts per hour per IP
- Password reset: 3 requests per hour per email

### 6.3 Security Headers
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin

---

## 7. Pages

### 7.1 Sign In Page
- **Route:** `/auth/signin`
- **Access:** Public (redirect if authenticated)

### 7.2 Sign Up Page
- **Route:** `/auth/signup`
- **Access:** Public (redirect if authenticated)

### 7.3 Forgot Password Page
- **Route:** `/auth/forgot-password`
- **Access:** Public

### 7.4 Reset Password Page
- **Route:** `/auth/reset-password?token=xxx`
- **Access:** Public (with valid token)

---

## 8. Error Handling

| Error Code | Description | User Message |
|------------|-------------|--------------|
| INVALID_CREDENTIALS | Wrong email/password | Invalid email or password |
| EMAIL_EXISTS | Email already registered | This email is already registered |
| WEAK_PASSWORD | Password too weak | Password must be at least 8 characters |
| EXPIRED_TOKEN | Token expired | This link has expired |
| INVALID_TOKEN | Token invalid | Invalid verification link |
| RATE_LIMITED | Too many attempts | Too many attempts, try again later |

---

## 9. Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-03-16 | Initial documentation |
