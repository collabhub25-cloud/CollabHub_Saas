# CollabHub - DynamoDB Single-Table Design

## Table Configuration

| Property | Value |
|----------|-------|
| Table Name | `collabhub-main` |
| Partition Key | `PK` (String) |
| Sort Key | `SK` (String) |
| Billing Mode | PAY_PER_REQUEST (On-Demand) |
| Encryption | AWS_OWNED_CMK |

## Global Secondary Indexes (GSIs)

| GSI Name | Partition Key | Sort Key | Purpose |
|----------|---------------|----------|---------|
| GSI1 | `GSI1PK` | `GSI1SK` | Reverse lookups, user queries |
| GSI2 | `GSI2PK` | `GSI2SK` | Status-based queries |
| GSI3 | `entityType` | `createdAt` | Type + time range queries |
| GSI4 | `email` | - | Email lookup (sparse) |

## Entity Definitions

### 1. USER Entity
```
PK: USER#{userId}
SK: PROFILE

Attributes:
- userId: string (Cognito sub)
- email: string
- role: enum (FOUNDER | TALENT | INVESTOR | ADMIN)
- firstName: string
- lastName: string
- avatarUrl: string (optional)
- bio: string (optional)
- skills: string[] (optional, for TALENT)
- linkedinUrl: string (optional)
- status: enum (ACTIVE | BANNED | PENDING_VERIFICATION)
- stripeCustomerId: string (optional)
- subscriptionStatus: enum (NONE | ACTIVE | CANCELLED | PAST_DUE)
- subscriptionTier: enum (FREE | PRO | ENTERPRISE)
- entityType: "USER"
- createdAt: ISO8601
- updatedAt: ISO8601

GSI1PK: ROLE#{role}
GSI1SK: USER#{userId}
GSI2PK: STATUS#{status}
GSI2SK: USER#{userId}
GSI4: email (for email lookup)
```

### 2. STARTUP Entity
```
PK: STARTUP#{startupId}
SK: METADATA

Attributes:
- startupId: string (ULID)
- founderId: string (userId)
- name: string
- tagline: string
- description: string
- industry: string
- stage: enum (IDEA | MVP | GROWTH | SCALE)
- fundingGoal: number (optional)
- fundingRaised: number (optional)
- logoUrl: string (optional)
- websiteUrl: string (optional)
- pitchDeckUrl: string (optional)
- visibility: enum (PUBLIC | PRIVATE | INVESTORS_ONLY)
- status: enum (DRAFT | PENDING_REVIEW | ACTIVE | SUSPENDED)
- teamSize: number
- location: string
- tags: string[]
- entityType: "STARTUP"
- createdAt: ISO8601
- updatedAt: ISO8601

GSI1PK: FOUNDER#{founderId}
GSI1SK: STARTUP#{startupId}
GSI2PK: VISIBILITY#{visibility}#STATUS#{status}
GSI2SK: STARTUP#{startupId}
```

### 3. STARTUP_ROLE (Team Members)
```
PK: STARTUP#{startupId}
SK: ROLE#{roleId}

Attributes:
- roleId: string (ULID)
- startupId: string
- title: string
- description: string
- type: enum (FULL_TIME | PART_TIME | CONTRACT | EQUITY_ONLY)
- compensation: string (optional)
- equityRange: string (optional)
- skills: string[]
- isOpen: boolean
- applicantCount: number
- entityType: "STARTUP_ROLE"
- createdAt: ISO8601
- updatedAt: ISO8601

GSI1PK: OPEN_ROLES
GSI1SK: {createdAt}#{roleId} (for browsing open roles)
```

### 4. APPLICATION Entity
```
PK: APPLICATION#{applicationId}
SK: METADATA

Attributes:
- applicationId: string (ULID)
- startupId: string
- roleId: string
- applicantId: string (userId)
- coverLetter: string
- resumeUrl: string (optional)
- status: enum (PENDING | REVIEWING | SHORTLISTED | ACCEPTED | REJECTED | WITHDRAWN)
- founderNotes: string (optional, private)
- entityType: "APPLICATION"
- createdAt: ISO8601
- updatedAt: ISO8601

GSI1PK: APPLICANT#{applicantId}
GSI1SK: APPLICATION#{applicationId}
GSI2PK: STARTUP#{startupId}#ROLE#{roleId}
GSI2SK: STATUS#{status}#{createdAt}
```

### 5. ACCESS_REQUEST Entity (Investor Access)
```
PK: ACCESS#{accessId}
SK: METADATA

Attributes:
- accessId: string (ULID)
- requesterId: string (userId - investor)
- startupId: string
- founderId: string
- message: string (optional)
- status: enum (PENDING | APPROVED | REJECTED | REVOKED)
- accessLevel: enum (VIEW_PROFILE | VIEW_DECK | FULL_ACCESS)
- grantedAt: ISO8601 (optional)
- expiresAt: ISO8601 (optional)
- entityType: "ACCESS_REQUEST"
- createdAt: ISO8601
- updatedAt: ISO8601

GSI1PK: REQUESTER#{requesterId}
GSI1SK: ACCESS#{accessId}
GSI2PK: STARTUP#{startupId}
GSI2SK: STATUS#{status}#{createdAt}
```

