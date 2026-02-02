# CollabHub - IAM Permissions & Security

## Principle: Least Privilege
Each Lambda function receives ONLY the permissions it needs. No wildcard (*) actions on production resources.

---

## 1. CDK Deployment Role

### Role: `CollabHubCdkDeployRole`
Required for initial CDK bootstrap and deployments.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "CloudFormationFullAccess",
      "Effect": "Allow",
      "Action": [
        "cloudformation:*"
      ],
      "Resource": "arn:aws:cloudformation:*:*:stack/CollabHub*/*"
    },
    {
      "Sid": "IAMRoleManagement",
      "Effect": "Allow",
      "Action": [
        "iam:CreateRole",
        "iam:DeleteRole",
        "iam:AttachRolePolicy",
        "iam:DetachRolePolicy",
        "iam:PutRolePolicy",
        "iam:DeleteRolePolicy",
        "iam:GetRole",
        "iam:GetRolePolicy",
        "iam:PassRole",
        "iam:TagRole",
        "iam:UntagRole"
      ],
      "Resource": "arn:aws:iam::*:role/CollabHub*"
    },
    {
      "Sid": "LambdaManagement",
      "Effect": "Allow",
      "Action": [
        "lambda:CreateFunction",
        "lambda:DeleteFunction",
        "lambda:UpdateFunctionCode",
        "lambda:UpdateFunctionConfiguration",
        "lambda:GetFunction",
        "lambda:GetFunctionConfiguration",
        "lambda:AddPermission",
        "lambda:RemovePermission",
        "lambda:InvokeFunction",
        "lambda:ListTags",
        "lambda:TagResource",
        "lambda:UntagResource"
      ],
      "Resource": "arn:aws:lambda:*:*:function:CollabHub*"
    },
    {
      "Sid": "APIGatewayManagement",
      "Effect": "Allow",
      "Action": [
        "apigateway:*"
      ],
      "Resource": [
        "arn:aws:apigateway:*::/restapis/*",
        "arn:aws:apigateway:*::/restapis"
      ]
    },
    {
      "Sid": "DynamoDBManagement",
      "Effect": "Allow",
      "Action": [
        "dynamodb:CreateTable",
        "dynamodb:DeleteTable",
        "dynamodb:DescribeTable",
        "dynamodb:UpdateTable",
        "dynamodb:CreateGlobalSecondaryIndex",
        "dynamodb:DeleteGlobalSecondaryIndex",
        "dynamodb:UpdateGlobalSecondaryIndex",
        "dynamodb:TagResource",
        "dynamodb:UntagResource"
      ],
      "Resource": "arn:aws:dynamodb:*:*:table/collabhub-*"
    },
    {
      "Sid": "CognitoManagement",
      "Effect": "Allow",
      "Action": [
        "cognito-idp:CreateUserPool",
        "cognito-idp:DeleteUserPool",
        "cognito-idp:UpdateUserPool",
        "cognito-idp:CreateUserPoolClient",
        "cognito-idp:DeleteUserPoolClient",
        "cognito-idp:CreateGroup",
        "cognito-idp:DeleteGroup",
        "cognito-idp:SetUserPoolMfaConfig",
        "cognito-idp:TagResource"
      ],
      "Resource": "*"
    },
    {
      "Sid": "S3BucketManagement",
      "Effect": "Allow",
      "Action": [
        "s3:CreateBucket",
        "s3:DeleteBucket",
        "s3:PutBucketPolicy",
        "s3:PutBucketCORS",
        "s3:PutBucketPublicAccessBlock",
        "s3:PutEncryptionConfiguration",
        "s3:PutBucketVersioning",
        "s3:PutBucketTagging"
      ],
      "Resource": "arn:aws:s3:::collabhub-*"
    },
    {
      "Sid": "EventBridgeManagement",
      "Effect": "Allow",
      "Action": [
        "events:CreateEventBus",
        "events:DeleteEventBus",
        "events:PutRule",
        "events:DeleteRule",
        "events:PutTargets",
        "events:RemoveTargets"
      ],
      "Resource": "arn:aws:events:*:*:event-bus/collabhub-*"
    },
    {
      "Sid": "SQSManagement",
      "Effect": "Allow",
      "Action": [
        "sqs:CreateQueue",
        "sqs:DeleteQueue",
        "sqs:SetQueueAttributes",
        "sqs:TagQueue"
      ],
      "Resource": "arn:aws:sqs:*:*:collabhub-*"
    },
    {
      "Sid": "CloudWatchManagement",
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:DeleteLogGroup",
        "logs:PutRetentionPolicy",
        "logs:TagLogGroup"
      ],
      "Resource": "arn:aws:logs:*:*:log-group:/aws/lambda/CollabHub*"
    },
    {
      "Sid": "SSMParameterStore",
      "Effect": "Allow",
      "Action": [
        "ssm:PutParameter",
        "ssm:GetParameter",
        "ssm:DeleteParameter"
      ],
      "Resource": "arn:aws:ssm:*:*:parameter/collabhub/*"
    }
  ]
}
```

---

## 2. Lambda Execution Roles

### 2.1 Auth Lambda Role
**Role**: `CollabHubAuthLambdaRole`

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "CognitoUserManagement",
      "Effect": "Allow",
      "Action": [
        "cognito-idp:AdminCreateUser",
        "cognito-idp:AdminConfirmSignUp",
        "cognito-idp:AdminGetUser",
        "cognito-idp:AdminUpdateUserAttributes",
        "cognito-idp:AdminAddUserToGroup",
        "cognito-idp:AdminRemoveUserFromGroup"
      ],
      "Resource": "arn:aws:cognito-idp:*:*:userpool/${COGNITO_USER_POOL_ID}"
    },
    {
      "Sid": "DynamoDBUserWrite",
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:GetItem",
        "dynamodb:Query"
      ],
      "Resource": [
        "arn:aws:dynamodb:*:*:table/collabhub-main",
        "arn:aws:dynamodb:*:*:table/collabhub-main/index/GSI4"
      ]
    },
    {
      "Sid": "CloudWatchLogs",
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:log-group:/aws/lambda/CollabHub-Auth*:*"
    }
  ]
}
```

