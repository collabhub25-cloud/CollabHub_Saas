import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import Stripe from 'stripe';
import { putItem, updateItem, queryGSI } from '../../lib/dynamodb/client.js';
import { success, errors, now, logger } from '../../lib/utils/response.js';
import type { SubscriptionItem, UserItem } from '../../types/index.js';

const ssmClient = new SSMClient({ region: process.env.REGION });
const eventBridgeClient = new EventBridgeClient({ region: process.env.REGION });
const EVENT_BUS_NAME = process.env.EVENT_BUS_NAME!;

async function getStripeSecrets(): Promise<{ secretKey: string; webhookSecret: string }> {
  const [secretKeyResult, webhookSecretResult] = await Promise.all([
    ssmClient.send(new GetParameterCommand({
      Name: process.env.STRIPE_SECRET_KEY_PARAM,
      WithDecryption: true,
    })),
    ssmClient.send(new GetParameterCommand({
      Name: process.env.STRIPE_WEBHOOK_SECRET_PARAM,
      WithDecryption: true,
    })),
  ]);
  
  return {
    secretKey: secretKeyResult.Parameter!.Value!,
    webhookSecret: webhookSecretResult.Parameter!.Value!,
  };
}

function getTierFromPriceId(priceId: string): 'FREE' | 'PRO' | 'ENTERPRISE' {
  // Map price IDs to tiers - would be configured based on actual Stripe products
  if (priceId.includes('pro')) return 'PRO';
  if (priceId.includes('enterprise')) return 'ENTERPRISE';
  return 'FREE';
}

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const sig = event.headers['stripe-signature'] || event.headers['Stripe-Signature'];
    if (!sig) {
      return errors.badRequest('Missing stripe signature');
    }

    const { secretKey, webhookSecret } = await getStripeSecrets();
    const stripe = new Stripe(secretKey, { apiVersion: '2023-10-16' });

    let stripeEvent: Stripe.Event;
    try {
      stripeEvent = stripe.webhooks.constructEvent(
        event.body!,
        sig,
        webhookSecret
      );
    } catch (err) {
      logger.error('Webhook signature verification failed', err as Error);
      return errors.badRequest('Invalid signature');
    }

    logger.info('Webhook received', { type: stripeEvent.type });

    const timestamp = now();

    switch (stripeEvent.type) {
      case 'checkout.session.completed': {
        const session = stripeEvent.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const customerId = session.customer as string;
        
        if (userId && session.subscription) {
          // Get subscription details
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          const priceId = subscription.items.data[0]?.price.id;
          const tier = getTierFromPriceId(priceId);

          // Create/update subscription record
          const subscriptionItem: SubscriptionItem = {
            PK: `USER#${userId}`,
            SK: 'SUBSCRIPTION',
            userId,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscription.id,
            stripePriceId: priceId,
            tier,
            status: 'ACTIVE',
            currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            entityType: 'SUBSCRIPTION',
            createdAt: timestamp,
            updatedAt: timestamp,
            GSI1PK: `STRIPE_CUSTOMER#${customerId}`,
            GSI1SK: 'SUBSCRIPTION',
            GSI2PK: `SUBSCRIPTION_STATUS#ACTIVE`,
            GSI2SK: `USER#${userId}`,
          };

          await putItem(subscriptionItem);

          // Update user record
          await updateItem(`USER#${userId}`, 'PROFILE', {
            stripeCustomerId: customerId,
            subscriptionStatus: 'ACTIVE',
            subscriptionTier: tier,
          });

          // Publish event
          await eventBridgeClient.send(new PutEventsCommand({
            Entries: [{
              EventBusName: EVENT_BUS_NAME,
              Source: 'collabhub.payments',
              DetailType: 'SUBSCRIPTION_CREATED',
              Detail: JSON.stringify({
                userId,
                tier,
                subscriptionId: subscription.id,
                timestamp,
              }),
            }],
          }));
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = stripeEvent.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Find user by Stripe customer ID
        const userResult = await queryGSI<SubscriptionItem>(
          'GSI1',
          'GSI1PK',
          `STRIPE_CUSTOMER#${customerId}`,
          undefined,
          undefined,
          1
        );

        if (userResult.items.length > 0) {
          const userId = userResult.items[0].userId;
          const priceId = subscription.items.data[0]?.price.id;
          const tier = getTierFromPriceId(priceId);
          const status = subscription.status === 'active' ? 'ACTIVE' : 
                        subscription.status === 'past_due' ? 'PAST_DUE' :
                        subscription.status === 'canceled' ? 'CANCELLED' : 'ACTIVE';

          await updateItem(`USER#${userId}`, 'SUBSCRIPTION', {
            status,
            tier,
            stripePriceId: priceId,
            currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            GSI2PK: `SUBSCRIPTION_STATUS#${status}`,
            updatedAt: timestamp,
          });

          await updateItem(`USER#${userId}`, 'PROFILE', {
            subscriptionStatus: status,
            subscriptionTier: tier,
          });

          await eventBridgeClient.send(new PutEventsCommand({
            Entries: [{
              EventBusName: EVENT_BUS_NAME,
              Source: 'collabhub.payments',
              DetailType: 'SUBSCRIPTION_UPDATED',
              Detail: JSON.stringify({ userId, tier, status, timestamp }),
            }],
          }));
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = stripeEvent.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const userResult = await queryGSI<SubscriptionItem>(
          'GSI1',
          'GSI1PK',
          `STRIPE_CUSTOMER#${customerId}`,
          undefined,
          undefined,
          1
        );

        if (userResult.items.length > 0) {
          const userId = userResult.items[0].userId;

          await updateItem(`USER#${userId}`, 'SUBSCRIPTION', {
            status: 'CANCELLED',
            GSI2PK: 'SUBSCRIPTION_STATUS#CANCELLED',
            updatedAt: timestamp,
          });

          await updateItem(`USER#${userId}`, 'PROFILE', {
            subscriptionStatus: 'CANCELLED',
            subscriptionTier: 'FREE',
          });

          await eventBridgeClient.send(new PutEventsCommand({
            Entries: [{
              EventBusName: EVENT_BUS_NAME,
              Source: 'collabhub.payments',
              DetailType: 'SUBSCRIPTION_CANCELLED',
              Detail: JSON.stringify({ userId, timestamp }),
            }],
          }));
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = stripeEvent.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        const userResult = await queryGSI<SubscriptionItem>(
          'GSI1',
          'GSI1PK',
          `STRIPE_CUSTOMER#${customerId}`,
          undefined,
          undefined,
          1
        );

        if (userResult.items.length > 0) {
          const userId = userResult.items[0].userId;

          await eventBridgeClient.send(new PutEventsCommand({
            Entries: [{
              EventBusName: EVENT_BUS_NAME,
              Source: 'collabhub.payments',
              DetailType: 'PAYMENT_FAILED',
              Detail: JSON.stringify({
                userId,
                invoiceId: invoice.id,
                timestamp,
              }),
            }],
          }));
        }
        break;
      }
    }

    logger.info('Webhook processed successfully', { type: stripeEvent.type });

    return success({ received: true });

  } catch (err) {
    logger.error('Webhook processing failed', err as Error);
    return errors.internal('Webhook processing failed');
  }
}
