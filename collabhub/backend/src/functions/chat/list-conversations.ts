import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { queryGSI, batchGetItems } from '../../lib/dynamodb/client.js';
import { success, errors, getUserId, logger } from '../../lib/utils/response.js';
import type { ConversationItem, UserItem } from '../../types/index.js';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const claims = event.requestContext.authorizer?.claims;
    if (!claims) {
      return errors.unauthorized('Missing authorization');
    }

    const userId = getUserId(claims);
    const limit = Math.min(parseInt(event.queryStringParameters?.limit || '50'), 100);

    logger.info('Listing conversations', { userId });

    // Query conversations by participant
    const result = await queryGSI<ConversationItem>(
      'GSI1',
      'GSI1PK',
      `PARTICIPANT#${userId}`,
      'GSI1SK',
      'CONVERSATION#',
      limit,
      false // newest first
    );

    const conversations = result.items;

    // Get participant details
    const allParticipantIds = [...new Set(conversations.flatMap(c => c.participants))];
    const userKeys = allParticipantIds.map(id => ({ pk: `USER#${id}`, sk: 'PROFILE' }));
    const users = await batchGetItems<UserItem>(userKeys);
    const userMap = new Map(users.map(u => [u.userId, u]));

    const enrichedConversations = conversations.map(c => {
      const participantsInfo = c.participants
        .filter(pid => pid !== userId)
        .map(pid => {
          const user = userMap.get(pid);
          return user ? {
            userId: user.userId,
            name: `${user.firstName} ${user.lastName}`,
            avatar: user.avatarUrl,
          } : null;
        })
        .filter(Boolean);

      return {
        conversationId: c.conversationId,
        type: c.type,
        participants: participantsInfo,
        lastMessageAt: c.lastMessageAt,
        lastMessagePreview: c.lastMessagePreview,
        relatedStartupId: c.relatedStartupId,
        createdAt: c.createdAt,
      };
    });

    return success({ conversations: enrichedConversations });

  } catch (err) {
    logger.error('Failed to list conversations', err as Error);
    return errors.internal('Failed to retrieve conversations');
  }
}
