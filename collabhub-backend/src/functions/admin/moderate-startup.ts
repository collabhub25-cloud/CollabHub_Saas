import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getItem, updateItem } from '../../lib/dynamodb/client.js';
import { success, errors, isAdmin, parseBody, now, logger } from '../../lib/utils/response.js';
import { moderateStartupSchema, validate, formatValidationErrors } from '../../schemas/index.js';
import type { StartupItem } from '../../types/index.js';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const claims = event.requestContext.authorizer?.claims;
    if (!claims || !isAdmin(claims)) {
      return errors.forbidden('Admin access required');
    }

    const startupId = event.pathParameters?.startupId;
    if (!startupId) {
      return errors.badRequest('Startup ID is required');
    }

    const body = parseBody(event.body);
    if (!body) {
      return errors.badRequest('Request body is required');
    }

    // Validate input
    const validation = validate(moderateStartupSchema, body);
    if (!validation.success) {
      return errors.badRequest('Validation failed', { errors: formatValidationErrors(validation.errors) });
    }

    const { status, notes } = validation.data;

    logger.info('Moderating startup', { startupId, status });

    // Get startup
    const startup = await getItem<StartupItem>(`STARTUP#${startupId}`, 'METADATA');
    if (!startup) {
      return errors.notFound('Startup');
    }

    // Update startup
    const updates: Record<string, unknown> = {
      status,
      GSI2PK: `VISIBILITY#${startup.visibility}#STATUS#${status}`,
      updatedAt: now(),
    };

    if (notes) {
      updates.moderationNotes = notes;
      updates.moderatedAt = now();
    }

    await updateItem(`STARTUP#${startupId}`, 'METADATA', updates);

    logger.info('Startup moderated', { startupId, status });

    return success({
      message: 'Startup status updated',
      startupId,
      status,
    });

  } catch (err) {
    logger.error('Failed to moderate startup', err as Error);
    return errors.internal('Failed to moderate startup');
  }
}
