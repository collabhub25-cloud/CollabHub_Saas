# CollabHub - REST API Endpoints

## Base URL
```
Production: https://api.collabhub.io
Staging: https://api-staging.collabhub.io
```

## Authentication
All protected endpoints require:
```
Authorization: Bearer {cognito_id_token}
```

## Response Format
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "requestId": "uuid",
    "timestamp": "ISO8601"
  }
}
```

## Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": { ... }
  },
  "meta": {
    "requestId": "uuid",
    "timestamp": "ISO8601"
  }
}
```

---

## 1. Authentication Endpoints

### POST /api/auth/register
Register a new user (creates Cognito user + DynamoDB profile)

**Access**: Public

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecureP@ss123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "FOUNDER"
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "email": "user@example.com",
    "message": "Verification email sent"
  }
}
```

---

### POST /api/auth/verify
Verify email with confirmation code

**Access**: Public

**Request Body**:
```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

---

### POST /api/auth/login
Authenticate user

**Access**: Public

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecureP@ss123"
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "idToken": "jwt...",
    "accessToken": "jwt...",
    "refreshToken": "token...",
    "expiresIn": 3600,
    "user": {
      "userId": "uuid",
      "email": "user@example.com",
      "role": "FOUNDER"
    }
  }
}
```

---

### POST /api/auth/refresh
Refresh tokens

**Access**: Public

**Request Body**:
```json
{
  "refreshToken": "token..."
}
```

---

### POST /api/auth/forgot-password
Initiate password reset

**Access**: Public

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

---

### POST /api/auth/reset-password
Complete password reset

**Access**: Public

**Request Body**:
```json
{
  "email": "user@example.com",
  "code": "123456",
  "newPassword": "NewSecureP@ss123"
}
```

---

### POST /api/auth/logout
Invalidate tokens

**Access**: Authenticated

---

## 2. User Endpoints

### GET /api/users/profile
Get current user's profile

**Access**: Authenticated (All roles)

**Response** (200):
```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "email": "user@example.com",
    "role": "FOUNDER",
    "firstName": "John",
    "lastName": "Doe",
    "avatarUrl": "https://...",
    "bio": "Serial entrepreneur...",
    "subscriptionTier": "PRO",
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

---

### PUT /api/users/profile
Update current user's profile

**Access**: Authenticated (All roles)