### 2.2 Users Lambda Role
**Role**: `CollabHubUsersLambdaRole`

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DynamoDBUserOperations",
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query"
      ],
      "Resource": [
        "arn:aws:dynamodb:*:*:table/collabhub-main",
        "arn:aws:dynamodb:*:*:table/collabhub-main/index/*"
      ]
    },
    {
      "Sid": "S3AvatarUpload",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject"
      ],
      "Resource": "arn:aws:s3:::collabhub-assets/avatars/*"
    },
    {
      "Sid": "CloudWatchLogs",
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:log-group:/aws/lambda/CollabHub-Users*:*"
    }
  ]
}
```

### 2.3 Startups Lambda Role
**Role**: `CollabHubStartupsLambdaRole`

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DynamoDBStartupOperations",
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query",
        "dynamodb:BatchGetItem"
      ],
      "Resource": [
        "arn:aws:dynamodb:*:*:table/collabhub-main",
        "arn:aws:dynamodb:*:*:table/collabhub-main/index/*"
      ]
    },
    {
      "Sid": "S3StartupAssets",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": [
        "arn:aws:s3:::collabhub-assets/logos/*",
        "arn:aws:s3:::collabhub-assets/pitch-decks/*"
      ]
    },
    {
      "Sid": "EventBridgePublish",
      "Effect": "Allow",
      "Action": [
        "events:PutEvents"
      ],
      "Resource": "arn:aws:events:*:*:event-bus/collabhub-events"
    },
    {
      "Sid": "CloudWatchLogs",
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:log-group:/aws/lambda/CollabHub-Startups*:*"
    }
  ]
}
```

### 2.4 Applications Lambda Role
**Role**: `CollabHubApplicationsLambdaRole`

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DynamoDBApplicationOperations",
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query"
      ],
      "Resource": [
        "arn:aws:dynamodb:*:*:table/collabhub-main",
        "arn:aws:dynamodb:*:*:table/collabhub-main/index/*"
      ]
    },
    {
      "Sid": "S3ResumeAccess",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject"
      ],
      "Resource": "arn:aws:s3:::collabhub-assets/resumes/*"
    },
    {
      "Sid": "SQSNotifications",
      "Effect": "Allow",
      "Action": [
        "sqs:SendMessage"
      ],
      "Resource": "arn:aws:sqs:*:*:collabhub-notifications"
    },
    {
      "Sid": "CloudWatchLogs",
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:log-group:/aws/lambda/CollabHub-Applications*:*"
    }
  ]
}
```

### 2.5 Chat Lambda Role
**Role**: `CollabHubChatLambdaRole`

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DynamoDBChatOperations",
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:Query",
        "dynamodb:BatchWriteItem"
      ],
      "Resource": [
        "arn:aws:dynamodb:*:*:table/collabhub-main",
        "arn:aws:dynamodb:*:*:table/collabhub-main/index/GSI1"
      ]
    },
    {
      "Sid": "S3FileSharing",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject"
      ],
      "Resource": "arn:aws:s3:::collabhub-assets/chat-files/*"
    },
    {
      "Sid": "CloudWatchLogs",
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:log-group:/aws/lambda/CollabHub-Chat*:*"
    }
  ]
}
```

