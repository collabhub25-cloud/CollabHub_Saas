# CollabHub - Product Requirements Document

## Original Problem Statement
Build a production-grade SaaS platform called CollabHub (Founder OS) connecting Founders, Talent, and Investors with:
- AWS Serverless Backend (API Gateway, Lambda, DynamoDB, Cognito, S3, EventBridge, SQS, Stripe)
- Next.js/React Frontend with role-based dashboards
- RBAC enforced at Lambda level

## User Personas

### Founder
- Creates and manages startups
- Posts roles/positions
- Reviews talent applications
- Chats with approved talent/investors
- Views analytics and metrics

### Talent
- Browses public startups
- Applies to open roles
- Chats with founders after application approval
- Manages profile and skills

### Investor
- Discovers startups (PUBLIC + INVESTORS_ONLY visibility)
- Requests access to pitch decks
- Chats with founders after access approval
- Tracks portfolio

### Admin
- Full platform access
- User moderation (ban/unban)
- Startup moderation
- Platform metrics and audit logs

## Core Requirements (Implemented)

### Backend
- [x] AWS CDK Infrastructure (TypeScript)
- [x] DynamoDB Single-Table Design (10 entities, 4 GSIs)
- [x] Cognito User Pool + Groups (RBAC)
- [x] API Gateway REST API (60+ endpoints)
- [x] Lambda Functions (40+ handlers)
- [x] S3 + CloudFront (Asset storage)
- [x] EventBridge + SQS (Async processing)
- [x] Stripe Integration (Subscriptions + Webhooks)
- [x] CloudWatch Monitoring (Dashboards + Alarms)

### Frontend (Existing)
- [x] Landing, Pricing, About, Contact pages
- [x] Authentication (Login, Signup, Forgot Password)
- [x] Role-based Dashboards
- [x] Startup Discovery
- [x] Talent Discovery
- [x] Messaging

## What's Been Implemented (February 2, 2025)

### Backend (/app/collabhub-backend/)
```
├── bin/collabhub.ts           # CDK entry point
├── lib/stacks/                # 6 CDK stacks
├── src/functions/             # 40+ Lambda handlers
├── src/lib/                   # Shared utilities
├── src/schemas/               # Zod validation
├── src/types/                 # TypeScript types
├── docs/                      # Architecture docs
└── package.json               # Dependencies
```

### Documentation
- Architecture overview
- Folder structure
- DynamoDB schema (10 entities)
- API endpoints (60+)
- IAM permissions (least privilege)
- Deployment guide

## Prioritized Backlog

### P0 - Critical (Done)
- [x] Complete backend infrastructure
- [x] All Lambda functions implemented
- [x] RBAC enforced at Lambda level
- [x] Stripe webhook handlers
- [x] Documentation

### P1 - Important (Pending)
- [ ] Deploy to AWS with credentials
- [ ] Complete pending frontend pages:
  - /startups (My Startups management)
  - /applications (Application inbox)
  - /profile (User profile editor)
  - /settings (Account settings)
  - /notifications (Notification center)
- [ ] Wire frontend to backend APIs

### P2 - Nice to Have
- [ ] WebSocket support for real-time chat
- [ ] Email templates via SES
- [ ] Push notifications
- [ ] Analytics dashboard
- [ ] Team management features
- [ ] Investor portfolio tracking

## Next Tasks
1. Deploy backend with AWS credentials
2. Store Stripe secrets in SSM
3. Create first admin user
4. Complete frontend pages
5. Integration testing
