import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getItem } from '../../lib/dynamodb/client.js';
import { success, errors, getUserId, logger } from '../../lib/utils/response.js';
import type { UserItem, SubscriptionItem } from '../../types/index.js';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const claims = event.requestContext.authorizer?.claims;
    if (!claims) {
      return errors.unauthorized('Missing authorization');
    }

    const userId = getUserId(claims);

    logger.info('Getting subscription', { userId });

    // Get user
    const user = await getItem<UserItem>(`USER#${userId}`, 'PROFILE');
    if (!user) {
      return errors.notFound('User');
    }

    // Get subscription
    const subscription = await getItem<SubscriptionItem>(`USER#${userId}`, 'SUBSCRIPTION');

    if (!subscription) {
      return success({
        hasSubscription: false,
        tier: 'FREE',
        status: 'NONE',
      });
    }

    return success({
      hasSubscription: true,
      tier: subscription.tier,
      status: subscription.status,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    });

  } catch (err) {
    logger.error('Failed to get subscription', err as Error);
    return errors.internal('Failed to retrieve subscription');
  }
}
