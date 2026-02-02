import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as events from 'aws-cdk-lib/aws-events';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import { Construct } from 'constructs';
import * as path from 'path';

interface ApiStackProps extends cdk.StackProps {
  appName: string;
  environment: string;
  table: dynamodb.Table;
  userPool: cognito.UserPool;
  userPoolClient: cognito.UserPoolClient;
  assetsBucket: s3.Bucket;
  eventBus: events.EventBus;
  notificationQueue: sqs.Queue;
  emailQueue: sqs.Queue;
  auditQueue: sqs.Queue;
}

export class ApiStack extends cdk.Stack {
  public readonly api: apigateway.RestApi;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const { 
      appName, 
      environment, 
      table, 
      userPool, 
      userPoolClient, 
      assetsBucket, 
      eventBus,
      notificationQueue,
      emailQueue,
      auditQueue,
    } = props;

    // Common Lambda environment variables
    const commonEnv = {
      TABLE_NAME: table.tableName,
      USER_POOL_ID: userPool.userPoolId,
      USER_POOL_CLIENT_ID: userPoolClient.userPoolClientId,
      ASSETS_BUCKET: assetsBucket.bucketName,
      EVENT_BUS_NAME: eventBus.eventBusName,
      REGION: this.region,
      ENVIRONMENT: environment,
    };

    // Common Lambda configuration
    const lambdaConfig = {
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 256,
      timeout: cdk.Duration.seconds(30),
      environment: commonEnv,
      bundling: {
        minify: true,
        sourceMap: true,
        externalModules: ['@aws-sdk/*'],
      },
    };

