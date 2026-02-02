import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { getItem, updateItem } from '../../lib/dynamodb/client.js';
import { success, errors, getUserId, getUserRole, now, logger } from '../../lib/utils/response.js';
import type { ApplicationItem, StartupRoleItem } from '../../types/index.js';

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

    logger.info('Withdrawing application', { userId, applicationId });

    // Get application
    const application = await getItem<ApplicationItem>(`APPLICATION#${applicationId}`, 'METADATA');
    if (!application) {
      return errors.notFound('Application');
    }

    // Check ownership
    if (application.applicantId !== userId && userRole !== 'ADMIN') {
      return errors.forbidden('Only the applicant can withdraw this application');
    }

    // Check if already withdrawn or processed
    if (application.status === 'WITHDRAWN') {
      return errors.badRequest('Application already withdrawn');
    }
    if (application.status === 'ACCEPTED' || application.status === 'REJECTED') {
      return errors.badRequest('Cannot withdraw a processed application');
    }

    const timestamp = now();

    // Update application status
    await updateItem(`APPLICATION#${applicationId}`, 'METADATA', {
      status: 'WITHDRAWN',
      GSI2SK: `STATUS#WITHDRAWN#${application.createdAt}`,
      updatedAt: timestamp,
    });

    // Decrement applicant count on role
    const role = await getItem<StartupRoleItem>(`STARTUP#${application.startupId}`, `ROLE#${application.roleId}`);
    if (role && role.applicantCount > 0) {
      await updateItem(`STARTUP#${application.startupId}`, `ROLE#${application.roleId}`, {
        applicantCount: role.applicantCount - 1,
      });
    }

    // Publish event
    await eventBridgeClient.send(new PutEventsCommand({
      Entries: [{
        EventBusName: EVENT_BUS_NAME,
        Source: 'collabhub.applications',
        DetailType: 'APPLICATION_WITHDRAWN',
        Detail: JSON.stringify({
          applicationId,
          startupId: application.startupId,
          roleId: application.roleId,
          applicantId: userId,
          timestamp,
        }),
      }],
    }));

    logger.info('Application withdrawn', { applicationId });

    return success({
      message: 'Application withdrawn successfully',
    });

  } catch (err) {
    logger.error('Failed to withdraw application', err as Error);
    return errors.internal('Failed to withdraw application');
  }
}
