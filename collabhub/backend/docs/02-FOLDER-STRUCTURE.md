# CollabHub Backend - Folder Structure

```
collabhub-backend/
│
├── bin/
│   └── collabhub.ts                    # CDK app entry point
│
├── lib/
│   ├── stacks/
│   │   ├── auth-stack.ts               # Cognito User Pool, Groups, Triggers
│   │   ├── api-stack.ts                # API Gateway REST API
│   │   ├── database-stack.ts           # DynamoDB tables, GSIs
│   │   ├── storage-stack.ts            # S3 buckets, CloudFront
│   │   ├── events-stack.ts             # EventBridge, SQS queues
│   │   └── monitoring-stack.ts         # CloudWatch dashboards, alarms
│   │
│   └── constructs/
│       ├── lambda-function.ts          # Reusable Lambda construct
│       ├── api-endpoint.ts             # Reusable API endpoint construct
│       └── cognito-authorizer.ts       # JWT authorizer construct
│
├── src/
│   ├── functions/
│   │   ├── auth/
│   │   │   ├── pre-signup.ts           # Cognito pre-signup trigger
│   │   │   ├── post-confirmation.ts    # Cognito post-confirmation trigger
│   │   │   ├── pre-token-generation.ts # Add custom claims to JWT
│   │   │   └── custom-message.ts       # Custom email templates
│   │   │
│   │   ├── users/
│   │   │   ├── get-profile.ts          # GET /api/users/profile
│   │   │   ├── update-profile.ts       # PUT /api/users/profile
│   │   │   ├── get-user.ts             # GET /api/users/{userId}
│   │   │   ├── list-users.ts           # GET /api/users (admin)
│   │   │   └── delete-user.ts          # DELETE /api/users/{userId}
│   │   │
│   │   ├── startups/
│   │   │   ├── create-startup.ts       # POST /api/startups
│   │   │   ├── get-startup.ts          # GET /api/startups/{startupId}
│   │   │   ├── update-startup.ts       # PUT /api/startups/{startupId}
│   │   │   ├── delete-startup.ts       # DELETE /api/startups/{startupId}
│   │   │   ├── list-startups.ts        # GET /api/startups
│   │   │   ├── list-my-startups.ts     # GET /api/startups/mine
│   │   │   └── update-visibility.ts    # PUT /api/startups/{id}/visibility
│   │   │
│   │   ├── applications/
│   │   │   ├── create-application.ts   # POST /api/applications
│   │   │   ├── get-application.ts      # GET /api/applications/{applicationId}
│   │   │   ├── list-applications.ts    # GET /api/applications
│   │   │   ├── list-my-applications.ts # GET /api/applications/mine
│   │   │   ├── update-status.ts        # PUT /api/applications/{id}/status
│   │   │   └── withdraw-application.ts # DELETE /api/applications/{id}
│   │   │
│   │   ├── access/
│   │   │   ├── request-access.ts       # POST /api/access/request
│   │   │   ├── grant-access.ts         # POST /api/access/grant
│   │   │   ├── revoke-access.ts        # DELETE /api/access/{accessId}
│   │   │   └── list-access.ts          # GET /api/access
│   │   │
│   │   ├── chat/
│   │   │   ├── create-conversation.ts  # POST /api/chat/conversations
│   │   │   ├── get-conversation.ts     # GET /api/chat/conversations/{id}
│   │   │   ├── list-conversations.ts   # GET /api/chat/conversations
│   │   │   ├── send-message.ts         # POST /api/chat/messages
│   │   │   ├── list-messages.ts        # GET /api/chat/conversations/{id}/messages
│   │   │   └── mark-read.ts            # PUT /api/chat/messages/{id}/read
│   │   │
│   │   ├── payments/
│   │   │   ├── create-checkout.ts      # POST /api/payments/checkout
│   │   │   ├── create-portal.ts        # POST /api/payments/portal
│   │   │   ├── get-subscription.ts     # GET /api/payments/subscription
│   │   │   ├── cancel-subscription.ts  # DELETE /api/payments/subscription
│   │   │   └── webhook.ts              # POST /api/payments/webhook (Stripe)
│   │   │
│   │   ├── admin/
│   │   │   ├── list-users.ts           # GET /api/admin/users
│   │   │   ├── ban-user.ts             # PUT /api/admin/users/{id}/ban
│   │   │   ├── unban-user.ts           # PUT /api/admin/users/{id}/unban
│   │   │   ├── moderate-startup.ts     # PUT /api/admin/startups/{id}/moderate
│   │   │   ├── get-metrics.ts          # GET /api/admin/metrics
│   │   │   └── get-audit-logs.ts       # GET /api/admin/audit-logs
│   │   │
│   │   └── workers/
│   │       ├── notification-worker.ts  # SQS: Send notifications
│   │       ├── email-worker.ts         # SQS: Send emails
│   │       └── audit-worker.ts         # SQS: Process audit events
│   │
│   ├── lib/
│   │   ├── dynamodb/
│   │   │   ├── client.ts               # DynamoDB document client
│   │   │   ├── operations.ts           # Common CRUD operations
│   │   │   └── queries.ts              # GSI query helpers
│   │   │
│   │   ├── cognito/
│   │   │   ├── client.ts               # Cognito client
│   │   │   └── utils.ts                # Token parsing, role extraction
│   │   │
│   │   ├── stripe/
│   │   │   ├── client.ts               # Stripe client
│   │   │   ├── products.ts             # Product/Price management
│   │   │   └── webhooks.ts             # Webhook signature verification
│   │   │
│   │   ├── s3/
│   │   │   ├── client.ts               # S3 client
│   │   │   └── presigned.ts            # Presigned URL generation
│   │   │
│   │   ├── events/
│   │   │   ├── eventbridge.ts          # EventBridge publisher
│   │   │   └── sqs.ts                  # SQS sender
│   │   │
│   │   └── utils/
│   │       ├── response.ts             # API response helpers
│   │       ├── validation.ts           # Input validation (Zod)
│   │       ├── errors.ts               # Custom error classes
│   │       ├── logger.ts               # Structured logging
│   │       └── constants.ts            # App constants
│   │
│   ├── middleware/
│   │   ├── auth.ts                     # JWT validation middleware
│   │   ├── rbac.ts                     # Role-based access control
│   │   ├── validate.ts                 # Request validation
│   │   └── audit.ts                    # Audit logging middleware
│   │
│   ├── schemas/
│   │   ├── user.schema.ts              # User validation schemas
│   │   ├── startup.schema.ts           # Startup validation schemas
│   │   ├── application.schema.ts       # Application validation schemas
│   │   ├── chat.schema.ts              # Chat validation schemas
│   │   └── payment.schema.ts           # Payment validation schemas
│   │
│   └── types/
│       ├── api.types.ts                # API request/response types
│       ├── dynamodb.types.ts           # DynamoDB entity types
│       ├── cognito.types.ts            # Cognito types
│       └── events.types.ts             # Event types
│
├── tests/
│   ├── unit/
│   │   ├── functions/                  # Lambda unit tests
│   │   └── lib/                        # Library unit tests
│   │
│   ├── integration/
│   │   ├── api/                        # API integration tests
│   │   └── db/                         # Database integration tests
│   │
│   └── e2e/
│       └── flows/                      # End-to-end flow tests
│
├── scripts/
│   ├── seed-data.ts                    # Seed development data
│   ├── migrate.ts                      # Data migration scripts
│   └── cleanup.ts                      # Resource cleanup
│
├── docs/
│   ├── 01-ARCHITECTURE.md
│   ├── 02-FOLDER-STRUCTURE.md
│   ├── 03-DYNAMODB-SCHEMA.md
│   ├── 04-API-ENDPOINTS.md
│   ├── 05-IAM-PERMISSIONS.md
│   └── 06-DEPLOYMENT-GUIDE.md
│
├── .env.example                        # Environment variables template
├── .eslintrc.js                        # ESLint configuration
├── .prettierrc                         # Prettier configuration
├── cdk.json                            # CDK configuration
├── jest.config.js                      # Jest configuration
├── package.json                        # Dependencies
├── tsconfig.json                       # TypeScript configuration
└── README.md                           # Project documentation
```

## Key Design Decisions

### 1. Domain-Based Lambda Organization
- Each domain (users, startups, applications, etc.) has its own folder
- Single responsibility per Lambda function
- Shared utilities in `/src/lib/`

### 2. CDK Stack Separation
- **auth-stack**: Cognito resources (can be deployed independently)
- **database-stack**: DynamoDB (foundational, deploy first)
- **api-stack**: API Gateway + Lambdas (depends on auth + database)
- **storage-stack**: S3 + CloudFront
- **events-stack**: EventBridge + SQS (async processing)
- **monitoring-stack**: CloudWatch (deploy last)

### 3. Middleware Pattern
- Reusable middleware for auth, RBAC, validation
- Applied via wrapper functions in Lambdas

### 4. Type Safety
- TypeScript throughout
- Zod schemas for runtime validation
- Shared types in `/src/types/`
