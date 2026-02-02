import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';

interface MonitoringStackProps extends cdk.StackProps {
  appName: string;
  environment: string;
  api: apigateway.RestApi;
  table: dynamodb.Table;
  userPool: cognito.UserPool;
}

export class MonitoringStack extends cdk.Stack {
  public readonly dashboard: cloudwatch.Dashboard;

  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id, props);

    const { appName, environment, api, table, userPool } = props;

    // CloudWatch Dashboard
    this.dashboard = new cloudwatch.Dashboard(this, 'Dashboard', {
      dashboardName: `${appName}-Dashboard-${environment}`,
    });

    // API Gateway Metrics
    const apiRequestsWidget = new cloudwatch.GraphWidget({
      title: 'API Gateway Requests',
      left: [
        new cloudwatch.Metric({
          namespace: 'AWS/ApiGateway',
          metricName: 'Count',
          dimensionsMap: {
            ApiName: api.restApiName,
          },
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        }),
      ],
      width: 12,
    });

    const apiLatencyWidget = new cloudwatch.GraphWidget({
      title: 'API Gateway Latency',
      left: [
        new cloudwatch.Metric({
          namespace: 'AWS/ApiGateway',
          metricName: 'Latency',
          dimensionsMap: {
            ApiName: api.restApiName,
          },
          statistic: 'Average',
          period: cdk.Duration.minutes(5),
        }),
        new cloudwatch.Metric({
          namespace: 'AWS/ApiGateway',
          metricName: 'Latency',
          dimensionsMap: {
            ApiName: api.restApiName,
          },
          statistic: 'p99',
          period: cdk.Duration.minutes(5),
        }),
      ],
      width: 12,
    });

    const apiErrorsWidget = new cloudwatch.GraphWidget({
      title: 'API Gateway Errors',
      left: [
        new cloudwatch.Metric({
          namespace: 'AWS/ApiGateway',
          metricName: '4XXError',
          dimensionsMap: {
            ApiName: api.restApiName,
          },
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        }),
        new cloudwatch.Metric({
          namespace: 'AWS/ApiGateway',
          metricName: '5XXError',
          dimensionsMap: {
            ApiName: api.restApiName,
          },
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        }),
      ],
      width: 12,
    });

    // DynamoDB Metrics
    const dynamoReadWidget = new cloudwatch.GraphWidget({
      title: 'DynamoDB Read Capacity',
      left: [
        new cloudwatch.Metric({
          namespace: 'AWS/DynamoDB',
          metricName: 'ConsumedReadCapacityUnits',
          dimensionsMap: {
            TableName: table.tableName,
          },
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        }),
      ],
      width: 12,
    });

    const dynamoWriteWidget = new cloudwatch.GraphWidget({
      title: 'DynamoDB Write Capacity',
      left: [
        new cloudwatch.Metric({
          namespace: 'AWS/DynamoDB',
          metricName: 'ConsumedWriteCapacityUnits',
          dimensionsMap: {
            TableName: table.tableName,
          },
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        }),
      ],
      width: 12,
    });

    const dynamoThrottleWidget = new cloudwatch.GraphWidget({
      title: 'DynamoDB Throttled Requests',
      left: [
        new cloudwatch.Metric({
          namespace: 'AWS/DynamoDB',
          metricName: 'ThrottledRequests',
          dimensionsMap: {
            TableName: table.tableName,
          },
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        }),
      ],
      width: 12,
    });

    // Cognito Metrics
    const cognitoSignInsWidget = new cloudwatch.GraphWidget({
      title: 'Cognito Sign-Ins',
      left: [
        new cloudwatch.Metric({
          namespace: 'AWS/Cognito',
          metricName: 'SignInSuccesses',
          dimensionsMap: {
            UserPool: userPool.userPoolId,
          },
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        }),
      ],
      width: 12,
    });

    // Add widgets to dashboard
    this.dashboard.addWidgets(apiRequestsWidget, apiLatencyWidget);
    this.dashboard.addWidgets(apiErrorsWidget, cognitoSignInsWidget);
    this.dashboard.addWidgets(dynamoReadWidget, dynamoWriteWidget);
    this.dashboard.addWidgets(dynamoThrottleWidget);

    // Alarms

    // High API error rate alarm
    const apiErrorAlarm = new cloudwatch.Alarm(this, 'ApiErrorAlarm', {
      alarmName: `${appName}-HighApiErrorRate-${environment}`,
      alarmDescription: 'High 5XX error rate detected',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/ApiGateway',
        metricName: '5XXError',
        dimensionsMap: {
          ApiName: api.restApiName,
        },
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 10,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // High latency alarm
    const latencyAlarm = new cloudwatch.Alarm(this, 'LatencyAlarm', {
      alarmName: `${appName}-HighLatency-${environment}`,
      alarmDescription: 'High API latency detected',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/ApiGateway',
        metricName: 'Latency',
        dimensionsMap: {
          ApiName: api.restApiName,
        },
        statistic: 'p99',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 3000, // 3 seconds
      evaluationPeriods: 3,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // DynamoDB throttle alarm
    const throttleAlarm = new cloudwatch.Alarm(this, 'ThrottleAlarm', {
      alarmName: `${appName}-DynamoDBThrottle-${environment}`,
      alarmDescription: 'DynamoDB throttling detected',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/DynamoDB',
        metricName: 'ThrottledRequests',
        dimensionsMap: {
          TableName: table.tableName,
        },
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 5,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // Outputs
    new cdk.CfnOutput(this, 'DashboardUrl', {
      value: `https://${this.region}.console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${this.dashboard.dashboardName}`,
      exportName: `${appName}-DashboardUrl`,
      description: 'CloudWatch Dashboard URL',
    });
  }
}
