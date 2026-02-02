import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

interface StorageStackProps extends cdk.StackProps {
  appName: string;
  environment: string;
}

export class StorageStack extends cdk.Stack {
  public readonly assetsBucket: s3.Bucket;
  public readonly distribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props: StorageStackProps) {
    super(scope, id, props);

    const { appName, environment } = props;

    // Assets S3 Bucket
    this.assetsBucket = new s3.Bucket(this, 'AssetsBucket', {
      bucketName: `${appName.toLowerCase()}-assets-${this.account}-${environment}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      removalPolicy: environment === 'production'
        ? cdk.RemovalPolicy.RETAIN
        : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: environment !== 'production',
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.PUT,
            s3.HttpMethods.POST,
          ],
          allowedOrigins: ['*'], // Will be restricted in production
          allowedHeaders: ['*'],
          maxAge: 3000,
        },
      ],
      lifecycleRules: [
        {
          id: 'DeleteIncompleteMultipartUploads',
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
        },
        {
          id: 'TransitionToIA',
          prefix: 'archives/',
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(90),
            },
          ],
        },
      ],
    });

    // CloudFront Origin Access Identity
    const originAccessIdentity = new cloudfront.OriginAccessIdentity(this, 'OAI', {
      comment: `OAI for ${appName} assets`,
    });

    // Grant CloudFront access to S3
    this.assetsBucket.addToResourcePolicy(new iam.PolicyStatement({
      actions: ['s3:GetObject'],
      resources: [this.assetsBucket.arnForObjects('*')],
      principals: [originAccessIdentity.grantPrincipal],
    }));

    // CloudFront Distribution
    this.distribution = new cloudfront.Distribution(this, 'Distribution', {
      comment: `${appName} Assets CDN`,
      defaultBehavior: {
        origin: new origins.S3Origin(this.assetsBucket, {
          originAccessIdentity,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        compress: true,
      },
      additionalBehaviors: {
        '/avatars/*': {
          origin: new origins.S3Origin(this.assetsBucket, {
            originAccessIdentity,
          }),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        },
        '/logos/*': {
          origin: new origins.S3Origin(this.assetsBucket, {
            originAccessIdentity,
          }),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        },
        '/pitch-decks/*': {
          origin: new origins.S3Origin(this.assetsBucket, {
            originAccessIdentity,
          }),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: new cloudfront.CachePolicy(this, 'PitchDeckCachePolicy', {
            defaultTtl: cdk.Duration.hours(1),
            maxTtl: cdk.Duration.days(1),
            minTtl: cdk.Duration.minutes(0),
          }),
        },
      },
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
      enabled: true,
      httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
    });

    // Outputs
    new cdk.CfnOutput(this, 'AssetsBucketName', {
      value: this.assetsBucket.bucketName,
      exportName: `${appName}-AssetsBucketName`,
      description: 'S3 Assets Bucket Name',
    });

    new cdk.CfnOutput(this, 'AssetsBucketArn', {
      value: this.assetsBucket.bucketArn,
      exportName: `${appName}-AssetsBucketArn`,
      description: 'S3 Assets Bucket ARN',
    });

    new cdk.CfnOutput(this, 'DistributionId', {
      value: this.distribution.distributionId,
      exportName: `${appName}-DistributionId`,
      description: 'CloudFront Distribution ID',
    });

    new cdk.CfnOutput(this, 'DistributionDomainName', {
      value: this.distribution.distributionDomainName,
      exportName: `${appName}-CDNDomain`,
      description: 'CloudFront Distribution Domain',
    });
  }
}
