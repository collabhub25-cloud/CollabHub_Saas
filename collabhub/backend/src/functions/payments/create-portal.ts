import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import Stripe from 'stripe';
import { getItem } from '../../lib/dynamodb/client.js';
import { success, errors, getUserId, parseBody, logger } from '../../lib/utils/response.js';
import type { UserItem } from '../../types/index.js';

const ssmClient = new SSMClient({ region: process.env.REGION });

async function getStripeClient(): Promise<Stripe> {
  const result = await ssmClient.send(new GetParameterCommand({
    Name: process.env.STRIPE_SECRET_KEY_PARAM,
    WithDecryption: true,
  }));
  return new Stripe(result.Parameter!.Value!, { apiVersion: '2023-10-16' });
}

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const claims = event.requestContext.authorizer?.claims;
    if (!claims) {
      return errors.unauthorized('Missing authorization');
    }

    const userId = getUserId(claims);
    const returnUrl = (parseBody(event.body) as any)?.returnUrl;

    if (!returnUrl) {
      return errors.badRequest('returnUrl is required');
    }

    logger.info('Creating customer portal', { userId });

    // Get user
    const user = await getItem<UserItem>(`USER#${userId}`, 'PROFILE');
    if (!user) {
      return errors.notFound('User');
    }

    if (!user.stripeCustomerId) {
      return errors.badRequest('No subscription found');
    }

    const stripe = await getStripeClient();

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: returnUrl,
    });

    logger.info('Portal session created', { sessionId: session.id });

    return success({
      url: session.url,
    });

  } catch (err) {
    logger.error('Failed to create portal', err as Error);
    return errors.internal('Failed to create customer portal');
  }
}