### 6. CONVERSATION Entity
```
PK: CONVERSATION#{conversationId}
SK: METADATA

Attributes:
- conversationId: string (ULID)
- participants: string[] (userIds)
- type: enum (DIRECT | GROUP | STARTUP_CHANNEL)
- relatedStartupId: string (optional)
- relatedApplicationId: string (optional)
- lastMessageAt: ISO8601
- lastMessagePreview: string
- entityType: "CONVERSATION"
- createdAt: ISO8601
- updatedAt: ISO8601

GSI1PK: PARTICIPANT#{userId} (for each participant)
GSI1SK: CONVERSATION#{lastMessageAt}#{conversationId}
```

### 7. MESSAGE Entity
```
PK: CONVERSATION#{conversationId}
SK: MESSAGE#{messageId}

Attributes:
- messageId: string (ULID - time-sortable)
- conversationId: string
- senderId: string (userId)
- content: string
- type: enum (TEXT | FILE | SYSTEM)
- fileUrl: string (optional)
- readBy: string[] (userIds)
- entityType: "MESSAGE"
- createdAt: ISO8601

(No GSI needed - messages queried by conversation)
```

### 8. SUBSCRIPTION Entity
```
PK: USER#{userId}
SK: SUBSCRIPTION

Attributes:
- userId: string
- stripeCustomerId: string
- stripeSubscriptionId: string
- stripePriceId: string
- tier: enum (FREE | PRO | ENTERPRISE)
- status: enum (ACTIVE | CANCELLED | PAST_DUE | TRIALING)
- currentPeriodStart: ISO8601
- currentPeriodEnd: ISO8601
- cancelAtPeriodEnd: boolean
- entityType: "SUBSCRIPTION"
- createdAt: ISO8601
- updatedAt: ISO8601

GSI1PK: STRIPE_CUSTOMER#{stripeCustomerId}
GSI1SK: SUBSCRIPTION
GSI2PK: SUBSCRIPTION_STATUS#{status}
GSI2SK: USER#{userId}
```

### 9. AUDIT_LOG Entity
```
PK: AUDIT#{date} (YYYY-MM-DD)
SK: {timestamp}#{auditId}

Attributes:
- auditId: string (ULID)
- userId: string
- action: string (e.g., "USER_LOGIN", "STARTUP_CREATED")
- resourceType: string
- resourceId: string
- ipAddress: string
- userAgent: string
- metadata: map (optional)
- entityType: "AUDIT_LOG"
- createdAt: ISO8601

GSI1PK: USER#{userId}
GSI1SK: AUDIT#{createdAt}
```

### 10. NOTIFICATION Entity
```
PK: USER#{userId}
SK: NOTIFICATION#{notificationId}

Attributes:
- notificationId: string (ULID)
- userId: string
- type: enum (APPLICATION_UPDATE | ACCESS_REQUEST | MESSAGE | SYSTEM)
- title: string
- body: string
- relatedEntityType: string (optional)
- relatedEntityId: string (optional)
- isRead: boolean
- entityType: "NOTIFICATION"
- createdAt: ISO8601

(No additional GSI - queried by user)
```

## Access Patterns Summary

| Access Pattern | Key Condition | Index |
|----------------|--------------|-------|
| Get user by ID | PK = USER#{userId}, SK = PROFILE | Main |
| Get user by email | email = {email} | GSI4 |
| List users by role | GSI1PK = ROLE#{role} | GSI1 |
| List users by status | GSI2PK = STATUS#{status} | GSI2 |
| Get startup by ID | PK = STARTUP#{startupId}, SK = METADATA | Main |
| List startups by founder | GSI1PK = FOUNDER#{founderId} | GSI1 |
| List public startups | GSI2PK = VISIBILITY#PUBLIC#STATUS#ACTIVE | GSI2 |
| List startup roles | PK = STARTUP#{startupId}, SK begins_with ROLE# | Main |
| List open roles | GSI1PK = OPEN_ROLES | GSI1 |
| Get application by ID | PK = APPLICATION#{applicationId} | Main |
| List applications by user | GSI1PK = APPLICANT#{userId} | GSI1 |
| List applications for role | GSI2PK = STARTUP#{startupId}#ROLE#{roleId} | GSI2 |
| Get access request | PK = ACCESS#{accessId} | Main |
| List access by investor | GSI1PK = REQUESTER#{requesterId} | GSI1 |
| List access for startup | GSI2PK = STARTUP#{startupId} | GSI2 |
| Get conversation | PK = CONVERSATION#{conversationId} | Main |
| List user conversations | GSI1PK = PARTICIPANT#{userId} | GSI1 |
| List messages | PK = CONVERSATION#{conversationId}, SK begins_with MESSAGE# | Main |
| Get subscription | PK = USER#{userId}, SK = SUBSCRIPTION | Main |
| Find by Stripe customer | GSI1PK = STRIPE_CUSTOMER#{customerId} | GSI1 |
| List audit logs by date | PK = AUDIT#{date} | Main |
| List audit logs by user | GSI1PK = USER#{userId} | GSI1 |
| List notifications | PK = USER#{userId}, SK begins_with NOTIFICATION# | Main |

## Data Modeling Best Practices Applied

1. **Single Table Design**: All entities in one table with composite keys
2. **GSI Overloading**: GSIs serve multiple access patterns
3. **Sparse Indexes**: GSI4 only contains items with email attribute
4. **Time-Sortable IDs**: ULID for natural chronological ordering
5. **Denormalization**: Common query fields duplicated for efficiency
6. **TTL Support**: Ready for implementing data retention policies
