import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getItem, updateItem } from '../../lib/dynamodb/client.js';
import { success, errors, getUserId, now, logger } from '../../lib/utils/response.js';
import type { NotificationItem } from '../../types/index.js';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const claims = event.requestContext.authorizer?.claims;
    if (!claims) {
      return errors.unauthorized('Missing authorization');
    }

    const userId = getUserId(claims);
    const notificationId = event.pathParameters?.notificationId;

    if (!notificationId) {
      return errors.badRequest('Notification ID is required');
    }

    logger.info('Marking notification as read', { userId, notificationId });

    // Get notification
    const notification = await getItem<NotificationItem>(`USER#${userId}`, `NOTIFICATION#${notificationId}`);
    if (!notification) {
      return errors.notFound('Notification');
    }

    // Update notification
    await updateItem(`USER#${userId}`, `NOTIFICATION#${notificationId}`, {
      isRead: true,
      readAt: now(),
    });

    return success({
      message: 'Notification marked as read',
    });

  } catch (err) {
    logger.error('Failed to mark notification as read', err as Error);
    return errors.internal('Failed to mark notification as read');
  }
}
