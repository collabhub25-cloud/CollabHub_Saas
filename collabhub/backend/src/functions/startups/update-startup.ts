import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { getItem, updateItem } from '../../lib/dynamodb/client.js';
import { success, errors, getUserId, getUserRole, parseBody, now, logger } from '../../lib/utils/response.js';
import { updateStartupSchema, validate, formatValidationErrors } from '../../schemas/index.js';
import type { StartupItem } from '../../types/index.js';

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
    const startupId = event.pathParameters?.startupId;

    if (!startupId) {
      return errors.badRequest('Startup ID is required');
    }

    const body = parseBody(event.body);
    if (!body) {
      return errors.badRequest('Request body is required');
    }

    // Validate input
    const validation = validate(updateStartupSchema, body);
    if (!validation.success) {
      return errors.badRequest('Validation failed', { errors: formatValidationErrors(validation.errors) });
    }

    logger.info('Updating startup', { userId, startupId });

    // Get startup
    const startup = await getItem<StartupItem>(`STARTUP#${startupId}`, 'METADATA');
    if (!startup) {
      return errors.notFound('Startup');
    }

    // Check ownership
    if (startup.founderId !== userId && userRole !== 'ADMIN') {
      return errors.forbidden('Only the founder can update this startup');
    }

    // Build updates
    const updates: Record<string, unknown> = {};
    const data = validation.data;

    if (data.name !== undefined) updates.name = data.name;
    if (data.tagline !== undefined) updates.tagline = data.tagline;
    if (data.description !== undefined) updates.description = data.description;
    if (data.industry !== undefined) updates.industry = data.industry;
    if (data.stage !== undefined) updates.stage = data.stage;
    if (data.fundingGoal !== undefined) updates.fundingGoal = data.fundingGoal;
    if (data.fundingRaised !== undefined) updates.fundingRaised = data.fundingRaised;
    if (data.websiteUrl !== undefined) updates.websiteUrl = data.websiteUrl;
    if (data.logoUrl !== undefined) updates.logoUrl = data.logoUrl;
    if (data.pitchDeckUrl !== undefined) updates.pitchDeckUrl = data.pitchDeckUrl;
    if (data.location !== undefined) updates.location = data.location;
    if (data.tags !== undefined) updates.tags = data.tags;
    if (data.teamSize !== undefined) updates.teamSize = data.teamSize;

    if (Object.keys(updates).length === 0) {
      return errors.badRequest('No valid fields to update');
    }

    updates.updatedAt = now();

    await updateItem(`STARTUP#${startupId}`, 'METADATA', updates);

    // Publish event
    await eventBridgeClient.send(new PutEventsCommand({
      Entries: [{
        EventBusName: EVENT_BUS_NAME,
        Source: 'collabhub.startups',
        DetailType: 'STARTUP_UPDATED',
        Detail: JSON.stringify({
          startupId,
          founderId: userId,
          updatedFields: Object.keys(updates),
          timestamp: now(),
        }),
      }],
    }));

    logger.info('Startup updated successfully', { startupId });

    return success({
      message: 'Startup updated successfully',
      updatedFields: Object.keys(updates).filter(k => k !== 'updatedAt'),
    });

  } catch (err) {
    logger.error('Failed to update startup', err as Error);
    return errors.internal('Failed to update startup');
  }
}
