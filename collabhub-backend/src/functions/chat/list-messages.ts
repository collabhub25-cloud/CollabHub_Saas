import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { queryByPK, getItem, batchGetItems } from '../../lib/dynamodb/client.js';
import { success, errors, getUserId, logger } from '../../lib/utils/response.js';
import type { ConversationItem, MessageItem, UserItem } from '../../types/index.js';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const claims = event.requestContext.authorizer?.claims;
    if (!claims) {
      return errors.unauthorized('Missing authorization');
    }

    const userId = getUserId(claims);
    const conversationId = event.pathParameters?.conversationId;
    const limit = Math.min(parseInt(event.queryStringParameters?.limit || '50'), 100);
    const before = event.queryStringParameters?.before;

    if (!conversationId) {
      return errors.badRequest('Conversation ID is required');
    }

    logger.info('Listing messages', { userId, conversationId });

    // Get conversation
    const conversation = await getItem<ConversationItem>(`CONVERSATION#${conversationId}`, 'METADATA');
    if (!conversation) {
      return errors.notFound('Conversation');
    }

    // Check if user is participant
    if (!conversation.participants.includes(userId)) {
      return errors.forbidden('You are not a participant in this conversation');
    }

    // Query messages
    const result = await queryByPK<MessageItem>(
      `CONVERSATION#${conversationId}`,
      'MESSAGE#',
      limit
    );

    // Sort messages by createdAt (newest first for pagination, then reverse for display)
    let messages = result.items.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Filter if before cursor is provided
    if (before) {
      const beforeIndex = messages.findIndex(m => m.messageId === before);
      if (beforeIndex !== -1) {
        messages = messages.slice(beforeIndex + 1);
      }
    }

    messages = messages.slice(0, limit);

    // Get sender details
    const senderIds = [...new Set(messages.map(m => m.senderId))];
    const senderKeys = senderIds.map(id => ({ pk: `USER#${id}`, sk: 'PROFILE' }));
    const senders = await batchGetItems<UserItem>(senderKeys);
    const senderMap = new Map(senders.map(s => [s.userId, s]));

    // Reverse for chronological display order
    const enrichedMessages = messages.reverse().map(m => {
      const sender = senderMap.get(m.senderId);
      return {
        messageId: m.messageId,
        content: m.content,
        type: m.type,
        fileUrl: m.fileUrl,
        senderId: m.senderId,
        senderName: sender ? `${sender.firstName} ${sender.lastName}` : 'Unknown',
        senderAvatar: sender?.avatarUrl,
        isOwn: m.senderId === userId,
        readBy: m.readBy,
        createdAt: m.createdAt,
      };
    });

    return success({
      messages: enrichedMessages,
      hasMore: result.lastKey !== undefined,
    });

  } catch (err) {
    logger.error('Failed to list messages', err as Error);
    return errors.internal('Failed to retrieve messages');
  }
}
