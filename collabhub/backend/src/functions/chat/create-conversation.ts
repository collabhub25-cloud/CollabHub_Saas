import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { putItem, getItem, queryGSI } from '../../lib/dynamodb/client.js';
import { success, errors, getUserId, parseBody, generateId, now, logger } from '../../lib/utils/response.js';
import { createConversationSchema, validate, formatValidationErrors } from '../../schemas/index.js';
import type { ConversationItem, UserItem } from '../../types/index.js';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const claims = event.requestContext.authorizer?.claims;
    if (!claims) {
      return errors.unauthorized('Missing authorization');
    }

    const userId = getUserId(claims);

    const body = parseBody(event.body);
    if (!body) {
      return errors.badRequest('Request body is required');
    }

    // Validate input
    const validation = validate(createConversationSchema, body);
    if (!validation.success) {
      return errors.badRequest('Validation failed', { errors: formatValidationErrors(validation.errors) });
    }

    const { participantIds, type, relatedStartupId, relatedApplicationId } = validation.data;

    // Add current user to participants if not included
    const allParticipants = Array.from(new Set([userId, ...participantIds]));

    logger.info('Creating conversation', { userId, participants: allParticipants });

    // For direct conversations, check if one already exists
    if (type === 'DIRECT' && allParticipants.length === 2) {
      const existingConvs = await queryGSI<ConversationItem>(
        'GSI1',
        'GSI1PK',
        `PARTICIPANT#${userId}`,
        'GSI1SK',
        'CONVERSATION#',
        100
      );

      const existing = existingConvs.items.find(c => 
        c.type === 'DIRECT' && 
        c.participants.length === 2 &&
        c.participants.includes(allParticipants[0]) &&
        c.participants.includes(allParticipants[1])
      );

      if (existing) {
        return success({
          conversationId: existing.conversationId,
          isExisting: true,
        });
      }
    }

    // Verify all participants exist
    for (const pid of allParticipants) {
      const user = await getItem<UserItem>(`USER#${pid}`, 'PROFILE');
      if (!user) {
        return errors.badRequest(`User ${pid} not found`);
      }
    }

    const conversationId = generateId();
    const timestamp = now();

    const conversationItem: ConversationItem = {
      PK: `CONVERSATION#${conversationId}`,
      SK: 'METADATA',
      conversationId,
      participants: allParticipants,
      type,
      relatedStartupId,
      relatedApplicationId,
      lastMessageAt: timestamp,
      lastMessagePreview: '',
      entityType: 'CONVERSATION',
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await putItem(conversationItem);

    // Create GSI1 entries for each participant
    for (const pid of allParticipants) {
      await putItem({
        ...conversationItem,
        PK: `PARTICIPANT#${pid}`,
        SK: `CONVERSATION#${timestamp}#${conversationId}`,
        GSI1PK: `PARTICIPANT#${pid}`,
        GSI1SK: `CONVERSATION#${timestamp}#${conversationId}`,
      });
    }

    logger.info('Conversation created', { conversationId });

    return success({
      conversationId,
      participants: allParticipants,
      type,
      isExisting: false,
    }, 201);

  } catch (err) {
    logger.error('Failed to create conversation', err as Error);
    return errors.internal('Failed to create conversation');
  }
}
