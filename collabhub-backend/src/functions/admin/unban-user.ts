import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { CognitoIdentityProviderClient, AdminEnableUserCommand } from '@aws-sdk/client-cognito-identity-provider';
import { getItem, updateItem } from '../../lib/dynamodb/client.js';
import { success, errors, isAdmin, now, logger } from '../../lib/utils/response.js';
import type { UserItem } from '../../types/index.js';

const cognitoClient = new CognitoIdentityProviderClient({ region: process.env.REGION });
const USER_POOL_ID = process.env.USER_POOL_ID!;

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const claims = event.requestContext.authorizer?.claims;
    if (!claims || !isAdmin(claims)) {
      return errors.forbidden('Admin access required');
    }

    const targetUserId = event.pathParameters?.userId;
    if (!targetUserId) {
      return errors.badRequest('User ID is required');
    }

    logger.info('Unbanning user', { targetUserId });

    // Get user
    const user = await getItem<UserItem>(`USER#${targetUserId}`, 'PROFILE');
    if (!user) {
      return errors.notFound('User');
    }

    if (user.status !== 'BANNED') {
      return errors.badRequest('User is not banned');
    }

    // Enable user in Cognito
    try {
      await cognitoClient.send(new AdminEnableUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: user.email,
      }));
    } catch (cognitoErr) {
      logger.error('Failed to enable Cognito user', cognitoErr as Error);
    }

    // Update user in DynamoDB
    await updateItem(`USER#${targetUserId}`, 'PROFILE', {
      status: 'ACTIVE',
      GSI2PK: 'STATUS#ACTIVE',
      updatedAt: now(),
    });

    logger.info('User unbanned successfully', { targetUserId });

    return success({
      message: 'User unbanned successfully',
      userId: targetUserId,
    });

  } catch (err) {
    logger.error('Failed to unban user', err as Error);
    return errors.internal('Failed to unban user');
  }
}
