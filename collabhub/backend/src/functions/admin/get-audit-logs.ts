import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { queryByPK, queryGSI } from '../../lib/dynamodb/client.js';
import { paginatedSuccess, errors, isAdmin, logger } from '../../lib/utils/response.js';
import type { AuditLogItem } from '../../types/index.js';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const claims = event.requestContext.authorizer?.claims;
    if (!claims || !isAdmin(claims)) {
      return errors.forbidden('Admin access required');
    }

    // Parse query parameters
    const page = parseInt(event.queryStringParameters?.page || '1');
    const limit = Math.min(parseInt(event.queryStringParameters?.limit || '50'), 200);
    const userId = event.queryStringParameters?.userId;
    const date = event.queryStringParameters?.date; // YYYY-MM-DD format

    logger.info('Getting audit logs', { userId, date, page, limit });

    let auditLogs: AuditLogItem[] = [];

    if (userId) {
      // Query by user
      const result = await queryGSI<AuditLogItem>(
        'GSI1',
        'GSI1PK',
        `USER#${userId}`,
        'GSI1SK',
        'AUDIT#',
        limit * page,
        false
      );
      auditLogs = result.items;
    } else if (date) {
      // Query by date
      const result = await queryByPK<AuditLogItem>(
        `AUDIT#${date}`,
        undefined,
        limit * page
      );
      auditLogs = result.items;
    } else {
      // Get today's logs by default
      const today = new Date().toISOString().split('T')[0];
      const result = await queryByPK<AuditLogItem>(
        `AUDIT#${today}`,
        undefined,
        limit * page
      );
      auditLogs = result.items;
    }

    // Sort by timestamp descending
    auditLogs.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Paginate
    const startIndex = (page - 1) * limit;
    const paginatedLogs = auditLogs.slice(startIndex, startIndex + limit);

    const sanitizedLogs = paginatedLogs.map(log => ({
      auditId: log.auditId,
      userId: log.userId,
      action: log.action,
      resourceType: log.resourceType,
      resourceId: log.resourceId,
      ipAddress: log.ipAddress,
      metadata: log.metadata,
      createdAt: log.createdAt,
    }));

    return paginatedSuccess(
      { auditLogs: sanitizedLogs },
      {
        page,
        limit,
        total: auditLogs.length,
        hasMore: startIndex + limit < auditLogs.length,
      }
    );

  } catch (err) {
    logger.error('Failed to get audit logs', err as Error);
    return errors.internal('Failed to retrieve audit logs');
  }
}
