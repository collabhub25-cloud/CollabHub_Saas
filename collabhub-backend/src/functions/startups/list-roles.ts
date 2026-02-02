import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { queryByPK, getItem } from '../../lib/dynamodb/client.js';
import { success, errors, getUserId, logger } from '../../lib/utils/response.js';
import type { StartupItem, StartupRoleItem } from '../../types/index.js';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const claims = event.requestContext.authorizer?.claims;
    if (!claims) {
      return errors.unauthorized('Missing authorization');
    }

    const userId = getUserId(claims);
    const startupId = event.pathParameters?.startupId;

    if (!startupId) {
      return errors.badRequest('Startup ID is required');
    }

    logger.info('Listing roles', { userId, startupId });

    // Verify startup exists and user has access
    const startup = await getItem<StartupItem>(`STARTUP#${startupId}`, 'METADATA');
    if (!startup) {
      return errors.notFound('Startup');
    }

    // Get roles
    const result = await queryByPK<StartupRoleItem>(`STARTUP#${startupId}`, 'ROLE#');

    const roles = result.items.map(r => ({
      roleId: r.roleId,
      startupId: r.startupId,
      title: r.title,
      description: r.description,
      type: r.type,
      compensation: r.compensation,
      equityRange: r.equityRange,
      skills: r.skills,
      isOpen: r.isOpen,
      applicantCount: r.applicantCount,
      createdAt: r.createdAt,
    }));

    return success({ roles });

  } catch (err) {
    logger.error('Failed to list roles', err as Error);
    return errors.internal('Failed to retrieve roles');
  }
}
