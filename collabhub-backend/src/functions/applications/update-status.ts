import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { getItem, updateItem } from '../../lib/dynamodb/client.js';
import { success, errors, getUserId, getUserRole, parseBody, now, logger } from '../../lib/utils/response.js';
import { updateApplicationStatusSchema, validate, formatValidationErrors } from '../../schemas/index.js';
import type { ApplicationItem, StartupItem, UserItem } from '../../types/index.js';

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
    const applicationId = event.pathParameters?.applicationId;

    if (!applicationId) {
      return errors.badRequest('Application ID is required');
    }

    const body = parseBody(event.body);
    if (!body) {
      return errors.badRequest('Request body is required');
    }

    // Validate input
    const validation = validate(updateApplicationStatusSchema, body);
    if (!validation.success) {
      return errors.badRequest('Validation failed', { errors: formatValidationErrors(validation.errors) });
    }

    logger.info('Updating application status', { userId, applicationId });

    // Get application
    const application = await getItem<ApplicationItem>(`APPLICATION#${applicationId}`, 'METADATA');
    if (!application) {
      return errors.notFound('Application');
    }

    // Get startup to verify ownership
    const startup = await getItem<StartupItem>(`STARTUP#${application.startupId}`, 'METADATA');
    if (!startup) {
      return errors.notFound('Startup');
    }

    // Check ownership
    if (startup.founderId !== userId && userRole !== 'ADMIN') {
      return errors.forbidden('Only the startup founder can update application status');
    }

    const { status, notes } = validation.data;
    const timestamp = now();

    // Update application
    const updates: Record<string, unknown> = {
      status,
      GSI2SK: `STATUS#${status}#${application.createdAt}`,
      updatedAt: timestamp,
    };

    if (notes !== undefined) {
      updates.founderNotes = notes;
    }

    await updateItem(`APPLICATION#${applicationId}`, 'METADATA', updates);

    // Get applicant for notification
    const applicant = await getItem<UserItem>(`USER#${application.applicantId}`, 'PROFILE');

    // Publish event
    await eventBridgeClient.send(new PutEventsCommand({
      Entries: [{
        EventBusName: EVENT_BUS_NAME,
        Source: 'collabhub.applications',
        DetailType: 'APPLICATION_STATUS_CHANGED',
        Detail: JSON.stringify({
          applicationId,
          startupId: application.startupId,
          roleId: application.roleId,
          applicantId: application.applicantId,
          previousStatus: application.status,
          newStatus: status,
          startupName: startup.name,
          applicantEmail: applicant?.email,
          timestamp,
        }),
      }],
    }));

    logger.info('Application status updated', { applicationId, status });

    return success({
      applicationId,
      status,
      message: 'Application status updated successfully',
    });

  } catch (err) {
    logger.error('Failed to update application status', err as Error);
    return errors.internal('Failed to update application status');
  }
}
