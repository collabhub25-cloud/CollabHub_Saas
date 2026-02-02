#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DatabaseStack } from '../lib/stacks/database-stack';
import { AuthStack } from '../lib/stacks/auth-stack';
import { StorageStack } from '../lib/stacks/storage-stack';
import { EventsStack } from '../lib/stacks/events-stack';
import { ApiStack } from '../lib/stacks/api-stack';
import { MonitoringStack } from '../lib/stacks/monitoring-stack';

const app = new cdk.App();

// Environment configuration
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT_ID,
  region: process.env.CDK_DEFAULT_REGION || process.env.AWS_REGION || 'us-east-1',
};

const appName = 'CollabHub';
const environment = process.env.ENVIRONMENT || 'production';

// Stack tags
const tags = {
  Application: appName,
  Environment: environment,
  ManagedBy: 'CDK',
};

// 1. Database Stack (DynamoDB) - Deploy first
const databaseStack = new DatabaseStack(app, `${appName}DatabaseStack`, {
  env,
  tags,
  appName,
  environment,
});

// 2. Auth Stack (Cognito)
const authStack = new AuthStack(app, `${appName}AuthStack`, {
  env,
  tags,
  appName,
  environment,
});

// 3. Storage Stack (S3 + CloudFront)
const storageStack = new StorageStack(app, `${appName}StorageStack`, {
  env,
  tags,
  appName,
  environment,
});

// 4. Events Stack (EventBridge + SQS)
const eventsStack = new EventsStack(app, `${appName}EventsStack`, {
  env,
  tags,
  appName,
  environment,
});

// 5. API Stack (API Gateway + Lambdas) - Depends on all above
const apiStack = new ApiStack(app, `${appName}ApiStack`, {
  env,
  tags,
  appName,
  environment,
  table: databaseStack.table,
  userPool: authStack.userPool,
  userPoolClient: authStack.userPoolClient,
  assetsBucket: storageStack.assetsBucket,
  eventBus: eventsStack.eventBus,
  notificationQueue: eventsStack.notificationQueue,
  emailQueue: eventsStack.emailQueue,
  auditQueue: eventsStack.auditQueue,
});

apiStack.addDependency(databaseStack);
apiStack.addDependency(authStack);
apiStack.addDependency(storageStack);
apiStack.addDependency(eventsStack);

// 6. Monitoring Stack (CloudWatch) - Deploy last
const monitoringStack = new MonitoringStack(app, `${appName}MonitoringStack`, {
  env,
  tags,
  appName,
  environment,
  api: apiStack.api,
  table: databaseStack.table,
  userPool: authStack.userPool,
});

monitoringStack.addDependency(apiStack);

app.synth();