    // REST API
    this.api = new apigateway.RestApi(this, 'Api', {
      restApiName: `${appName}-API-${environment}`,
      description: `${appName} REST API`,
      deployOptions: {
        stageName: environment === 'production' ? 'prod' : 'dev',
        throttlingBurstLimit: 100,
        throttlingRateLimit: 50,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: environment !== 'production',
        metricsEnabled: true,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'Authorization',
          'X-Amz-Date',
          'X-Api-Key',
          'X-Amz-Security-Token',
        ],
        maxAge: cdk.Duration.days(1),
      },
    });

    // Cognito Authorizer
    const authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'Authorizer', {
      cognitoUserPools: [userPool],
      identitySource: 'method.request.header.Authorization',
    });

    // API Resources
    const apiRoot = this.api.root.addResource('api');
    
    // Health check endpoint (public)
    const healthResource = apiRoot.addResource('health');
    healthResource.addMethod('GET', new apigateway.MockIntegration({
      integrationResponses: [{
        statusCode: '200',
        responseTemplates: {
          'application/json': JSON.stringify({ status: 'healthy', timestamp: new Date().toISOString() }),
        },
      }],
      requestTemplates: {
        'application/json': '{"statusCode": 200}',
      },
    }), {
      methodResponses: [{ statusCode: '200' }],
    });

    // ==================== AUTH ENDPOINTS ====================
    const authResource = apiRoot.addResource('auth');
    
    // Register Lambda
    const registerLambda = new nodejs.NodejsFunction(this, 'RegisterFunction', {
      ...lambdaConfig,
      functionName: `${appName}-Auth-Register-${environment}`,
      entry: path.join(__dirname, '../../src/functions/auth/register.ts'),
      handler: 'handler',
    });
    
    table.grantWriteData(registerLambda);
    registerLambda.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'cognito-idp:AdminCreateUser',
        'cognito-idp:AdminSetUserPassword',
        'cognito-idp:AdminAddUserToGroup',
      ],
      resources: [userPool.userPoolArn],
    }));
    
    authResource.addResource('register').addMethod('POST', 
      new apigateway.LambdaIntegration(registerLambda)
    );

    // Login Lambda
    const loginLambda = new nodejs.NodejsFunction(this, 'LoginFunction', {
      ...lambdaConfig,
      functionName: `${appName}-Auth-Login-${environment}`,
      entry: path.join(__dirname, '../../src/functions/auth/login.ts'),
      handler: 'handler',
    });
    
    loginLambda.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'cognito-idp:AdminInitiateAuth',
        'cognito-idp:AdminGetUser',
      ],
      resources: [userPool.userPoolArn],
    }));
    
    authResource.addResource('login').addMethod('POST',
      new apigateway.LambdaIntegration(loginLambda)
    );

    // Refresh Token Lambda
    const refreshLambda = new nodejs.NodejsFunction(this, 'RefreshFunction', {
      ...lambdaConfig,
      functionName: `${appName}-Auth-Refresh-${environment}`,
      entry: path.join(__dirname, '../../src/functions/auth/refresh.ts'),
      handler: 'handler',
    });
    
    refreshLambda.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['cognito-idp:AdminInitiateAuth'],
      resources: [userPool.userPoolArn],
    }));
    
    authResource.addResource('refresh').addMethod('POST',
      new apigateway.LambdaIntegration(refreshLambda)
    );

    // ==================== USER ENDPOINTS ====================
    const usersResource = apiRoot.addResource('users');
    const profileResource = usersResource.addResource('profile');
    const userIdResource = usersResource.addResource('{userId}');
    
    // Get Profile Lambda
    const getProfileLambda = new nodejs.NodejsFunction(this, 'GetProfileFunction', {
      ...lambdaConfig,
      functionName: `${appName}-Users-GetProfile-${environment}`,
      entry: path.join(__dirname, '../../src/functions/users/get-profile.ts'),
      handler: 'handler',
    });
    table.grantReadData(getProfileLambda);
    
    profileResource.addMethod('GET',
      new apigateway.LambdaIntegration(getProfileLambda),
      { authorizer, authorizationType: apigateway.AuthorizationType.COGNITO }
    );

    // Update Profile Lambda
    const updateProfileLambda = new nodejs.NodejsFunction(this, 'UpdateProfileFunction', {
      ...lambdaConfig,
      functionName: `${appName}-Users-UpdateProfile-${environment}`,
      entry: path.join(__dirname, '../../src/functions/users/update-profile.ts'),
      handler: 'handler',
    });
    table.grantReadWriteData(updateProfileLambda);
    eventBus.grantPutEventsTo(updateProfileLambda);
    
    profileResource.addMethod('PUT',
      new apigateway.LambdaIntegration(updateProfileLambda),
      { authorizer, authorizationType: apigateway.AuthorizationType.COGNITO }
    );

    // Get User by ID Lambda
    const getUserLambda = new nodejs.NodejsFunction(this, 'GetUserFunction', {
      ...lambdaConfig,
      functionName: `${appName}-Users-GetUser-${environment}`,
      entry: path.join(__dirname, '../../src/functions/users/get-user.ts'),
      handler: 'handler',
    });
    table.grantReadData(getUserLambda);
    
    userIdResource.addMethod('GET',
      new apigateway.LambdaIntegration(getUserLambda),
      { authorizer, authorizationType: apigateway.AuthorizationType.COGNITO }
    );

    // ==================== STARTUP ENDPOINTS ====================
    const startupsResource = apiRoot.addResource('startups');
    const myStartupsResource = startupsResource.addResource('mine');
    const startupIdResource = startupsResource.addResource('{startupId}');
    const startupVisibilityResource = startupIdResource.addResource('visibility');
    const rolesResource = startupIdResource.addResource('roles');
    const roleIdResource = rolesResource.addResource('{roleId}');

    // Create Startup Lambda
    const createStartupLambda = new nodejs.NodejsFunction(this, 'CreateStartupFunction', {
      ...lambdaConfig,
      functionName: `${appName}-Startups-Create-${environment}`,
      entry: path.join(__dirname, '../../src/functions/startups/create-startup.ts'),
      handler: 'handler',
    });
    table.grantReadWriteData(createStartupLambda);
    eventBus.grantPutEventsTo(createStartupLambda);
    
    startupsResource.addMethod('POST',
      new apigateway.LambdaIntegration(createStartupLambda),
      { authorizer, authorizationType: apigateway.AuthorizationType.COGNITO }
    );

    // List Startups Lambda
    const listStartupsLambda = new nodejs.NodejsFunction(this, 'ListStartupsFunction', {
      ...lambdaConfig,
      functionName: `${appName}-Startups-List-${environment}`,
      entry: path.join(__dirname, '../../src/functions/startups/list-startups.ts'),
      handler: 'handler',
    });
    table.grantReadData(listStartupsLambda);
    
    startupsResource.addMethod('GET',
      new apigateway.LambdaIntegration(listStartupsLambda),
      { authorizer, authorizationType: apigateway.AuthorizationType.COGNITO }
    );

    // List My Startups Lambda
    const listMyStartupsLambda = new nodejs.NodejsFunction(this, 'ListMyStartupsFunction', {
      ...lambdaConfig,
      functionName: `${appName}-Startups-ListMine-${environment}`,
      entry: path.join(__dirname, '../../src/functions/startups/list-my-startups.ts'),
      handler: 'handler',
    });
    table.grantReadData(listMyStartupsLambda);
    
    myStartupsResource.addMethod('GET',
      new apigateway.LambdaIntegration(listMyStartupsLambda),
      { authorizer, authorizationType: apigateway.AuthorizationType.COGNITO }
    );

    // Get Startup Lambda
    const getStartupLambda = new nodejs.NodejsFunction(this, 'GetStartupFunction', {
      ...lambdaConfig,
      functionName: `${appName}-Startups-Get-${environment}`,
      entry: path.join(__dirname, '../../src/functions/startups/get-startup.ts'),
      handler: 'handler',
    });
    table.grantReadData(getStartupLambda);
    
    startupIdResource.addMethod('GET',
      new apigateway.LambdaIntegration(getStartupLambda),
      { authorizer, authorizationType: apigateway.AuthorizationType.COGNITO }
    );

    // Update Startup Lambda
    const updateStartupLambda = new nodejs.NodejsFunction(this, 'UpdateStartupFunction', {
      ...lambdaConfig,
      functionName: `${appName}-Startups-Update-${environment}`,
      entry: path.join(__dirname, '../../src/functions/startups/update-startup.ts'),
      handler: 'handler',
    });
    table.grantReadWriteData(updateStartupLambda);
    eventBus.grantPutEventsTo(updateStartupLambda);
    
    startupIdResource.addMethod('PUT',
      new apigateway.LambdaIntegration(updateStartupLambda),
      { authorizer, authorizationType: apigateway.AuthorizationType.COGNITO }
    );

    // Delete Startup Lambda
    const deleteStartupLambda = new nodejs.NodejsFunction(this, 'DeleteStartupFunction', {
      ...lambdaConfig,
      functionName: `${appName}-Startups-Delete-${environment}`,
      entry: path.join(__dirname, '../../src/functions/startups/delete-startup.ts'),
      handler: 'handler',
    });
    table.grantReadWriteData(deleteStartupLambda);
    
    startupIdResource.addMethod('DELETE',
      new apigateway.LambdaIntegration(deleteStartupLambda),
      { authorizer, authorizationType: apigateway.AuthorizationType.COGNITO }
    );

    // Update Visibility Lambda
    const updateVisibilityLambda = new nodejs.NodejsFunction(this, 'UpdateVisibilityFunction', {
      ...lambdaConfig,
      functionName: `${appName}-Startups-UpdateVisibility-${environment}`,
      entry: path.join(__dirname, '../../src/functions/startups/update-visibility.ts'),
      handler: 'handler',
    });
    table.grantReadWriteData(updateVisibilityLambda);
    
    startupVisibilityResource.addMethod('PUT',
      new apigateway.LambdaIntegration(updateVisibilityLambda),
      { authorizer, authorizationType: apigateway.AuthorizationType.COGNITO }
    );

    // Create Role Lambda
    const createRoleLambda = new nodejs.NodejsFunction(this, 'CreateRoleFunction', {
      ...lambdaConfig,
      functionName: `${appName}-Startups-CreateRole-${environment}`,
      entry: path.join(__dirname, '../../src/functions/startups/create-role.ts'),
      handler: 'handler',
    });
    table.grantReadWriteData(createRoleLambda);
    
    rolesResource.addMethod('POST',
      new apigateway.LambdaIntegration(createRoleLambda),
      { authorizer, authorizationType: apigateway.AuthorizationType.COGNITO }
    );

    // List Roles Lambda
    const listRolesLambda = new nodejs.NodejsFunction(this, 'ListRolesFunction', {
      ...lambdaConfig,
      functionName: `${appName}-Startups-ListRoles-${environment}`,
      entry: path.join(__dirname, '../../src/functions/startups/list-roles.ts'),
      handler: 'handler',
    });
    table.grantReadData(listRolesLambda);
    
    rolesResource.addMethod('GET',
      new apigateway.LambdaIntegration(listRolesLambda),
      { authorizer, authorizationType: apigateway.AuthorizationType.COGNITO }
    );

    // ==================== APPLICATION ENDPOINTS ====================
    const applicationsResource = apiRoot.addResource('applications');
    const myApplicationsResource = applicationsResource.addResource('mine');
    const applicationIdResource = applicationsResource.addResource('{applicationId}');
    const applicationStatusResource = applicationIdResource.addResource('status');

    // Create Application Lambda
    const createApplicationLambda = new nodejs.NodejsFunction(this, 'CreateApplicationFunction', {
      ...lambdaConfig,
      functionName: `${appName}-Applications-Create-${environment}`,
      entry: path.join(__dirname, '../../src/functions/applications/create-application.ts'),
      handler: 'handler',
    });
    table.grantReadWriteData(createApplicationLambda);
    eventBus.grantPutEventsTo(createApplicationLambda);
    
    applicationsResource.addMethod('POST',
      new apigateway.LambdaIntegration(createApplicationLambda),
      { authorizer, authorizationType: apigateway.AuthorizationType.COGNITO }
    );

    // List Applications Lambda
    const listApplicationsLambda = new nodejs.NodejsFunction(this, 'ListApplicationsFunction', {
      ...lambdaConfig,
      functionName: `${appName}-Applications-List-${environment}`,
      entry: path.join(__dirname, '../../src/functions/applications/list-applications.ts'),
      handler: 'handler',
    });
    table.grantReadData(listApplicationsLambda);
    
    applicationsResource.addMethod('GET',
      new apigateway.LambdaIntegration(listApplicationsLambda),
      { authorizer, authorizationType: apigateway.AuthorizationType.COGNITO }
    );

    // List My Applications Lambda
    const listMyApplicationsLambda = new nodejs.NodejsFunction(this, 'ListMyApplicationsFunction', {
      ...lambdaConfig,
      functionName: `${appName}-Applications-ListMine-${environment}`,
      entry: path.join(__dirname, '../../src/functions/applications/list-my-applications.ts'),
      handler: 'handler',
    });
    table.grantReadData(listMyApplicationsLambda);
    
    myApplicationsResource.addMethod('GET',
      new apigateway.LambdaIntegration(listMyApplicationsLambda),
      { authorizer, authorizationType: apigateway.AuthorizationType.COGNITO }
    );

    // Get Application Lambda
    const getApplicationLambda = new nodejs.NodejsFunction(this, 'GetApplicationFunction', {
      ...lambdaConfig,
      functionName: `${appName}-Applications-Get-${environment}`,
      entry: path.join(__dirname, '../../src/functions/applications/get-application.ts'),
      handler: 'handler',
    });
    table.grantReadData(getApplicationLambda);
    
    applicationIdResource.addMethod('GET',
      new apigateway.LambdaIntegration(getApplicationLambda),
      { authorizer, authorizationType: apigateway.AuthorizationType.COGNITO }
    );

    // Update Application Status Lambda
    const updateApplicationStatusLambda = new nodejs.NodejsFunction(this, 'UpdateApplicationStatusFunction', {
      ...lambdaConfig,
      functionName: `${appName}-Applications-UpdateStatus-${environment}`,
      entry: path.join(__dirname, '../../src/functions/applications/update-status.ts'),
      handler: 'handler',
    });
    table.grantReadWriteData(updateApplicationStatusLambda);
    eventBus.grantPutEventsTo(updateApplicationStatusLambda);
    
    applicationStatusResource.addMethod('PUT',
      new apigateway.LambdaIntegration(updateApplicationStatusLambda),
      { authorizer, authorizationType: apigateway.AuthorizationType.COGNITO }
    );

    // Withdraw Application Lambda
    const withdrawApplicationLambda = new nodejs.NodejsFunction(this, 'WithdrawApplicationFunction', {
      ...lambdaConfig,
      functionName: `${appName}-Applications-Withdraw-${environment}`,
      entry: path.join(__dirname, '../../src/functions/applications/withdraw-application.ts'),
      handler: 'handler',
    });
    table.grantReadWriteData(withdrawApplicationLambda);
    eventBus.grantPutEventsTo(withdrawApplicationLambda);
    
    applicationIdResource.addMethod('DELETE',
      new apigateway.LambdaIntegration(withdrawApplicationLambda),
      { authorizer, authorizationType: apigateway.AuthorizationType.COGNITO }
    );

    // ==================== CHAT ENDPOINTS ====================
    const chatResource = apiRoot.addResource('chat');
    const conversationsResource = chatResource.addResource('conversations');
    const conversationIdResource = conversationsResource.addResource('{conversationId}');
    const messagesResource = conversationIdResource.addResource('messages');
    const readResource = conversationIdResource.addResource('read');

    // Create Conversation Lambda
    const createConversationLambda = new nodejs.NodejsFunction(this, 'CreateConversationFunction', {
      ...lambdaConfig,
      functionName: `${appName}-Chat-CreateConversation-${environment}`,
      entry: path.join(__dirname, '../../src/functions/chat/create-conversation.ts'),
      handler: 'handler',
    });
    table.grantReadWriteData(createConversationLambda);
    
    conversationsResource.addMethod('POST',
      new apigateway.LambdaIntegration(createConversationLambda),
      { authorizer, authorizationType: apigateway.AuthorizationType.COGNITO }
    );

    // List Conversations Lambda
    const listConversationsLambda = new nodejs.NodejsFunction(this, 'ListConversationsFunction', {
      ...lambdaConfig,
      functionName: `${appName}-Chat-ListConversations-${environment}`,
      entry: path.join(__dirname, '../../src/functions/chat/list-conversations.ts'),
      handler: 'handler',
    });
    table.grantReadData(listConversationsLambda);
    
    conversationsResource.addMethod('GET',
      new apigateway.LambdaIntegration(listConversationsLambda),
      { authorizer, authorizationType: apigateway.AuthorizationType.COGNITO }
    );

    // Send Message Lambda
    const sendMessageLambda = new nodejs.NodejsFunction(this, 'SendMessageFunction', {
      ...lambdaConfig,
      functionName: `${appName}-Chat-SendMessage-${environment}`,
      entry: path.join(__dirname, '../../src/functions/chat/send-message.ts'),
      handler: 'handler',
    });
    table.grantReadWriteData(sendMessageLambda);
    eventBus.grantPutEventsTo(sendMessageLambda);
    
    messagesResource.addMethod('POST',
      new apigateway.LambdaIntegration(sendMessageLambda),
      { authorizer, authorizationType: apigateway.AuthorizationType.COGNITO }
    );

    // List Messages Lambda
    const listMessagesLambda = new nodejs.NodejsFunction(this, 'ListMessagesFunction', {
      ...lambdaConfig,
      functionName: `${appName}-Chat-ListMessages-${environment}`,
      entry: path.join(__dirname, '../../src/functions/chat/list-messages.ts'),
      handler: 'handler',
    });
    table.grantReadData(listMessagesLambda);
    
    messagesResource.addMethod('GET',
      new apigateway.LambdaIntegration(listMessagesLambda),
      { authorizer, authorizationType: apigateway.AuthorizationType.COGNITO }
    );

    // Mark Read Lambda
    const markReadLambda = new nodejs.NodejsFunction(this, 'MarkReadFunction', {
      ...lambdaConfig,
      functionName: `${appName}-Chat-MarkRead-${environment}`,
      entry: path.join(__dirname, '../../src/functions/chat/mark-read.ts'),
      handler: 'handler',
    });
    table.grantReadWriteData(markReadLambda);
    
    readResource.addMethod('PUT',
      new apigateway.LambdaIntegration(markReadLambda),
      { authorizer, authorizationType: apigateway.AuthorizationType.COGNITO }
    );

    // ==================== PAYMENTS ENDPOINTS ====================
    const paymentsResource = apiRoot.addResource('payments');
    const checkoutResource = paymentsResource.addResource('checkout');
    const portalResource = paymentsResource.addResource('portal');
    const subscriptionResource = paymentsResource.addResource('subscription');
    const webhookResource = paymentsResource.addResource('webhook');

    // Common payments environment
    const paymentsEnv = {
      ...commonEnv,
      STRIPE_SECRET_KEY_PARAM: `/collabhub/stripe/secret-key`,
      STRIPE_WEBHOOK_SECRET_PARAM: `/collabhub/stripe/webhook-secret`,
    };

    // Create Checkout Lambda
    const createCheckoutLambda = new nodejs.NodejsFunction(this, 'CreateCheckoutFunction', {
      ...lambdaConfig,
      functionName: `${appName}-Payments-CreateCheckout-${environment}`,
      entry: path.join(__dirname, '../../src/functions/payments/create-checkout.ts'),
      handler: 'handler',
      environment: paymentsEnv,
    });
    table.grantReadData(createCheckoutLambda);
    createCheckoutLambda.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['ssm:GetParameter'],
      resources: [`arn:aws:ssm:${this.region}:${this.account}:parameter/collabhub/stripe/*`],
    }));
    
    checkoutResource.addMethod('POST',
      new apigateway.LambdaIntegration(createCheckoutLambda),
      { authorizer, authorizationType: apigateway.AuthorizationType.COGNITO }
    );

    // Create Portal Lambda
    const createPortalLambda = new nodejs.NodejsFunction(this, 'CreatePortalFunction', {
      ...lambdaConfig,
      functionName: `${appName}-Payments-CreatePortal-${environment}`,
      entry: path.join(__dirname, '../../src/functions/payments/create-portal.ts'),
      handler: 'handler',
      environment: paymentsEnv,
    });
    table.grantReadData(createPortalLambda);
    createPortalLambda.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['ssm:GetParameter'],
      resources: [`arn:aws:ssm:${this.region}:${this.account}:parameter/collabhub/stripe/*`],
    }));
    
    portalResource.addMethod('POST',
      new apigateway.LambdaIntegration(createPortalLambda),
      { authorizer, authorizationType: apigateway.AuthorizationType.COGNITO }
    );

    // Get Subscription Lambda
    const getSubscriptionLambda = new nodejs.NodejsFunction(this, 'GetSubscriptionFunction', {
      ...lambdaConfig,
      functionName: `${appName}-Payments-GetSubscription-${environment}`,
      entry: path.join(__dirname, '../../src/functions/payments/get-subscription.ts'),
      handler: 'handler',
    });
    table.grantReadData(getSubscriptionLambda);
    
    subscriptionResource.addMethod('GET',
      new apigateway.LambdaIntegration(getSubscriptionLambda),
      { authorizer, authorizationType: apigateway.AuthorizationType.COGNITO }
    );

    // Stripe Webhook Lambda (public)
    const webhookLambda = new nodejs.NodejsFunction(this, 'WebhookFunction', {
      ...lambdaConfig,
      functionName: `${appName}-Payments-Webhook-${environment}`,
      entry: path.join(__dirname, '../../src/functions/payments/webhook.ts'),
      handler: 'handler',
      environment: paymentsEnv,
      timeout: cdk.Duration.seconds(60),
    });
    table.grantReadWriteData(webhookLambda);
    eventBus.grantPutEventsTo(webhookLambda);
    webhookLambda.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['ssm:GetParameter'],
      resources: [`arn:aws:ssm:${this.region}:${this.account}:parameter/collabhub/stripe/*`],
    }));
    
    webhookResource.addMethod('POST',
      new apigateway.LambdaIntegration(webhookLambda)
    );

    // ==================== ADMIN ENDPOINTS ====================
    const adminResource = apiRoot.addResource('admin');
    const adminUsersResource = adminResource.addResource('users');
    const adminUserIdResource = adminUsersResource.addResource('{userId}');
    const adminBanResource = adminUserIdResource.addResource('ban');
    const adminUnbanResource = adminUserIdResource.addResource('unban');
    const adminStartupsResource = adminResource.addResource('startups');
    const adminStartupIdResource = adminStartupsResource.addResource('{startupId}');
    const adminModerateResource = adminStartupIdResource.addResource('moderate');
    const metricsResource = adminResource.addResource('metrics');
    const auditLogsResource = adminResource.addResource('audit-logs');

    // Admin List Users Lambda
    const adminListUsersLambda = new nodejs.NodejsFunction(this, 'AdminListUsersFunction', {
      ...lambdaConfig,
      functionName: `${appName}-Admin-ListUsers-${environment}`,
      entry: path.join(__dirname, '../../src/functions/admin/list-users.ts'),
      handler: 'handler',
    });
    table.grantReadData(adminListUsersLambda);
    
    adminUsersResource.addMethod('GET',
      new apigateway.LambdaIntegration(adminListUsersLambda),
      { authorizer, authorizationType: apigateway.AuthorizationType.COGNITO }
    );

    // Admin Ban User Lambda
    const adminBanUserLambda = new nodejs.NodejsFunction(this, 'AdminBanUserFunction', {
      ...lambdaConfig,
      functionName: `${appName}-Admin-BanUser-${environment}`,
      entry: path.join(__dirname, '../../src/functions/admin/ban-user.ts'),
      handler: 'handler',
    });
    table.grantReadWriteData(adminBanUserLambda);
    adminBanUserLambda.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['cognito-idp:AdminDisableUser'],
      resources: [userPool.userPoolArn],
    }));
    
    adminBanResource.addMethod('PUT',
      new apigateway.LambdaIntegration(adminBanUserLambda),
      { authorizer, authorizationType: apigateway.AuthorizationType.COGNITO }
    );

    // Admin Unban User Lambda
    const adminUnbanUserLambda = new nodejs.NodejsFunction(this, 'AdminUnbanUserFunction', {
      ...lambdaConfig,
      functionName: `${appName}-Admin-UnbanUser-${environment}`,
      entry: path.join(__dirname, '../../src/functions/admin/unban-user.ts'),
      handler: 'handler',
    });
    table.grantReadWriteData(adminUnbanUserLambda);
    adminUnbanUserLambda.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['cognito-idp:AdminEnableUser'],
      resources: [userPool.userPoolArn],
    }));
    
    adminUnbanResource.addMethod('PUT',
      new apigateway.LambdaIntegration(adminUnbanUserLambda),
      { authorizer, authorizationType: apigateway.AuthorizationType.COGNITO }
    );

    // Admin Moderate Startup Lambda
    const adminModerateStartupLambda = new nodejs.NodejsFunction(this, 'AdminModerateStartupFunction', {
      ...lambdaConfig,
      functionName: `${appName}-Admin-ModerateStartup-${environment}`,
      entry: path.join(__dirname, '../../src/functions/admin/moderate-startup.ts'),
      handler: 'handler',
    });
    table.grantReadWriteData(adminModerateStartupLambda);
    
    adminModerateResource.addMethod('PUT',
      new apigateway.LambdaIntegration(adminModerateStartupLambda),
      { authorizer, authorizationType: apigateway.AuthorizationType.COGNITO }
    );

    // Admin Get Metrics Lambda
    const adminGetMetricsLambda = new nodejs.NodejsFunction(this, 'AdminGetMetricsFunction', {
      ...lambdaConfig,
      functionName: `${appName}-Admin-GetMetrics-${environment}`,
      entry: path.join(__dirname, '../../src/functions/admin/get-metrics.ts'),
      handler: 'handler',
    });
    table.grantReadData(adminGetMetricsLambda);
    adminGetMetricsLambda.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['cloudwatch:GetMetricData', 'cloudwatch:GetMetricStatistics'],
      resources: ['*'],
    }));
    
    metricsResource.addMethod('GET',
      new apigateway.LambdaIntegration(adminGetMetricsLambda),
      { authorizer, authorizationType: apigateway.AuthorizationType.COGNITO }
    );

    // Admin Get Audit Logs Lambda
    const adminGetAuditLogsLambda = new nodejs.NodejsFunction(this, 'AdminGetAuditLogsFunction', {
      ...lambdaConfig,
      functionName: `${appName}-Admin-GetAuditLogs-${environment}`,
      entry: path.join(__dirname, '../../src/functions/admin/get-audit-logs.ts'),
      handler: 'handler',
    });
    table.grantReadData(adminGetAuditLogsLambda);
    
    auditLogsResource.addMethod('GET',
      new apigateway.LambdaIntegration(adminGetAuditLogsLambda),
      { authorizer, authorizationType: apigateway.AuthorizationType.COGNITO }
    );

    // ==================== NOTIFICATIONS ENDPOINTS ====================
    const notificationsResource = apiRoot.addResource('notifications');
    const notificationIdResource = notificationsResource.addResource('{notificationId}');
    const notificationReadResource = notificationIdResource.addResource('read');
    const readAllResource = notificationsResource.addResource('read-all');

    // List Notifications Lambda
    const listNotificationsLambda = new nodejs.NodejsFunction(this, 'ListNotificationsFunction', {
      ...lambdaConfig,
      functionName: `${appName}-Notifications-List-${environment}`,
      entry: path.join(__dirname, '../../src/functions/notifications/list-notifications.ts'),
      handler: 'handler',
    });
    table.grantReadData(listNotificationsLambda);
    
    notificationsResource.addMethod('GET',
      new apigateway.LambdaIntegration(listNotificationsLambda),
      { authorizer, authorizationType: apigateway.AuthorizationType.COGNITO }
    );

    // Mark Notification Read Lambda
    const markNotificationReadLambda = new nodejs.NodejsFunction(this, 'MarkNotificationReadFunction', {
      ...lambdaConfig,
      functionName: `${appName}-Notifications-MarkRead-${environment}`,
      entry: path.join(__dirname, '../../src/functions/notifications/mark-read.ts'),
      handler: 'handler',
    });
    table.grantReadWriteData(markNotificationReadLambda);
    
    notificationReadResource.addMethod('PUT',
      new apigateway.LambdaIntegration(markNotificationReadLambda),
      { authorizer, authorizationType: apigateway.AuthorizationType.COGNITO }
    );

    // Mark All Read Lambda
    const markAllReadLambda = new nodejs.NodejsFunction(this, 'MarkAllReadFunction', {
      ...lambdaConfig,
      functionName: `${appName}-Notifications-MarkAllRead-${environment}`,
      entry: path.join(__dirname, '../../src/functions/notifications/mark-all-read.ts'),
      handler: 'handler',
    });
    table.grantReadWriteData(markAllReadLambda);
    
    readAllResource.addMethod('PUT',
      new apigateway.LambdaIntegration(markAllReadLambda),
      { authorizer, authorizationType: apigateway.AuthorizationType.COGNITO }
    );

    // ==================== SQS WORKER LAMBDAS ====================

    // Notification Worker Lambda
    const notificationWorkerLambda = new nodejs.NodejsFunction(this, 'NotificationWorkerFunction', {
      ...lambdaConfig,
      functionName: `${appName}-Worker-Notification-${environment}`,
      entry: path.join(__dirname, '../../src/functions/workers/notification-worker.ts'),
      handler: 'handler',
      timeout: cdk.Duration.seconds(60),
    });
    table.grantReadWriteData(notificationWorkerLambda);
    notificationWorkerLambda.addEventSource(new lambdaEventSources.SqsEventSource(notificationQueue, {
      batchSize: 10,
      maxBatchingWindow: cdk.Duration.seconds(5),
    }));

    // Email Worker Lambda
    const emailWorkerLambda = new nodejs.NodejsFunction(this, 'EmailWorkerFunction', {
      ...lambdaConfig,
      functionName: `${appName}-Worker-Email-${environment}`,
      entry: path.join(__dirname, '../../src/functions/workers/email-worker.ts'),
      handler: 'handler',
      timeout: cdk.Duration.seconds(120),
    });
    emailWorkerLambda.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['ses:SendEmail', 'ses:SendTemplatedEmail'],
      resources: ['*'],
    }));
    emailWorkerLambda.addEventSource(new lambdaEventSources.SqsEventSource(emailQueue, {
      batchSize: 5,
      maxBatchingWindow: cdk.Duration.seconds(10),
    }));

    // Audit Worker Lambda
    const auditWorkerLambda = new nodejs.NodejsFunction(this, 'AuditWorkerFunction', {
      ...lambdaConfig,
      functionName: `${appName}-Worker-Audit-${environment}`,
      entry: path.join(__dirname, '../../src/functions/workers/audit-worker.ts'),
      handler: 'handler',
      timeout: cdk.Duration.seconds(30),
    });
    table.grantWriteData(auditWorkerLambda);
    auditWorkerLambda.addEventSource(new lambdaEventSources.SqsEventSource(auditQueue, {
      batchSize: 25,
      maxBatchingWindow: cdk.Duration.seconds(5),
    }));

    // Outputs
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: this.api.url,
      exportName: `${appName}-ApiEndpoint`,
      description: 'API Gateway Endpoint URL',
    });

    new cdk.CfnOutput(this, 'ApiId', {
      value: this.api.restApiId,
      exportName: `${appName}-ApiId`,
      description: 'API Gateway ID',
    });
  }
}
