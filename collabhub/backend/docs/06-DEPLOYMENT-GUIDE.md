# CollabHub - Deployment Guide

## Prerequisites

### 1. AWS Account Setup
- AWS Account with admin access
- AWS CLI v2 installed and configured
- Node.js 20.x LTS
- npm or yarn

### 2. Required AWS Services (Verify Access)
- Lambda
- API Gateway
- DynamoDB
- Cognito
- S3
- EventBridge
- SQS
- CloudWatch
- IAM
- SSM Parameter Store

---

## Step 1: Environment Setup

### 1.1 Clone and Install
```bash
cd /app/collabhub-backend
npm install
```

### 1.2 Configure AWS CLI
```bash
# Configure credentials
aws configure

# Verify configuration
aws sts get-caller-identity
```

**Expected Output:**
```json
{
  "UserId": "AIDAXXXXXXXXXXXXXXXXX",
  "Account": "123456789012",
  "Arn": "arn:aws:iam::123456789012:user/your-user"
}
```

### 1.3 Set Environment Variables
```bash
# Copy example env file
cp .env.example .env

# Edit with your values
nano .env
```

**.env Configuration:**
```bash
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=123456789012

# Environment
ENVIRONMENT=production  # or staging, development

# Application
APP_NAME=collabhub
DOMAIN_NAME=collabhub.io  # optional, for custom domain

# Stripe (will be stored in SSM)
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
```

---

## Step 2: CDK Bootstrap

CDK Bootstrap creates the necessary S3 bucket and IAM roles for CDK deployments.

```bash
# Bootstrap CDK (run once per account/region)
npx cdk bootstrap aws://${AWS_ACCOUNT_ID}/${AWS_REGION}
```

**Expected Output:**
```
 ⏳  Bootstrapping environment aws://123456789012/us-east-1...
 ✅  Environment aws://123456789012/us-east-1 bootstrapped
```

---

## Step 3: Store Secrets

Store sensitive values in SSM Parameter Store before deployment.

```bash
# Store Stripe secrets
aws ssm put-parameter \
  --name "/collabhub/stripe/secret-key" \
  --value "${STRIPE_SECRET_KEY}" \
  --type "SecureString" \
  --overwrite

aws ssm put-parameter \
  --name "/collabhub/stripe/webhook-secret" \
  --value "${STRIPE_WEBHOOK_SECRET}" \
  --type "SecureString" \
  --overwrite

aws ssm put-parameter \
  --name "/collabhub/stripe/publishable-key" \
  --value "${STRIPE_PUBLISHABLE_KEY}" \
  --type "String" \
  --overwrite

# Verify
aws ssm get-parameters-by-path --path "/collabhub/" --query "Parameters[].Name"
```

---

## Step 4: Deploy Stacks

### 4.1 Synthesize CloudFormation Templates
```bash
# Generate CloudFormation templates
npx cdk synth
```

This creates templates in `cdk.out/` directory.

### 4.2 Deploy All Stacks
```bash
# Deploy all stacks in correct order
npx cdk deploy --all --require-approval broadening
```

**Or deploy individually (recommended for first deployment):**

```bash
# 1. Deploy Database Stack (DynamoDB)
npx cdk deploy CollabHubDatabaseStack --require-approval broadening

# 2. Deploy Auth Stack (Cognito)
npx cdk deploy CollabHubAuthStack --require-approval broadening

# 3. Deploy Storage Stack (S3)
npx cdk deploy CollabHubStorageStack --require-approval broadening

# 4. Deploy Events Stack (EventBridge + SQS)
npx cdk deploy CollabHubEventsStack --require-approval broadening

# 5. Deploy API Stack (API Gateway + Lambdas)
npx cdk deploy CollabHubApiStack --require-approval broadening

# 6. Deploy Monitoring Stack (CloudWatch)
npx cdk deploy CollabHubMonitoringStack --require-approval broadening
```

### 4.3 Deployment Output
After successful deployment, you'll see outputs like:

```
Outputs:
CollabHubApiStack.ApiEndpoint = https://abc123def.execute-api.us-east-1.amazonaws.com/prod
CollabHubAuthStack.UserPoolId = us-east-1_XXXXXXXXX
CollabHubAuthStack.UserPoolClientId = 1abc2def3ghi4jkl5mno
CollabHubStorageStack.AssetsBucketName = collabhub-assets-123456789012
```

