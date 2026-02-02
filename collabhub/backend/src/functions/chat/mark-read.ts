import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { queryByPK, getItem, updateItem } from '../../lib/dynamodb/client.js';
import { success, errors, getUserId, now, logger } from '../../lib/utils/response.js';
import type { ConversationItem, MessageItem } from '../../types/index.js';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const claims = event.requestContext.authorizer?.claims;
    if (!claims) {
      return errors.unauthorized('Missing authorization');
    }

    const userId = getUserId(claims);
    const conversationId = event.pathParameters?.conversationId;

    if (!conversationId) {
      return errors.badRequest('Conversation ID is required');
    }

    logger.info('Marking conversation as read', { userId, conversationId });

    // Get conversation
    const conversation = await getItem<ConversationItem>(`CONVERSATION#${conversationId}`, 'METADATA');
    if (!conversation) {
      return errors.notFound('Conversation');
    }

    // Check if user is participant
    if (!conversation.participants.includes(userId)) {
      return errors.forbidden('You are not a participant in this conversation');
    }

    // Get unread messages and update them
    const result = await queryByPK<MessageItem>(
      `CONVERSATION#${conversationId}`,
      'MESSAGE#',
      100
    );

    const unreadMessages = result.items.filter(m => !m.readBy.includes(userId));

    // Update each unread message
    for (const message of unreadMessages) {
      const newReadBy = [...message.readBy, userId];
      await updateItem(
        `CONVERSATION#${conversationId}`,
        `MESSAGE#${message.messageId}`,
        { readBy: newReadBy }
      );
    }

    logger.info('Marked messages as read', { conversationId, count: unreadMessages.length });

    return success({
      message: 'Conversation marked as read',
      messagesRead: unreadMessages.length,
    });

  } catch (err) {
    logger.error('Failed to mark as read', err as Error);
    return errors.internal('Failed to mark conversation as read');
  }
}
