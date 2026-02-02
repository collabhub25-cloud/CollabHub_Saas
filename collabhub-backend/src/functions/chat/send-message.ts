import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { putItem, getItem, updateItem } from '../../lib/dynamodb/client.js';
import { success, errors, getUserId, parseBody, generateId, now, logger } from '../../lib/utils/response.js';
import { sendMessageSchema, validate, formatValidationErrors } from '../../schemas/index.js';
import type { ConversationItem, MessageItem, UserItem } from '../../types/index.js';

const eventBridgeClient = new EventBridgeClient({ region: process.env.REGION });
const EVENT_BUS_NAME = process.env.EVENT_BUS_NAME!;

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

    const body = parseBody(event.body);
    if (!body) {
      return errors.badRequest('Request body is required');
    }

    // Validate input
    const validation = validate(sendMessageSchema, body);
    if (!validation.success) {
      return errors.badRequest('Validation failed', { errors: formatValidationErrors(validation.errors) });
    }

    logger.info('Sending message', { userId, conversationId });

    // Get conversation
    const conversation = await getItem<ConversationItem>(`CONVERSATION#${conversationId}`, 'METADATA');
    if (!conversation) {
      return errors.notFound('Conversation');
    }

    // Check if user is participant
    if (!conversation.participants.includes(userId)) {
      return errors.forbidden('You are not a participant in this conversation');
    }

    const { content, type, fileUrl } = validation.data;
    const messageId = generateId();
    const timestamp = now();

    const messageItem: MessageItem = {
      PK: `CONVERSATION#${conversationId}`,
      SK: `MESSAGE#${messageId}`,
      messageId,
      conversationId,
      senderId: userId,
      content,
      type,
      fileUrl,
      readBy: [userId],
      entityType: 'MESSAGE',
      createdAt: timestamp,
    };

    await putItem(messageItem);

    // Update conversation with last message
    const preview = content.length > 50 ? content.substring(0, 50) + '...' : content;
    await updateItem(`CONVERSATION#${conversationId}`, 'METADATA', {
      lastMessageAt: timestamp,
      lastMessagePreview: preview,
      updatedAt: timestamp,
    });

    // Get sender info
    const sender = await getItem<UserItem>(`USER#${userId}`, 'PROFILE');

    // Publish event for notifications
    await eventBridgeClient.send(new PutEventsCommand({
      Entries: [{
        EventBusName: EVENT_BUS_NAME,
        Source: 'collabhub.chat',
        DetailType: 'MESSAGE_SENT',
        Detail: JSON.stringify({
          messageId,
          conversationId,
          senderId: userId,
          senderName: sender ? `${sender.firstName} ${sender.lastName}` : 'Unknown',
          recipients: conversation.participants.filter(p => p !== userId),
          preview,
          timestamp,
        }),
      }],
    }));

    logger.info('Message sent', { messageId, conversationId });

    return success({
      messageId,
      content,
      type,
      createdAt: timestamp,
    }, 201);

  } catch (err) {
    logger.error('Failed to send message', err as Error);
    return errors.internal('Failed to send message');
  }
}