**Request Body**:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "bio": "Updated bio...",
  "skills": ["React", "Node.js"],
  "linkedinUrl": "https://linkedin.com/in/johndoe"
}
```

---

### GET /api/users/{userId}
Get user by ID (limited fields based on relationship)

**Access**: Authenticated (All roles, limited data)

---

### GET /api/users/upload-url
Get presigned URL for avatar upload

**Access**: Authenticated (All roles)

**Query Parameters**:
- `fileType`: mime type (image/jpeg, image/png)

**Response** (200):
```json
{
  "success": true,
  "data": {
    "uploadUrl": "https://s3.amazonaws.com/...",
    "fileUrl": "https://cdn.collabhub.io/avatars/...",
    "expiresIn": 300
  }
}
```

---

## 3. Startup Endpoints

### POST /api/startups
Create a new startup

**Access**: FOUNDER only

**Request Body**:
```json
{
  "name": "TechCorp",
  "tagline": "Building the future",
  "description": "Full description...",
  "industry": "SaaS",
  "stage": "MVP",
  "fundingGoal": 500000,
  "websiteUrl": "https://techcorp.io",
  "visibility": "PUBLIC",
  "location": "San Francisco, CA",
  "tags": ["AI", "B2B", "SaaS"]
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "startupId": "01HQ...",
    "name": "TechCorp",
    "status": "PENDING_REVIEW"
  }
}
```

---

### GET /api/startups
List startups (filtered by visibility + role)

**Access**: Authenticated (All roles)

**Query Parameters**:
- `page`: number (default: 1)
- `limit`: number (default: 20, max: 100)
- `industry`: string (optional)
- `stage`: string (optional)
- `search`: string (optional)

**Response** (200):
```json
{
  "success": true,
  "data": {
    "startups": [ ... ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "hasMore": true
    }
  }
}
```

---

### GET /api/startups/mine
List current founder's startups

**Access**: FOUNDER only

---

### GET /api/startups/{startupId}
Get startup details

**Access**: Authenticated (visibility rules apply)

---

### PUT /api/startups/{startupId}
Update startup

**Access**: FOUNDER (owner only)

---

### DELETE /api/startups/{startupId}
Delete startup (soft delete)

**Access**: FOUNDER (owner only)

---

### PUT /api/startups/{startupId}/visibility
Update startup visibility

**Access**: FOUNDER (owner only)

**Request Body**:
```json
{
  "visibility": "INVESTORS_ONLY"
}
```

---

### POST /api/startups/{startupId}/roles
Create a role/position

**Access**: FOUNDER (owner only)

**Request Body**:
```json
{
  "title": "Senior Engineer",
  "description": "Looking for...",
  "type": "FULL_TIME",
  "compensation": "$120k-150k",
  "equityRange": "0.5-1%",
  "skills": ["React", "Node.js", "AWS"],
  "isOpen": true
}
```

---

### GET /api/startups/{startupId}/roles
List startup roles

**Access**: Authenticated (All roles)

---

### PUT /api/startups/{startupId}/roles/{roleId}
Update role

**Access**: FOUNDER (owner only)

---

### DELETE /api/startups/{startupId}/roles/{roleId}
Delete role

**Access**: FOUNDER (owner only)

---

### GET /api/startups/{startupId}/upload-url
Get presigned URL for startup assets

**Access**: FOUNDER (owner only)

**Query Parameters**:
- `type`: logo | pitchDeck
- `fileType`: mime type

---

## 4. Application Endpoints

### POST /api/applications
Submit application to a role

**Access**: TALENT only

**Request Body**:
```json
{
  "startupId": "01HQ...",
  "roleId": "01HQ...",
  "coverLetter": "I am excited to apply..."
}
```

---

### GET /api/applications
List applications (filtered by role)

**Access**: FOUNDER (for their startups), ADMIN

**Query Parameters**:
- `startupId`: string (required for FOUNDER)
- `roleId`: string (optional)
- `status`: string (optional)

---

### GET /api/applications/mine
List current user's applications

**Access**: TALENT only

---

### GET /api/applications/{applicationId}
Get application details

**Access**: TALENT (own), FOUNDER (for their startup), ADMIN

---

### PUT /api/applications/{applicationId}/status
Update application status

**Access**: FOUNDER (for their startup)

**Request Body**:
```json
{
  "status": "SHORTLISTED",
  "notes": "Great candidate..."
}
```

---

### DELETE /api/applications/{applicationId}
Withdraw application

**Access**: TALENT (own application only)

---

### GET /api/applications/{applicationId}/upload-url
Get presigned URL for resume upload

**Access**: TALENT only

---

## 5. Access Control Endpoints (Investor Access)

### POST /api/access/request
Request access to a startup

**Access**: INVESTOR only

**Request Body**:
```json
{
  "startupId": "01HQ...",
  "message": "Interested in learning more...",
  "requestedLevel": "VIEW_DECK"
}
```

---

### GET /api/access
List access requests

**Access**: FOUNDER (for their startups), INVESTOR (own requests), ADMIN

---

### POST /api/access/{accessId}/grant
Grant access request

**Access**: FOUNDER (for their startup)

**Request Body**:
```json
{
  "accessLevel": "FULL_ACCESS",
  "expiresInDays": 30
}
```

---

### POST /api/access/{accessId}/reject
Reject access request

**Access**: FOUNDER (for their startup)

---

### DELETE /api/access/{accessId}
Revoke access

**Access**: FOUNDER (for their startup)

---

## 6. Chat Endpoints

### POST /api/chat/conversations
Create or get conversation

**Access**: Authenticated (permission rules apply)

**Request Body**:
```json
{
  "participantIds": ["userId1", "userId2"],
  "type": "DIRECT",
  "relatedStartupId": "01HQ..." 
}
```

---

### GET /api/chat/conversations
List user's conversations

**Access**: Authenticated

**Query Parameters**:
- `page`: number
- `limit`: number

---

### GET /api/chat/conversations/{conversationId}
Get conversation details

**Access**: Authenticated (participant only)

---

### POST /api/chat/conversations/{conversationId}/messages
Send message

**Access**: Authenticated (participant only)

**Request Body**:
```json
{
  "content": "Hello!",
  "type": "TEXT"
}
```

---

### GET /api/chat/conversations/{conversationId}/messages
List messages

**Access**: Authenticated (participant only)

**Query Parameters**:
- `limit`: number (default: 50)
- `before`: messageId (for pagination)

---

### PUT /api/chat/conversations/{conversationId}/read
Mark conversation as read

**Access**: Authenticated (participant only)

---

## 7. Payment Endpoints

### POST /api/payments/checkout
Create Stripe checkout session

**Access**: Authenticated

**Request Body**:
```json
{
  "priceId": "price_xxx",
  "successUrl": "https://app.collabhub.io/success",
  "cancelUrl": "https://app.collabhub.io/pricing"
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "sessionId": "cs_xxx",
    "url": "https://checkout.stripe.com/..."
  }
}
```

---

### POST /api/payments/portal
Create Stripe customer portal session

**Access**: Authenticated (with subscription)

---

### GET /api/payments/subscription
Get current subscription

**Access**: Authenticated

---

### DELETE /api/payments/subscription
Cancel subscription

**Access**: Authenticated (with subscription)

---

### POST /api/payments/webhook
Stripe webhook handler

**Access**: Public (Stripe signature verified)

---

## 8. Admin Endpoints

### GET /api/admin/users
List all users

**Access**: ADMIN only

**Query Parameters**:
- `page`, `limit`
- `role`: filter by role
- `status`: filter by status
- `search`: search by name/email

---

### PUT /api/admin/users/{userId}/ban
Ban user

**Access**: ADMIN only

**Request Body**:
```json
{
  "reason": "Violation of terms..."
}
```

---

### PUT /api/admin/users/{userId}/unban
Unban user

**Access**: ADMIN only

---

### PUT /api/admin/users/{userId}/role
Change user role

**Access**: ADMIN only

**Request Body**:
```json
{
  "role": "INVESTOR"
}
```

---

### GET /api/admin/startups
List all startups (including pending/suspended)

**Access**: ADMIN only

---

### PUT /api/admin/startups/{startupId}/moderate
Moderate startup

**Access**: ADMIN only

**Request Body**:
```json
{
  "status": "ACTIVE",
  "notes": "Approved after review"
}
```

---

### GET /api/admin/metrics
Get platform metrics

**Access**: ADMIN only

**Response** (200):
```json
{
  "success": true,
  "data": {
    "users": {
      "total": 5000,
      "byRole": { "FOUNDER": 1000, "TALENT": 3500, "INVESTOR": 500 },
      "newThisMonth": 250
    },
    "startups": {
      "total": 800,
      "active": 650,
      "pendingReview": 50
    },
    "applications": {
      "total": 15000,
      "thisMonth": 1200
    },
    "revenue": {
      "mrr": 25000,
      "subscriptions": { "PRO": 400, "ENTERPRISE": 50 }
    }
  }
}
```

---

### GET /api/admin/audit-logs
Get audit logs

**Access**: ADMIN only

**Query Parameters**:
- `startDate`, `endDate`
- `userId`
- `action`

---

## 9. Notification Endpoints

### GET /api/notifications
List user notifications

**Access**: Authenticated

**Query Parameters**:
- `page`, `limit`
- `unreadOnly`: boolean

---

### PUT /api/notifications/{notificationId}/read
Mark notification as read

**Access**: Authenticated (own notifications)

---

### PUT /api/notifications/read-all
Mark all notifications as read

**Access**: Authenticated

---

## Rate Limits

| Endpoint Category | Limit |
|-------------------|-------|
| Auth endpoints | 10 req/min per IP |
| Read endpoints | 100 req/min per user |
| Write endpoints | 30 req/min per user |
| Admin endpoints | 50 req/min per user |
| Webhook endpoints | 1000 req/min |

## HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 409 | Conflict (duplicate resource) |
| 429 | Too Many Requests |
| 500 | Internal Server Error |
