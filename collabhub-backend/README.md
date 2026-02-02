# CollabHub Backend

Production-grade AWS Serverless Backend for CollabHub (Founder OS) - A SaaS platform connecting Founders, Talent, and Investors.

## Tech Stack

| Component | Service |
|-----------|---------|
| API Layer | Amazon API Gateway (REST) |
| Compute | AWS Lambda (Node.js 20.x) |
| Authentication | Amazon Cognito (JWT + RBAC) |
| Database | Amazon DynamoDB (Single-Table) |
| File Storage | Amazon S3 + CloudFront |
| Async Events | Amazon EventBridge + SQS |
| Payments | Stripe (Webhooks) |
| IaC | AWS CDK (TypeScript) |

## Project Structure

```
collabhub-backend/
├── bin/                    # CDK app entry point
├── lib/
│   └── stacks/            # CDK stack definitions
│       ├── api-stack.ts       # API Gateway + Lambdas
│       ├── auth-stack.ts      # Cognito User Pool
│       ├── database-stack.ts  # DynamoDB
│       ├── events-stack.ts    # EventBridge + SQS
│       ├── monitoring-stack.ts # CloudWatch
│       └── storage-stack.ts   # S3 + CloudFront
├── src/
│   ├── functions/         # Lambda handlers
│   │   ├── auth/             # Authentication
│   │   ├── users/            # User management
│   │   ├── startups/         # Startup CRUD
│   │   ├── applications/     # Job applications
│   │   ├── chat/             # Messaging
│   │   ├── payments/         # Stripe integration
│   │   ├── admin/            # Admin operations
│   │   ├── notifications/    # User notifications
│   │   └── workers/          # SQS consumers
│   ├── lib/               # Shared utilities
│   │   ├── dynamodb/         # DynamoDB client
│   │   └── utils/            # Response helpers
│   ├── schemas/           # Zod validation schemas
│   └── types/             # TypeScript types
├── docs/                  # Architecture documentation
└── tests/                 # Test suites
```

## User Roles (RBAC)

| Role | Description |
|------|-------------|
| FOUNDER | Create/manage startups, review applications |
| TALENT | Browse startups, apply to roles |
| INVESTOR | View startups, request access |
| ADMIN | Full platform access, moderation |

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh tokens

### Users
- `GET /api/users/profile` - Get own profile
- `PUT /api/users/profile` - Update profile
- `GET /api/users/{userId}` - Get user by ID

### Startups
- `POST /api/startups` - Create startup (FOUNDER)
- `GET /api/startups` - List startups
- `GET /api/startups/mine` - List my startups (FOUNDER)
- `GET /api/startups/{id}` - Get startup
- `PUT /api/startups/{id}` - Update startup
- `DELETE /api/startups/{id}` - Delete startup
- `PUT /api/startups/{id}/visibility` - Update visibility
- `POST /api/startups/{id}/roles` - Create role
- `GET /api/startups/{id}/roles` - List roles

### Applications
- `POST /api/applications` - Submit application (TALENT)
- `GET /api/applications` - List applications (FOUNDER)
- `GET /api/applications/mine` - My applications (TALENT)
- `GET /api/applications/{id}` - Get application
- `PUT /api/applications/{id}/status` - Update status
- `DELETE /api/applications/{id}` - Withdraw

### Chat
- `POST /api/chat/conversations` - Create conversation
- `GET /api/chat/conversations` - List conversations
- `POST /api/chat/conversations/{id}/messages` - Send message
- `GET /api/chat/conversations/{id}/messages` - List messages
- `PUT /api/chat/conversations/{id}/read` - Mark read

### Payments
- `POST /api/payments/checkout` - Create checkout session
- `POST /api/payments/portal` - Customer portal
- `GET /api/payments/subscription` - Get subscription
- `POST /api/payments/webhook` - Stripe webhook

### Admin
- `GET /api/admin/users` - List all users
- `PUT /api/admin/users/{id}/ban` - Ban user
- `PUT /api/admin/users/{id}/unban` - Unban user
- `PUT /api/admin/startups/{id}/moderate` - Moderate startup
- `GET /api/admin/metrics` - Platform metrics
- `GET /api/admin/audit-logs` - Audit logs

### Notifications
- `GET /api/notifications` - List notifications
- `PUT /api/notifications/{id}/read` - Mark read
- `PUT /api/notifications/read-all` - Mark all read

## Deployment

### Prerequisites
- AWS Account with admin access
- AWS CLI v2 configured
- Node.js 20.x
- npm/yarn

### Setup

1. Install dependencies:
```bash
cd collabhub-backend
npm install
```

2. Configure AWS CLI:
```bash
aws configure
```

3. Store Stripe secrets:
```bash
aws ssm put-parameter --name "/collabhub/stripe/secret-key" --value "sk_xxx" --type "SecureString"
aws ssm put-parameter --name "/collabhub/stripe/webhook-secret" --value "whsec_xxx" --type "SecureString"
```

4. Bootstrap CDK (once per account/region):
```bash
npx cdk bootstrap
```

5. Deploy:
```bash
npx cdk deploy --all
```

## Environment Variables

Lambda functions receive these automatically:
- `TABLE_NAME` - DynamoDB table name
- `USER_POOL_ID` - Cognito user pool ID
- `USER_POOL_CLIENT_ID` - Cognito client ID
- `ASSETS_BUCKET` - S3 bucket name
- `EVENT_BUS_NAME` - EventBridge bus name
- `REGION` - AWS region

## Security

- IAM least privilege policies per Lambda
- JWT validation via Cognito authorizer
- RBAC enforced at Lambda level
- Secrets in SSM Parameter Store
- Data encryption at rest and in transit
- Audit logging for all actions

## Cost Estimate (Production)

| Service | ~Monthly |
|---------|----------|
| Lambda | $20-50 |
| API Gateway | $15-30 |
| DynamoDB | $25-100 |
| Cognito | Free (50k MAU) |
| S3 | $5-20 |
| CloudWatch | $10-30 |
| **Total** | **$75-230** |

## License

Proprietary - CollabHub Inc.
