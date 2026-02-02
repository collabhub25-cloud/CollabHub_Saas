import type { SQSEvent, SQSHandler } from 'aws-lambda';
// import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { logger } from '../../lib/utils/response.js';

// const sesClient = new SESClient({ region: process.env.REGION });
// const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@collabhub.io';

interface EmailEvent {
  type: string;
  email?: string;
  applicantEmail?: string;
  userId?: string;
  startupName?: string;
  newStatus?: string;
  tier?: string;
  [key: string]: unknown;
}

export const handler: SQSHandler = async (event: SQSEvent) => {
  logger.info('Processing email events', { count: event.Records.length });

  for (const record of event.Records) {
    try {
      const eventDetail: EmailEvent = JSON.parse(record.body);
      const detailType = eventDetail.type || eventDetail['detail-type'] || '';

      // Parse EventBridge event if wrapped
      let detail = eventDetail;
      if (eventDetail.detail) {
        detail = typeof eventDetail.detail === 'string' 
          ? JSON.parse(eventDetail.detail) 
          : eventDetail.detail;
      }

      let emailParams: { to: string; subject: string; body: string } | null = null;

      switch (detailType) {
        case 'USER_REGISTERED':
          if (detail.email) {
            emailParams = {
              to: detail.email as string,
              subject: 'Welcome to CollabHub!',
              body: `Welcome to CollabHub! Your account has been created successfully. Start exploring startups and opportunities today.`,
            };
          }
          break;

        case 'APPLICATION_STATUS_CHANGED':
          if (detail.applicantEmail) {
            emailParams = {
              to: detail.applicantEmail as string,
              subject: `Application Update - ${detail.startupName}`,
              body: `Your application at ${detail.startupName} has been updated to: ${detail.newStatus}`,
            };
          }
          break;

        case 'SUBSCRIPTION_CREATED':
          if (detail.email) {
            emailParams = {
              to: detail.email as string,
              subject: 'Subscription Confirmed',
              body: `Your ${detail.tier} subscription is now active. Thank you for subscribing to CollabHub!`,
            };
          }
          break;

        case 'PAYMENT_FAILED':
          if (detail.email) {
            emailParams = {
              to: detail.email as string,
              subject: 'Payment Failed - Action Required',
              body: `Your payment could not be processed. Please update your payment method to continue your subscription.`,
            };
          }
          break;
      }

      // In production, would send email via SES
      if (emailParams) {
        logger.info('Would send email', { 
          to: emailParams.to, 
          subject: emailParams.subject,
          // Uncomment in production:
          // await sesClient.send(new SendEmailCommand({
          //   Source: FROM_EMAIL,
          //   Destination: { ToAddresses: [emailParams.to] },
          //   Message: {
          //     Subject: { Data: emailParams.subject },
          //     Body: { Text: { Data: emailParams.body } },
          //   },
          // }));
        });
      }

    } catch (err) {
      logger.error('Failed to process email event', err as Error, { record: record.body });
    }
  }
};
