import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { getItem, updateItem } from '../../lib/dynamodb/client.js';
import { success, errors, getUserId, parseBody, now, logger } from '../../lib/utils/response.js';
import { updateProfileSchema, validate, formatValidationErrors } from '../../schemas/index.js';
import type { UserItem } from '../../types/index.js';

const eventBridgeClient = new EventBridgeClient({ region: process.env.REGION });
const EVENT_BUS_NAME = process.env.EVENT_BUS_NAME!;

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const claims = event.requestContext.authorizer?.claims;
    if (!claims) {
      return errors.unauthorized('Missing authorization');
    }

    const userId = getUserId(claims);
    const body = parseBody(event.body);
    
    if (!body) {
      return errors.badRequest('Request body is required');
    }

    // Validate input
    const validation = validate(updateProfileSchema, body);
    if (!validation.success) {
      return errors.badRequest('Validation failed', { errors: formatValidationErrors(validation.errors) });
    }

    logger.info('Updating user profile', { userId });

    // Check user exists
    const user = await getItem<UserItem>(`USER#${userId}`, 'PROFILE');
    if (!user) {
      return errors.notFound('User profile');
    }

    // Build updates
    const updates: Record<string, unknown> = {};
    const data = validation.data;

    if (data.firstName !== undefined) updates.firstName = data.firstName;
    if (data.lastName !== undefined) updates.lastName = data.lastName;
    if (data.bio !== undefined) updates.bio = data.bio;
    if (data.skills !== undefined) updates.skills = data.skills;
    if (data.linkedinUrl !== undefined) updates.linkedinUrl = data.linkedinUrl;
    if (data.avatarUrl !== undefined) updates.avatarUrl = data.avatarUrl;

    if (Object.keys(updates).length === 0) {
      return errors.badRequest('No valid fields to update');
    }

    updates.updatedAt = now();

    await updateItem(`USER#${userId}`, 'PROFILE', updates);

    // Publish event
    await eventBridgeClient.send(new PutEventsCommand({
      Entries: [{
        EventBusName: EVENT_BUS_NAME,
        Source: 'collabhub.users',
        DetailType: 'USER_PROFILE_UPDATED',
        Detail: JSON.stringify({
          userId,
          updatedFields: Object.keys(updates),
          timestamp: now(),
        }),
      }],
    }));

    logger.info('Profile updated successfully', { userId });

    return success({
      message: 'Profile updated successfully',
      updatedFields: Object.keys(updates).filter(k => k !== 'updatedAt'),
    });

  } catch (err) {
    logger.error('Failed to update profile', err as Error);
    return errors.internal('Failed to update profile');
  }
}
