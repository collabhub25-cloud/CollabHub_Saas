import type { SQSEvent, SQSHandler } from 'aws-lambda';
import { putItem } from '../../lib/dynamodb/client.js';
import { generateId, now, logger } from '../../lib/utils/response.js';
import type { NotificationItem, NotificationType } from '../../types/index.js';

interface NotificationEvent {
  type: string;
  userId?: string;
  recipients?: string[];
  title?: string;
  body?: string;
  startupName?: string;
  applicantName?: string;
  senderName?: string;
  preview?: string;
  newStatus?: string;
  previousStatus?: string;
  tier?: string;
  [key: string]: unknown;
}

export const handler: SQSHandler = async (event: SQSEvent) => {
  logger.info('Processing notification events', { count: event.Records.length });

  for (const record of event.Records) {
    try {
      const eventDetail: NotificationEvent = JSON.parse(record.body);
      const detailType = eventDetail.type || eventDetail['detail-type'] || '';

      // Parse EventBridge event if wrapped
      let detail = eventDetail;
      if (eventDetail.detail) {
        detail = typeof eventDetail.detail === 'string' 
          ? JSON.parse(eventDetail.detail) 
          : eventDetail.detail;
      }

      let notifications: Array<{ userId: string; type: NotificationType; title: string; body: string; relatedEntityType?: string; relatedEntityId?: string }> = [];

      switch (detailType) {
        case 'APPLICATION_SUBMITTED':
          if (detail.founderId) {
            notifications.push({
              userId: detail.founderId as string,
              type: 'APPLICATION_UPDATE',
              title: 'New Application Received',
              body: `${detail.applicantName} applied for ${detail.roleTitle} at ${detail.startupName}`,
              relatedEntityType: 'APPLICATION',
              relatedEntityId: detail.applicationId as string,
            });
          }
          break;

        case 'APPLICATION_STATUS_CHANGED':
          if (detail.applicantId) {
            notifications.push({
              userId: detail.applicantId as string,
              type: 'APPLICATION_UPDATE',
              title: `Application ${detail.newStatus}`,
              body: `Your application at ${detail.startupName} has been ${(detail.newStatus as string)?.toLowerCase()}`,
              relatedEntityType: 'APPLICATION',
              relatedEntityId: detail.applicationId as string,
            });
          }
          break;

        case 'MESSAGE_SENT':
          if (detail.recipients) {
            for (const recipientId of detail.recipients as string[]) {
              notifications.push({
                userId: recipientId,
                type: 'MESSAGE',
                title: `New Message from ${detail.senderName}`,
                body: detail.preview as string || 'You have a new message',
                relatedEntityType: 'CONVERSATION',
                relatedEntityId: detail.conversationId as string,
              });
            }
          }
          break;

        case 'SUBSCRIPTION_CREATED':
        case 'SUBSCRIPTION_UPDATED':
          if (detail.userId) {
            notifications.push({
              userId: detail.userId as string,
              type: 'PAYMENT',
              title: 'Subscription Updated',
              body: `Your subscription has been updated to ${detail.tier}`,
              relatedEntityType: 'SUBSCRIPTION',
              relatedEntityId: detail.subscriptionId as string,
            });
          }
          break;

        case 'PAYMENT_FAILED':
          if (detail.userId) {
            notifications.push({
              userId: detail.userId as string,
              type: 'PAYMENT',
              title: 'Payment Failed',
              body: 'Your payment could not be processed. Please update your payment method.',
              relatedEntityType: 'SUBSCRIPTION',
            });
          }
          break;
      }

      // Create notifications
      const timestamp = now();
      for (const notif of notifications) {
        const notificationId = generateId();
        const notificationItem: NotificationItem = {
          PK: `USER#${notif.userId}`,
          SK: `NOTIFICATION#${notificationId}`,
          notificationId,
          userId: notif.userId,
          type: notif.type,
          title: notif.title,
          body: notif.body,
          relatedEntityType: notif.relatedEntityType,
          relatedEntityId: notif.relatedEntityId,
          isRead: false,
          entityType: 'NOTIFICATION',
          createdAt: timestamp,
        };

        await putItem(notificationItem);
        logger.info('Notification created', { notificationId, userId: notif.userId, type: notif.type });
      }

    } catch (err) {
      logger.error('Failed to process notification event', err as Error, { record: record.body });
    }
  }
};
