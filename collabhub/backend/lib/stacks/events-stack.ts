import * as cdk from 'aws-cdk-lib';
import * as events from 'aws-cdk-lib/aws-events';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import { Construct } from 'constructs';

interface EventsStackProps extends cdk.StackProps {
  appName: string;
  environment: string;
}

export class EventsStack extends cdk.Stack {
  public readonly eventBus: events.EventBus;
  public readonly notificationQueue: sqs.Queue;
  public readonly emailQueue: sqs.Queue;
  public readonly auditQueue: sqs.Queue;

  constructor(scope: Construct, id: string, props: EventsStackProps) {
    super(scope, id, props);

    const { appName, environment } = props;

    // EventBridge Event Bus
    this.eventBus = new events.EventBus(this, 'EventBus', {
      eventBusName: `${appName.toLowerCase()}-events-${environment}`,
    });

    // Dead Letter Queue for failed messages
    const dlq = new sqs.Queue(this, 'DeadLetterQueue', {
      queueName: `${appName.toLowerCase()}-dlq-${environment}`,
      retentionPeriod: cdk.Duration.days(14),
      encryption: sqs.QueueEncryption.SQS_MANAGED,
    });

    // Notification Queue
    this.notificationQueue = new sqs.Queue(this, 'NotificationQueue', {
      queueName: `${appName.toLowerCase()}-notifications-${environment}`,
      visibilityTimeout: cdk.Duration.seconds(60),
      retentionPeriod: cdk.Duration.days(7),
      encryption: sqs.QueueEncryption.SQS_MANAGED,
      deadLetterQueue: {
        queue: dlq,
        maxReceiveCount: 3,
      },
    });

    // Email Queue
    this.emailQueue = new sqs.Queue(this, 'EmailQueue', {
      queueName: `${appName.toLowerCase()}-emails-${environment}`,
      visibilityTimeout: cdk.Duration.seconds(120),
      retentionPeriod: cdk.Duration.days(7),
      encryption: sqs.QueueEncryption.SQS_MANAGED,
      deadLetterQueue: {
        queue: dlq,
        maxReceiveCount: 3,
      },
    });

    // Audit Queue
    this.auditQueue = new sqs.Queue(this, 'AuditQueue', {
      queueName: `${appName.toLowerCase()}-audit-${environment}`,
      visibilityTimeout: cdk.Duration.seconds(30),
      retentionPeriod: cdk.Duration.days(14),
      encryption: sqs.QueueEncryption.SQS_MANAGED,
      deadLetterQueue: {
        queue: dlq,
        maxReceiveCount: 5,
      },
    });

    // EventBridge Rules

    // Application events -> Notification Queue
    new events.Rule(this, 'ApplicationEventsRule', {
      eventBus: this.eventBus,
      ruleName: `${appName}-ApplicationEvents-${environment}`,
      eventPattern: {
        source: [`${appName.toLowerCase()}.applications`],
        detailType: [
          'APPLICATION_SUBMITTED',
          'APPLICATION_STATUS_CHANGED',
          'APPLICATION_WITHDRAWN',
        ],
      },
      targets: [new targets.SqsQueue(this.notificationQueue)],
    });

    // User events -> Notification Queue
    new events.Rule(this, 'UserEventsRule', {
      eventBus: this.eventBus,
      ruleName: `${appName}-UserEvents-${environment}`,
      eventPattern: {
        source: [`${appName.toLowerCase()}.users`],
        detailType: [
          'USER_REGISTERED',
          'USER_VERIFIED',
          'USER_PROFILE_UPDATED',
        ],
      },
      targets: [
        new targets.SqsQueue(this.notificationQueue),
        new targets.SqsQueue(this.emailQueue),
      ],
    });

    // Message events -> Notification Queue
    new events.Rule(this, 'MessageEventsRule', {
      eventBus: this.eventBus,
      ruleName: `${appName}-MessageEvents-${environment}`,
      eventPattern: {
        source: [`${appName.toLowerCase()}.chat`],
        detailType: ['MESSAGE_SENT'],
      },
      targets: [new targets.SqsQueue(this.notificationQueue)],
    });

    // Payment events -> Email Queue
    new events.Rule(this, 'PaymentEventsRule', {
      eventBus: this.eventBus,
      ruleName: `${appName}-PaymentEvents-${environment}`,
      eventPattern: {
        source: [`${appName.toLowerCase()}.payments`],
        detailType: [
          'SUBSCRIPTION_CREATED',
          'SUBSCRIPTION_UPDATED',
          'SUBSCRIPTION_CANCELLED',
          'PAYMENT_SUCCEEDED',
          'PAYMENT_FAILED',
        ],
      },
      targets: [
        new targets.SqsQueue(this.emailQueue),
        new targets.SqsQueue(this.notificationQueue),
      ],
    });

    // All events -> Audit Queue
    new events.Rule(this, 'AllEventsAuditRule', {
      eventBus: this.eventBus,
      ruleName: `${appName}-AllEventsAudit-${environment}`,
      eventPattern: {
        source: [{ prefix: `${appName.toLowerCase()}.` }] as any,
      },
      targets: [new targets.SqsQueue(this.auditQueue)],
    });

    // Outputs
    new cdk.CfnOutput(this, 'EventBusName', {
      value: this.eventBus.eventBusName,
      exportName: `${appName}-EventBusName`,
      description: 'EventBridge Event Bus Name',
    });

    new cdk.CfnOutput(this, 'EventBusArn', {
      value: this.eventBus.eventBusArn,
      exportName: `${appName}-EventBusArn`,
      description: 'EventBridge Event Bus ARN',
    });

    new cdk.CfnOutput(this, 'NotificationQueueUrl', {
      value: this.notificationQueue.queueUrl,
      exportName: `${appName}-NotificationQueueUrl`,
      description: 'Notification SQS Queue URL',
    });

    new cdk.CfnOutput(this, 'EmailQueueUrl', {
      value: this.emailQueue.queueUrl,
      exportName: `${appName}-EmailQueueUrl`,
      description: 'Email SQS Queue URL',
    });

    new cdk.CfnOutput(this, 'AuditQueueUrl', {
      value: this.auditQueue.queueUrl,
      exportName: `${appName}-AuditQueueUrl`,
      description: 'Audit SQS Queue URL',
    });
  }
}
