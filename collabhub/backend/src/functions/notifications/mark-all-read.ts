import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { queryByPK, updateItem } from '../../lib/dynamodb/client.js';
import { success, errors, getUserId, now, logger } from '../../lib/utils/response.js';
import type { NotificationItem } from '../../types/index.js';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const claims = event.requestContext.authorizer?.claims;
    if (!claims) {
      return errors.unauthorized('Missing authorization');
    }

    const userId = getUserId(claims);

    logger.info('Marking all notifications as read', { userId });

    // Get all unread notifications
    const result = await queryByPK<NotificationItem>(
      `USER#${userId}`,
      'NOTIFICATION#',
      200
    );

    const unreadNotifications = result.items.filter(n => !n.isRead);

    // Update each unread notification
    const timestamp = now();
    for (const notification of unreadNotifications) {
      await updateItem(`USER#${userId}`, `NOTIFICATION#${notification.notificationId}`, {
        isRead: true,
        readAt: timestamp,
      });
    }

    logger.info('Marked all as read', { count: unreadNotifications.length });

    return success({
      message: 'All notifications marked as read',
      markedCount: unreadNotifications.length,
    });

  } catch (err) {
    logger.error('Failed to mark all as read', err as Error);
    return errors.internal('Failed to mark all notifications as read');
  }
}
