import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { putItem, getItem } from '../../lib/dynamodb/client.js';
import { success, errors, getUserId, getUserRole, parseBody, generateId, now, logger } from '../../lib/utils/response.js';
import { createRoleSchema, validate, formatValidationErrors } from '../../schemas/index.js';
import type { StartupItem, StartupRoleItem } from '../../types/index.js';

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
    const validation = validate(createRoleSchema, body);
    if (!validation.success) {
      return errors.badRequest('Validation failed', { errors: formatValidationErrors(validation.errors) });
    }

    logger.info('Creating role', { userId, startupId });

    // Get startup
    const startup = await getItem<StartupItem>(`STARTUP#${startupId}`, 'METADATA');
    if (!startup) {
      return errors.notFound('Startup');
    }

    // Check ownership
    if (startup.founderId !== userId && userRole !== 'ADMIN') {
      return errors.forbidden('Only the founder can create roles');
    }

    const data = validation.data;
    const roleId = generateId();
    const timestamp = now();

    const roleItem: StartupRoleItem = {
      PK: `STARTUP#${startupId}`,
      SK: `ROLE#${roleId}`,
      roleId,
      startupId,
      title: data.title,
      description: data.description,
      type: data.type,
      compensation: data.compensation,
      equityRange: data.equityRange,
      skills: data.skills,
      isOpen: data.isOpen,
      applicantCount: 0,
      entityType: 'STARTUP_ROLE',
      createdAt: timestamp,
      updatedAt: timestamp,
      GSI1PK: data.isOpen ? 'OPEN_ROLES' : undefined,
      GSI1SK: data.isOpen ? `${timestamp}#${roleId}` : undefined,
    };

    await putItem(roleItem);

    logger.info('Role created', { startupId, roleId });

    return success({
      roleId,
      title: data.title,
      startupId,
      message: 'Role created successfully',
    }, 201);

  } catch (err) {
    logger.error('Failed to create role', err as Error);
    return errors.internal('Failed to create role');
  }
}
