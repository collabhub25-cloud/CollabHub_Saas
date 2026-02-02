import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getItem, updateItem } from '../../lib/dynamodb/client.js';
import { success, errors, getUserId, getUserRole, parseBody, now, logger } from '../../lib/utils/response.js';
import { updateVisibilitySchema, validate, formatValidationErrors } from '../../schemas/index.js';
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

    const body = parseBody(event.body);
    if (!body) {
      return errors.badRequest('Request body is required');
    }

    // Validate input
    const validation = validate(updateVisibilitySchema, body);
    if (!validation.success) {
      return errors.badRequest('Validation failed', { errors: formatValidationErrors(validation.errors) });
    }

    logger.info('Updating startup visibility', { userId, startupId });

    // Get startup
    const startup = await getItem<StartupItem>(`STARTUP#${startupId}`, 'METADATA');
    if (!startup) {
      return errors.notFound('Startup');
    }

    // Check ownership
    if (startup.founderId !== userId && userRole !== 'ADMIN') {
      return errors.forbidden('Only the founder can update visibility');
    }

    const { visibility } = validation.data;

    await updateItem(`STARTUP#${startupId}`, 'METADATA', {
      visibility,
      GSI2PK: `VISIBILITY#${visibility}#STATUS#${startup.status}`,
      updatedAt: now(),
    });

    logger.info('Visibility updated', { startupId, visibility });

    return success({
      message: 'Visibility updated successfully',
      visibility,
    });

  } catch (err) {
    logger.error('Failed to update visibility', err as Error);
    return errors.internal('Failed to update visibility');
  }
}
