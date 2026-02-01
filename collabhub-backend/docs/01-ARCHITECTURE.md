# CollabHub Backend Architecture

## Overview
Production-grade AWS Serverless backend for CollabHub (Founder OS) - a SaaS platform connecting Founders, Talent, and Investors.

## Tech Stack (Final)
| Component | Service |
|-----------|---------|
| API Layer | Amazon API Gateway (REST) |
| Compute | AWS Lambda (Node.js 20.x) |
| Auth | Amazon Cognito (JWT + RBAC) |
| Database | Amazon DynamoDB (Single-Table) |
| File Storage | Amazon S3 |
| CDN | Amazon CloudFront |
| Async Events | Amazon EventBridge + SQS |
| Payments | Stripe (webhooks via API Gateway) |
| Monitoring | CloudWatch + CloudTrail |
| IaC | AWS CDK (TypeScript) |

## User Roles & RBAC
| Role | Description | Permissions |
|------|-------------|-------------|
| `FOUNDER` | Startup owners | Create/manage startups, review applications, chat with approved talent/investors |
| `TALENT` | Job seekers | Browse startups, apply, chat with approved founders |
| `INVESTOR` | Funding partners | View startups (visibility-controlled), request access, chat |
| `ADMIN` | Platform moderators | Full access, user management, content moderation |

## Architecture Diagram
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENTS                                         │
│                    (Next.js Frontend / Mobile Apps)                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AMAZON CLOUDFRONT (CDN)                              │
│                    (Static assets, API caching)                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      AMAZON API GATEWAY (REST)                               │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│  │ /api/auth   │ │ /api/users  │ │/api/startups│ │ /api/chat   │            │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘            │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                            │
│  │/api/apply   │ │/api/payments│ │ /api/admin  │                            │
│  └─────────────┘ └─────────────┘ └─────────────┘                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│   COGNITO   │ │   LAMBDA    │ │   LAMBDA    │ │   LAMBDA    │
│  Authorizer │ │   (Auth)    │ │  (Domain)   │ │  (Webhook)  │
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘
                    │               │               │
                    ▼               ▼               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AMAZON DYNAMODB                                      │
│                    (Single-Table Design + GSIs)                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        ▼                           ▼                           ▼
┌─────────────────┐     ┌─────────────────┐         ┌─────────────────┐
│   AMAZON S3     │     │  EVENTBRIDGE    │         │   CLOUDWATCH    │
│ (File Storage)  │     │  (Async Events) │         │   (Logging)     │
└─────────────────┘     └─────────────────┘         └─────────────────┘
                                │
                                ▼
                        ┌─────────────────┐
                        │   AMAZON SQS    │
                        │ (Queue Workers) │
                        └─────────────────┘
```

## Security Principles
1. **Least Privilege IAM** - Each Lambda has minimal required permissions
2. **JWT Validation** - All protected routes validate Cognito tokens
3. **RBAC Enforcement** - Role checks at API Gateway + Lambda level
4. **Data Encryption** - At-rest (KMS) and in-transit (TLS 1.3)
5. **Audit Logging** - CloudTrail for all API calls
6. **Input Validation** - Schema validation on all inputs
7. **Rate Limiting** - API Gateway throttling per user/IP
