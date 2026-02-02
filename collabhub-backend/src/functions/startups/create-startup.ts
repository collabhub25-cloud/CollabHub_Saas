import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { putItem, getItem } from '../../lib/dynamodb/client.js';
import { success, errors, getUserId, getUserRole, parseBody, generateId, now, logger } from '../../lib/utils/response.js';
import { createStartupSchema, validate, formatValidationErrors } from '../../schemas/index.js';
import type { StartupItem, UserItem } from '../../types/index.js';

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

    // Only founders can create startups
    if (userRole !== 'FOUNDER' && userRole !== 'ADMIN') {
      return errors.forbidden('Only founders can create startups');
    }

    const body = parseBody(event.body);
    if (!body) {
      return errors.badRequest('Request body is required');
    }

    // Validate input
    const validation = validate(createStartupSchema, body);
    if (!validation.success) {
      return errors.badRequest('Validation failed', { errors: formatValidationErrors(validation.errors) });
    }

    const data = validation.data;
    const startupId = generateId();
    const timestamp = now();

    logger.info('Creating startup', { userId, startupId, name: data.name });

    // Verify user exists
    const user = await getItem<UserItem>(`USER#${userId}`, 'PROFILE');
    if (!user) {
      return errors.notFound('User');
    }

    // Create startup
    const startupItem: StartupItem = {
      PK: `STARTUP#${startupId}`,
      SK: 'METADATA',
      startupId,
      founderId: userId,
      name: data.name,
      tagline: data.tagline,
      description: data.description,
      industry: data.industry,
      stage: data.stage,
      fundingGoal: data.fundingGoal,
      visibility: data.visibility,
      status: 'PENDING_REVIEW',
      location: data.location,
      tags: data.tags,
      websiteUrl: data.websiteUrl || undefined,
      teamSize: 1,
      entityType: 'STARTUP',
      createdAt: timestamp,
      updatedAt: timestamp,
      GSI1PK: `FOUNDER#${userId}`,
      GSI1SK: `STARTUP#${startupId}`,
      GSI2PK: `VISIBILITY#${data.visibility}#STATUS#PENDING_REVIEW`,
      GSI2SK: `STARTUP#${startupId}`,
    };

    await putItem(startupItem);

    // Publish event
    await eventBridgeClient.send(new PutEventsCommand({
      Entries: [{
        EventBusName: EVENT_BUS_NAME,
        Source: 'collabhub.startups',
        DetailType: 'STARTUP_CREATED',
        Detail: JSON.stringify({
          startupId,
          founderId: userId,
          name: data.name,
          visibility: data.visibility,
          timestamp,
        }),
      }],
    }));

    logger.info('Startup created successfully', { startupId, founderId: userId });

    return success({
      startupId,
      name: data.name,
      status: 'PENDING_REVIEW',
      message: 'Startup created successfully and pending review',
    }, 201);

  } catch (err) {
    logger.error('Failed to create startup', err as Error);
    return errors.internal('Failed to create startup');
  }
}
