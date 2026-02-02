import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { queryByPK } from '../../lib/dynamodb/client.js';
import { paginatedSuccess, errors, getUserId, logger } from '../../lib/utils/response.js';
import type { NotificationItem } from '../../types/index.js';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const claims = event.requestContext.authorizer?.claims;
    if (!claims) {
      return errors.unauthorized('Missing authorization');
    }

    const userId = getUserId(claims);
    const page = parseInt(event.queryStringParameters?.page || '1');
    const limit = Math.min(parseInt(event.queryStringParameters?.limit || '20'), 100);
    const unreadOnly = event.queryStringParameters?.unreadOnly === 'true';

    logger.info('Listing notifications', { userId, page, unreadOnly });

    // Query notifications by user
    const result = await queryByPK<NotificationItem>(
      `USER#${userId}`,
      'NOTIFICATION#',
      200
    );

    let notifications = result.items;

    // Sort by createdAt descending
    notifications.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Filter if unreadOnly
    if (unreadOnly) {
      notifications = notifications.filter(n => !n.isRead);
    }

    // Paginate
    const startIndex = (page - 1) * limit;
    const paginatedNotifications = notifications.slice(startIndex, startIndex + limit);

    const sanitizedNotifications = paginatedNotifications.map(n => ({
      notificationId: n.notificationId,
      type: n.type,
      title: n.title,
      body: n.body,
      relatedEntityType: n.relatedEntityType,
      relatedEntityId: n.relatedEntityId,
      isRead: n.isRead,
      createdAt: n.createdAt,
    }));

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return paginatedSuccess(
      { 
        notifications: sanitizedNotifications,
        unreadCount,
      },
      {
        page,
        limit,
        total: notifications.length,
        hasMore: startIndex + limit < notifications.length,
      }
    );

  } catch (err) {
    logger.error('Failed to list notifications', err as Error);
    return errors.internal('Failed to retrieve notifications');
  }
}
