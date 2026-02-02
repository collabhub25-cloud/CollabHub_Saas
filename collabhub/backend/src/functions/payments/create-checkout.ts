import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import Stripe from 'stripe';
import { getItem } from '../../lib/dynamodb/client.js';
import { success, errors, getUserId, parseBody, logger } from '../../lib/utils/response.js';
import { createCheckoutSchema, validate, formatValidationErrors } from '../../schemas/index.js';
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

    const body = parseBody(event.body);
    if (!body) {
      return errors.badRequest('Request body is required');
    }

    // Validate input
    const validation = validate(createCheckoutSchema, body);
    if (!validation.success) {
      return errors.badRequest('Validation failed', { errors: formatValidationErrors(validation.errors) });
    }

    const { priceId, successUrl, cancelUrl } = validation.data;

    logger.info('Creating checkout session', { userId, priceId });

    // Get user
    const user = await getItem<UserItem>(`USER#${userId}`, 'PROFILE');
    if (!user) {
      return errors.notFound('User');
    }

    const stripe = await getStripeClient();

    // Get or create Stripe customer
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId,
        },
      });
      customerId = customer.id;
      
      // Would update user with stripe customer ID here
      // await updateItem(`USER#${userId}`, 'PROFILE', { stripeCustomerId: customerId });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId,
      },
    });

    logger.info('Checkout session created', { sessionId: session.id });

    return success({
      sessionId: session.id,
      url: session.url,
    });

  } catch (err) {
    logger.error('Failed to create checkout', err as Error);
    return errors.internal('Failed to create checkout session');
  }
}