### 2.6 Payments Lambda Role
**Role**: `CollabHubPaymentsLambdaRole`

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DynamoDBSubscriptionOperations",
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:Query"
      ],
      "Resource": [
        "arn:aws:dynamodb:*:*:table/collabhub-main",
        "arn:aws:dynamodb:*:*:table/collabhub-main/index/GSI1",
        "arn:aws:dynamodb:*:*:table/collabhub-main/index/GSI2"
      ]
    },
    {
      "Sid": "SSMStripeSecrets",
      "Effect": "Allow",
      "Action": [
        "ssm:GetParameter"
      ],
      "Resource": [
        "arn:aws:ssm:*:*:parameter/collabhub/stripe/secret-key",
        "arn:aws:ssm:*:*:parameter/collabhub/stripe/webhook-secret"
      ]
    },
    {
      "Sid": "EventBridgePublish",
      "Effect": "Allow",
      "Action": [
        "events:PutEvents"
      ],
      "Resource": "arn:aws:events:*:*:event-bus/collabhub-events"
    },
    {
      "Sid": "CloudWatchLogs",
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:log-group:/aws/lambda/CollabHub-Payments*:*"
    }
  ]
}
```

### 2.7 Admin Lambda Role
**Role**: `CollabHubAdminLambdaRole`

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DynamoDBFullRead",
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:Query",
        "dynamodb:Scan",
        "dynamodb:BatchGetItem"
      ],
      "Resource": [
        "arn:aws:dynamodb:*:*:table/collabhub-main",
        "arn:aws:dynamodb:*:*:table/collabhub-main/index/*"
      ]
    },
    {
      "Sid": "DynamoDBModeration",
      "Effect": "Allow",
      "Action": [
        "dynamodb:UpdateItem"
      ],
      "Resource": "arn:aws:dynamodb:*:*:table/collabhub-main"
    },
    {
      "Sid": "CognitoUserManagement",
      "Effect": "Allow",
      "Action": [
        "cognito-idp:AdminDisableUser",
        "cognito-idp:AdminEnableUser",
        "cognito-idp:AdminGetUser",
        "cognito-idp:AdminUpdateUserAttributes",
        "cognito-idp:AdminAddUserToGroup",
        "cognito-idp:AdminRemoveUserFromGroup"
      ],
      "Resource": "arn:aws:cognito-idp:*:*:userpool/${COGNITO_USER_POOL_ID}"
    },
    {
      "Sid": "CloudWatchMetrics",
      "Effect": "Allow",
      "Action": [
        "cloudwatch:GetMetricData",
        "cloudwatch:GetMetricStatistics"
      ],
      "Resource": "*"
    },
    {
      "Sid": "CloudWatchLogs",
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:log-group:/aws/lambda/CollabHub-Admin*:*"
    }
  ]
}
```

### 2.8 Worker Lambda Role
**Role**: `CollabHubWorkerLambdaRole`

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "SQSConsume",
      "Effect": "Allow",
      "Action": [
        "sqs:ReceiveMessage",
        "sqs:DeleteMessage",
        "sqs:GetQueueAttributes"
      ],
      "Resource": [
        "arn:aws:sqs:*:*:collabhub-notifications",
        "arn:aws:sqs:*:*:collabhub-emails",
        "arn:aws:sqs:*:*:collabhub-audit"
      ]
    },
    {
      "Sid": "DynamoDBWrite",
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem",
        "dynamodb:UpdateItem"
      ],
      "Resource": "arn:aws:dynamodb:*:*:table/collabhub-main"
    },
    {
      "Sid": "SESEmail",
      "Effect": "Allow",
      "Action": [
        "ses:SendEmail",
        "ses:SendTemplatedEmail"
      ],
      "Resource": "*",
      "Condition": {
        "StringEquals": {
          "ses:FromAddress": "noreply@collabhub.io"
        }
      }
    },
    {
      "Sid": "CloudWatchLogs",
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:log-group:/aws/lambda/CollabHub-Worker*:*"
    }
  ]
}
```

---

## 3. API Gateway Authorizer

### Cognito Authorizer Configuration
```typescript
// CDK Configuration
const authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'CollabHubAuthorizer', {
  cognitoUserPools: [userPool],
  identitySource: 'method.request.header.Authorization',
});

// Protected endpoint example
api.addMethod('GET', lambdaIntegration, {
  authorizer,
  authorizationType: apigateway.AuthorizationType.COGNITO,
});
```

---

## 4. Required Secrets (SSM Parameter Store)

| Parameter Path | Description | Required By |
|----------------|-------------|-------------|
| `/collabhub/stripe/secret-key` | Stripe secret API key | Payments Lambda |
| `/collabhub/stripe/webhook-secret` | Stripe webhook signing secret | Payments Lambda |
| `/collabhub/stripe/publishable-key` | Stripe publishable key (public) | Frontend config |

---

## 5. Security Best Practices Implemented

1. **No Hardcoded Credentials**: All secrets in SSM Parameter Store with encryption
2. **Scoped IAM Policies**: Each Lambda has minimal required permissions
3. **Resource-Based Policies**: Permissions scoped to specific ARNs
4. **VPC Isolation**: Option to run Lambdas in private VPC subnets
5. **Encryption at Rest**: DynamoDB, S3, and SSM encrypted by default
6. **Encryption in Transit**: TLS 1.3 enforced on API Gateway
7. **Audit Logging**: CloudTrail enabled for all API calls
8. **Rate Limiting**: API Gateway throttling configured
9. **Input Validation**: All inputs validated before processing
10. **CORS Configuration**: Strict origin whitelist
