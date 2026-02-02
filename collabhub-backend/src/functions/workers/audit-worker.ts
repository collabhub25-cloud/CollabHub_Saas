import type { SQSEvent, SQSHandler } from 'aws-lambda';
import { putItem } from '../../lib/dynamodb/client.js';
import { generateId, now, logger } from '../../lib/utils/response.js';
import type { AuditLogItem } from '../../types/index.js';

interface AuditEvent {
  source?: string;
  'detail-type'?: string;
  detail?: string | Record<string, unknown>;
  type?: string;
  userId?: string;
  startupId?: string;
  applicationId?: string;
  conversationId?: string;
  timestamp?: string;
  [key: string]: unknown;
}

export const handler: SQSHandler = async (event: SQSEvent) => {
  logger.info('Processing audit events', { count: event.Records.length });

  for (const record of event.Records) {
    try {
      const eventDetail: AuditEvent = JSON.parse(record.body);
      
      // Parse EventBridge event if wrapped
      let detail = eventDetail;
      if (eventDetail.detail) {
        detail = typeof eventDetail.detail === 'string' 
          ? JSON.parse(eventDetail.detail) 
          : eventDetail.detail;
      }

      const source = eventDetail.source || '';
      const detailType = eventDetail['detail-type'] || eventDetail.type || 'UNKNOWN';
      
      // Extract resource info from the event
      let resourceType = 'UNKNOWN';
      let resourceId = '';

      if (source.includes('users') || detail.userId) {
        resourceType = 'USER';
        resourceId = (detail.userId || '') as string;
      } else if (source.includes('startups') || detail.startupId) {
        resourceType = 'STARTUP';
        resourceId = (detail.startupId || '') as string;
      } else if (source.includes('applications') || detail.applicationId) {
        resourceType = 'APPLICATION';
        resourceId = (detail.applicationId || '') as string;
      } else if (source.includes('chat') || detail.conversationId) {
        resourceType = 'CONVERSATION';
        resourceId = (detail.conversationId || '') as string;
      } else if (source.includes('payments')) {
        resourceType = 'SUBSCRIPTION';
        resourceId = (detail.subscriptionId || detail.userId || '') as string;
      }

      const today = new Date().toISOString().split('T')[0];
      const timestamp = now();
      const auditId = generateId();

      const auditItem: AuditLogItem = {
        PK: `AUDIT#${today}`,
        SK: `${timestamp}#${auditId}`,
        auditId,
        userId: (detail.userId || 'SYSTEM') as string,
        action: detailType,
        resourceType,
        resourceId,
        metadata: {
          source,
          detail: JSON.stringify(detail).substring(0, 1000), // Limit size
        },
        entityType: 'AUDIT_LOG',
        createdAt: timestamp,
        GSI1PK: detail.userId ? `USER#${detail.userId}` : undefined,
        GSI1SK: detail.userId ? `AUDIT#${timestamp}` : undefined,
      };

      await putItem(auditItem);
      logger.info('Audit log created', { auditId, action: detailType, resourceType });

    } catch (err) {
      logger.error('Failed to process audit event', err as Error, { record: record.body });
    }
  }
};