**Save these outputs** - they're needed for frontend configuration.

---

## Step 5: Post-Deployment Configuration

### 5.1 Configure Cognito Callback URLs
```bash
# Update Cognito app client with your frontend URLs
aws cognito-idp update-user-pool-client \
  --user-pool-id ${USER_POOL_ID} \
  --client-id ${CLIENT_ID} \
  --callback-urls '["https://app.collabhub.io/auth/callback"]' \
  --logout-urls '["https://app.collabhub.io/"]'
```

### 5.2 Set Up Stripe Webhooks
1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://{API_ENDPOINT}/api/payments/webhook`
3. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `checkout.session.completed`

### 5.3 Create Admin User
```bash
# Create first admin user
aws cognito-idp admin-create-user \
  --user-pool-id ${USER_POOL_ID} \
  --username "admin@collabhub.io" \
  --user-attributes Name=email,Value=admin@collabhub.io Name=email_verified,Value=true \
  --temporary-password "TempP@ss123!"

# Add to Admin group
aws cognito-idp admin-add-user-to-group \
  --user-pool-id ${USER_POOL_ID} \
  --username "admin@collabhub.io" \
  --group-name "ADMIN"
```

---

## Step 6: Verify Deployment

### 6.1 Health Check
```bash
# Test API health endpoint
curl https://${API_ENDPOINT}/api/health

# Expected response:
# {"status": "healthy", "timestamp": "2024-..."}
```

### 6.2 Test Authentication Flow
```bash
# Register a test user (use API)
curl -X POST https://${API_ENDPOINT}/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestP@ss123!",
    "firstName": "Test",
    "lastName": "User",
    "role": "FOUNDER"
  }'
```

### 6.3 Check CloudWatch Logs
```bash
# View Lambda logs
aws logs tail /aws/lambda/CollabHub-Auth-Register --follow
```

---

## Step 7: Frontend Configuration

Provide these values to your Next.js frontend:

```typescript
// Frontend environment variables
NEXT_PUBLIC_API_URL=https://abc123def.execute-api.us-east-1.amazonaws.com/prod
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
NEXT_PUBLIC_COGNITO_CLIENT_ID=1abc2def3ghi4jkl5mno
NEXT_PUBLIC_COGNITO_REGION=us-east-1
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
NEXT_PUBLIC_S3_ASSETS_URL=https://collabhub-assets-123456789012.s3.amazonaws.com
```

---

## Update & Rollback

### Update Deployment
```bash
# After code changes
npx cdk deploy --all --require-approval broadening
```

### Rollback
```bash
# Rollback to previous version (via CloudFormation)
aws cloudformation rollback-stack --stack-name CollabHubApiStack
```

### Destroy (Caution!)
```bash
# Destroy all resources (data will be lost!)
npx cdk destroy --all
```

---

## Troubleshooting

### Common Issues

**1. CDK Bootstrap Failed**
```bash
# Check if you have admin permissions
aws iam get-user
```

**2. Lambda Deployment Failed**
```bash
# Check CloudFormation events
aws cloudformation describe-stack-events --stack-name CollabHubApiStack
```

**3. API Gateway 5xx Errors**
```bash
# Check Lambda logs
aws logs tail /aws/lambda/CollabHub-{FunctionName} --follow
```

**4. Cognito Auth Errors**
```bash
# Check user pool configuration
aws cognito-idp describe-user-pool --user-pool-id ${USER_POOL_ID}
```

---

## Cost Estimation (Production)

| Service | Estimated Monthly Cost |
|---------|----------------------|
| Lambda | $20-50 (based on invocations) |
| API Gateway | $15-30 |
| DynamoDB | $25-100 (on-demand) |
| Cognito | Free tier (50k MAU) |
| S3 | $5-20 |
| CloudWatch | $10-30 |
| **Total** | **$75-230/month** |

*Costs vary based on usage. Monitor with AWS Cost Explorer.*

---

## Security Checklist

- [ ] Secrets stored in SSM Parameter Store (not in code)
- [ ] IAM roles follow least privilege principle
- [ ] API Gateway throttling configured
- [ ] CloudTrail enabled
- [ ] S3 bucket public access blocked
- [ ] CORS configured for your domain only
- [ ] Admin user created with strong password
- [ ] Stripe webhook secret configured
