import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getItem, updateItem } from '../../lib/dynamodb/client.js';
import { success, errors, getUserId, getUserRole, logger } from '../../lib/utils/response.js';
import type { StartupItem } from '../../types/index.js';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const claims = event.requestContext.authorizer?.claims;
    if (!claims) {
      return errors.unauthorized('Missing authorization');
    }

    const userId = getUserId(claims);
    const userRole = getUserRole(claims);
    const startupId = event.pathParameters?.startupId;

    if (!startupId) {
      return errors.badRequest('Startup ID is required');
    }

    logger.info('Deleting startup', { userId, startupId });

    // Get startup
    const startup = await getItem<StartupItem>(`STARTUP#${startupId}`, 'METADATA');
    if (!startup) {
      return errors.notFound('Startup');
    }

    // Check ownership
    if (startup.founderId !== userId && userRole !== 'ADMIN') {
      return errors.forbidden('Only the founder can delete this startup');
    }

    // Soft delete - update status to suspended
    await updateItem(`STARTUP#${startupId}`, 'METADATA', {
      status: 'SUSPENDED',
      GSI2PK: `VISIBILITY#${startup.visibility}#STATUS#SUSPENDED`,
    });

    logger.info('Startup deleted (soft)', { startupId });

    return success({
      message: 'Startup deleted successfully',
    });

  } catch (err) {
    logger.error('Failed to delete startup', err as Error);
    return errors.internal('Failed to delete startup');
  }
}
