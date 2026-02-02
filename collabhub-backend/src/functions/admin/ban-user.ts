import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { CognitoIdentityProviderClient, AdminDisableUserCommand } from '@aws-sdk/client-cognito-identity-provider';
import { getItem, updateItem } from '../../lib/dynamodb/client.js';
import { success, errors, isAdmin, parseBody, now, logger } from '../../lib/utils/response.js';
import { banUserSchema, validate, formatValidationErrors } from '../../schemas/index.js';
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

    const body = parseBody(event.body);
    if (!body) {
      return errors.badRequest('Request body is required');
    }

    // Validate input
    const validation = validate(banUserSchema, body);
    if (!validation.success) {
      return errors.badRequest('Validation failed', { errors: formatValidationErrors(validation.errors) });
    }

    const { reason } = validation.data;

    logger.info('Banning user', { targetUserId, reason });

    // Get user
    const user = await getItem<UserItem>(`USER#${targetUserId}`, 'PROFILE');
    if (!user) {
      return errors.notFound('User');
    }

    if (user.status === 'BANNED') {
      return errors.badRequest('User is already banned');
    }

    // Cannot ban admins
    if (user.role === 'ADMIN') {
      return errors.forbidden('Cannot ban admin users');
    }

    // Disable user in Cognito
    try {
      await cognitoClient.send(new AdminDisableUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: user.email,
      }));
    } catch (cognitoErr) {
      logger.error('Failed to disable Cognito user', cognitoErr as Error);
    }

    // Update user in DynamoDB
    await updateItem(`USER#${targetUserId}`, 'PROFILE', {
      status: 'BANNED',
      GSI2PK: 'STATUS#BANNED',
      banReason: reason,
      bannedAt: now(),
      updatedAt: now(),
    });

    logger.info('User banned successfully', { targetUserId });

    return success({
      message: 'User banned successfully',
      userId: targetUserId,
    });

  } catch (err) {
    logger.error('Failed to ban user', err as Error);
    return errors.internal('Failed to ban user');
  }
}
