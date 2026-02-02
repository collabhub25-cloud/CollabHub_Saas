import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { CognitoIdentityProviderClient, AdminCreateUserCommand, AdminSetUserPasswordCommand, AdminAddUserToGroupCommand } from '@aws-sdk/client-cognito-identity-provider';
import { putItem } from '../../lib/dynamodb/client.js';
import { success, errors, parseBody, generateId, now, logger } from '../../lib/utils/response.js';
import { registerSchema, validate, formatValidationErrors } from '../../schemas/index.js';
import type { UserItem } from '../../types/index.js';

const cognitoClient = new CognitoIdentityProviderClient({ region: process.env.REGION });
const USER_POOL_ID = process.env.USER_POOL_ID!;

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const body = parseBody(event.body);
    if (!body) {
      return errors.badRequest('Request body is required');
    }

    // Validate input
    const validation = validate(registerSchema, body);
    if (!validation.success) {
      return errors.badRequest('Validation failed', { errors: formatValidationErrors(validation.errors) });
    }

    const { email, password, firstName, lastName, role } = validation.data;
    
    logger.info('Registering new user', { email, role });

    // Create user in Cognito
    const userId = generateId();
    
    try {
      await cognitoClient.send(new AdminCreateUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: email,
        UserAttributes: [
          { Name: 'email', Value: email },
          { Name: 'email_verified', Value: 'true' },
          { Name: 'custom:role', Value: role },
          { Name: 'custom:firstName', Value: firstName },
          { Name: 'custom:lastName', Value: lastName },
        ],
        MessageAction: 'SUPPRESS', // Don't send welcome email
      }));

      // Set permanent password
      await cognitoClient.send(new AdminSetUserPasswordCommand({
        UserPoolId: USER_POOL_ID,
        Username: email,
        Password: password,
        Permanent: true,
      }));

      // Add user to role group
      await cognitoClient.send(new AdminAddUserToGroupCommand({
        UserPoolId: USER_POOL_ID,
        Username: email,
        GroupName: role,
      }));

    } catch (cognitoError: any) {
      if (cognitoError.name === 'UsernameExistsException') {
        return errors.conflict('An account with this email already exists');
      }
      throw cognitoError;
    }

    // Create user profile in DynamoDB
    const timestamp = now();
    const userItem: UserItem = {
      PK: `USER#${userId}`,
      SK: 'PROFILE',
      userId,
      email: email.toLowerCase(),
      role,
      firstName,
      lastName,
      status: 'ACTIVE',
      subscriptionStatus: 'NONE',
      subscriptionTier: 'FREE',
      entityType: 'USER',
      createdAt: timestamp,
      updatedAt: timestamp,
      GSI1PK: `ROLE#${role}`,
      GSI1SK: `USER#${userId}`,
      GSI2PK: 'STATUS#ACTIVE',
      GSI2SK: `USER#${userId}`,
    };

    await putItem(userItem);

    logger.info('User registered successfully', { userId, email, role });

    return success({
      userId,
      email,
      role,
      message: 'Account created successfully',
    }, 201);

  } catch (err) {
    logger.error('Registration failed', err as Error);
    return errors.internal('Failed to create account');
  }
}
