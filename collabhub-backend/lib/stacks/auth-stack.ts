import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import * as path from 'path';

interface AuthStackProps extends cdk.StackProps {
  appName: string;
  environment: string;
}

export class AuthStack extends cdk.Stack {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;
  public readonly founderGroup: cognito.CfnUserPoolGroup;
  public readonly talentGroup: cognito.CfnUserPoolGroup;
  public readonly investorGroup: cognito.CfnUserPoolGroup;
  public readonly adminGroup: cognito.CfnUserPoolGroup;

  constructor(scope: Construct, id: string, props: AuthStackProps) {
    super(scope, id, props);

    const { appName, environment } = props;

    // Pre-token generation Lambda for custom claims
    const preTokenGenerationLambda = new lambda.Function(this, 'PreTokenGeneration', {
      functionName: `${appName}-PreTokenGeneration-${environment}`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          // Add custom claims to the token
          event.response = {
            claimsOverrideDetails: {
              claimsToAddOrOverride: {
                'custom:role': event.request.userAttributes['custom:role'] || 'talent',
              },
            },
          };
          return event;
        };
      `),
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
    });

    // Post confirmation Lambda to create user profile in DynamoDB
    const postConfirmationLambda = new lambda.Function(this, 'PostConfirmation', {
      functionName: `${appName}-PostConfirmation-${environment}`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
        const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
        
        const client = new DynamoDBClient({});
        const docClient = DynamoDBDocumentClient.from(client);
        
        exports.handler = async (event) => {
          const { userName, request } = event;
          const { userAttributes } = request;
          
          const userId = userAttributes.sub;
          const email = userAttributes.email;
          const role = userAttributes['custom:role'] || 'talent';
          const firstName = userAttributes['custom:firstName'] || '';
          const lastName = userAttributes['custom:lastName'] || '';
          
          const now = new Date().toISOString();
          
          const item = {
            PK: 'USER#' + userId,
            SK: 'PROFILE',
            userId,
            email,
            role: role.toUpperCase(),
            firstName,
            lastName,
            status: 'ACTIVE',
            subscriptionStatus: 'NONE',
            subscriptionTier: 'FREE',
            entityType: 'USER',
            createdAt: now,
            updatedAt: now,
            GSI1PK: 'ROLE#' + role.toUpperCase(),
            GSI1SK: 'USER#' + userId,
            GSI2PK: 'STATUS#ACTIVE',
            GSI2SK: 'USER#' + userId,
          };
          
          try {
            await docClient.send(new PutCommand({
              TableName: process.env.TABLE_NAME,
              Item: item,
            }));
          } catch (error) {
            console.error('Error creating user profile:', error);
            throw error;
          }
          
          return event;
        };
      `),
      timeout: cdk.Duration.seconds(15),
      memorySize: 256,
      environment: {
        TABLE_NAME: `${appName.toLowerCase()}-main-${environment}`,
      },
    });

    // Grant DynamoDB permissions to post confirmation lambda
    postConfirmationLambda.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['dynamodb:PutItem'],
      resources: [`arn:aws:dynamodb:${this.region}:${this.account}:table/${appName.toLowerCase()}-main-${environment}`],
    }));

    // User Pool
    this.userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: `${appName}-UserPool-${environment}`,
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
      },
      autoVerify: {
        email: true,
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
      },
      customAttributes: {
        role: new cognito.StringAttribute({ mutable: true }),
        firstName: new cognito.StringAttribute({ mutable: true }),
        lastName: new cognito.StringAttribute({ mutable: true }),
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
        tempPasswordValidity: cdk.Duration.days(7),
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: environment === 'production'
        ? cdk.RemovalPolicy.RETAIN
        : cdk.RemovalPolicy.DESTROY,
      lambdaTriggers: {
        preTokenGeneration: preTokenGenerationLambda,
        postConfirmation: postConfirmationLambda,
      },
      email: cognito.UserPoolEmail.withCognito(),
    });

    // User Pool Client
    this.userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
      userPool: this.userPool,
      userPoolClientName: `${appName}-WebClient-${environment}`,
      authFlows: {
        userPassword: true,
        userSrp: true,
        custom: true,
      },
      generateSecret: false,
      accessTokenValidity: cdk.Duration.hours(1),
      idTokenValidity: cdk.Duration.hours(1),
      refreshTokenValidity: cdk.Duration.days(30),
      preventUserExistenceErrors: true,
      readAttributes: new cognito.ClientAttributes()
        .withStandardAttributes({ email: true, emailVerified: true })
        .withCustomAttributes('role', 'firstName', 'lastName'),
      writeAttributes: new cognito.ClientAttributes()
        .withStandardAttributes({ email: true })
        .withCustomAttributes('role', 'firstName', 'lastName'),
    });

    // User Groups (RBAC)
    this.founderGroup = new cognito.CfnUserPoolGroup(this, 'FounderGroup', {
      userPoolId: this.userPool.userPoolId,
      groupName: 'FOUNDER',
      description: 'Startup founders who can create and manage startups',
      precedence: 1,
    });

    this.talentGroup = new cognito.CfnUserPoolGroup(this, 'TalentGroup', {
      userPoolId: this.userPool.userPoolId,
      groupName: 'TALENT',
      description: 'Job seekers who can browse and apply to startups',
      precedence: 2,
    });

    this.investorGroup = new cognito.CfnUserPoolGroup(this, 'InvestorGroup', {
      userPoolId: this.userPool.userPoolId,
      groupName: 'INVESTOR',
      description: 'Investors who can discover and invest in startups',
      precedence: 3,
    });

    this.adminGroup = new cognito.CfnUserPoolGroup(this, 'AdminGroup', {
      userPoolId: this.userPool.userPoolId,
      groupName: 'ADMIN',
      description: 'Platform administrators with full access',
      precedence: 0,
    });

    // Outputs
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: this.userPool.userPoolId,
      exportName: `${appName}-UserPoolId`,
      description: 'Cognito User Pool ID',
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: this.userPoolClient.userPoolClientId,
      exportName: `${appName}-UserPoolClientId`,
      description: 'Cognito User Pool Client ID',
    });

    new cdk.CfnOutput(this, 'UserPoolArn', {
      value: this.userPool.userPoolArn,
      exportName: `${appName}-UserPoolArn`,
      description: 'Cognito User Pool ARN',
    });
  }
}
