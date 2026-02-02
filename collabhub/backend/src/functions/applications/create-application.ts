import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { putItem, getItem, updateItem } from '../../lib/dynamodb/client.js';
import { success, errors, getUserId, getUserRole, parseBody, generateId, now, logger } from '../../lib/utils/response.js';
import { createApplicationSchema, validate, formatValidationErrors } from '../../schemas/index.js';
import type { StartupItem, StartupRoleItem, ApplicationItem, UserItem } from '../../types/index.js';

const eventBridgeClient = new EventBridgeClient({ region: process.env.REGION });
const EVENT_BUS_NAME = process.env.EVENT_BUS_NAME!;

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const claims = event.requestContext.authorizer?.claims;
    if (!claims) {
      return errors.unauthorized('Missing authorization');
    }

    const userId = getUserId(claims);
    const userRole = getUserRole(claims);

    // Only talents can apply
    if (userRole !== 'TALENT' && userRole !== 'ADMIN') {
      return errors.forbidden('Only talents can submit applications');
    }

    const body = parseBody(event.body);
    if (!body) {
      return errors.badRequest('Request body is required');
    }

    // Validate input
    const validation = validate(createApplicationSchema, body);
    if (!validation.success) {
      return errors.badRequest('Validation failed', { errors: formatValidationErrors(validation.errors) });
    }

    const { startupId, roleId, coverLetter, resumeUrl } = validation.data;

    logger.info('Creating application', { userId, startupId, roleId });

    // Verify startup exists and is active
    const startup = await getItem<StartupItem>(`STARTUP#${startupId}`, 'METADATA');
    if (!startup || startup.status !== 'ACTIVE') {
      return errors.notFound('Startup');
    }

    // Verify role exists and is open
    const role = await getItem<StartupRoleItem>(`STARTUP#${startupId}`, `ROLE#${roleId}`);
    if (!role || !role.isOpen) {
      return errors.notFound('Role not found or not open');
    }

    // Verify user exists
    const user = await getItem<UserItem>(`USER#${userId}`, 'PROFILE');
    if (!user) {
      return errors.notFound('User');
    }

    // Check if user has already applied to this role
    // This would require a query on GSI1 - simplified for now

    const applicationId = generateId();
    const timestamp = now();

    const applicationItem: ApplicationItem = {
      PK: `APPLICATION#${applicationId}`,
      SK: 'METADATA',
      applicationId,
      startupId,
      roleId,
      applicantId: userId,
      coverLetter,
      resumeUrl,
      status: 'PENDING',
      entityType: 'APPLICATION',
      createdAt: timestamp,
      updatedAt: timestamp,
      GSI1PK: `APPLICANT#${userId}`,
      GSI1SK: `APPLICATION#${applicationId}`,
      GSI2PK: `STARTUP#${startupId}#ROLE#${roleId}`,
      GSI2SK: `STATUS#PENDING#${timestamp}`,
    };

    await putItem(applicationItem);

    // Update applicant count on role
    await updateItem(`STARTUP#${startupId}`, `ROLE#${roleId}`, {
      applicantCount: (role.applicantCount || 0) + 1,
    });

    // Publish event
    await eventBridgeClient.send(new PutEventsCommand({
      Entries: [{
        EventBusName: EVENT_BUS_NAME,
        Source: 'collabhub.applications',
        DetailType: 'APPLICATION_SUBMITTED',
        Detail: JSON.stringify({
          applicationId,
          startupId,
          roleId,
          applicantId: userId,
          founderId: startup.founderId,
          roleTitle: role.title,
          startupName: startup.name,
          applicantName: `${user.firstName} ${user.lastName}`,
          timestamp,
        }),
      }],
    }));

    logger.info('Application created', { applicationId, startupId, roleId });

    return success({
      applicationId,
      status: 'PENDING',
      message: 'Application submitted successfully',
    }, 201);

  } catch (err) {
    logger.error('Failed to create application', err as Error);
    return errors.internal('Failed to submit application');
  }
}
