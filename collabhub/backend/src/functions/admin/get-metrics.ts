import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { queryGSI } from '../../lib/dynamodb/client.js';
import { success, errors, isAdmin, logger } from '../../lib/utils/response.js';
import type { UserItem, StartupItem, ApplicationItem, SubscriptionItem } from '../../types/index.js';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const claims = event.requestContext.authorizer?.claims;
    if (!claims || !isAdmin(claims)) {
      return errors.forbidden('Admin access required');
    }

    logger.info('Getting platform metrics');

    // Get user counts by role
    const [founders, talents, investors, admins] = await Promise.all([
      queryGSI<UserItem>('GSI1', 'GSI1PK', 'ROLE#FOUNDER', undefined, undefined, 1000),
      queryGSI<UserItem>('GSI1', 'GSI1PK', 'ROLE#TALENT', undefined, undefined, 1000),
      queryGSI<UserItem>('GSI1', 'GSI1PK', 'ROLE#INVESTOR', undefined, undefined, 1000),
      queryGSI<UserItem>('GSI1', 'GSI1PK', 'ROLE#ADMIN', undefined, undefined, 100),
    ]);

    // Get active users (not banned)
    const activeUsers = await queryGSI<UserItem>('GSI2', 'GSI2PK', 'STATUS#ACTIVE', undefined, undefined, 2000);

    // Get startups by status
    const [activeStartups, pendingStartups] = await Promise.all([
      queryGSI<StartupItem>('GSI2', 'GSI2PK', 'VISIBILITY#PUBLIC#STATUS#ACTIVE', undefined, undefined, 1000),
      queryGSI<StartupItem>('GSI2', 'GSI2PK', 'VISIBILITY#PUBLIC#STATUS#PENDING_REVIEW', undefined, undefined, 1000),
    ]);

    // Get all startups
    const allStartups = await queryGSI<StartupItem>('GSI3', 'entityType', 'STARTUP', undefined, undefined, 2000);

    // Get applications
    const allApplications = await queryGSI<ApplicationItem>('GSI3', 'entityType', 'APPLICATION', undefined, undefined, 5000);

    // Get subscriptions
    const [proSubs, enterpriseSubs] = await Promise.all([
      queryGSI<SubscriptionItem>('GSI2', 'GSI2PK', 'SUBSCRIPTION_STATUS#ACTIVE', undefined, undefined, 1000),
      // Would need additional query for enterprise specifically
    ]);

    // Calculate new users this month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const newUsersThisMonth = activeUsers.items.filter(u => u.createdAt >= startOfMonth).length;

    // Calculate applications this month
    const applicationsThisMonth = allApplications.items.filter(a => a.createdAt >= startOfMonth).length;

    // Estimate MRR (simplified)
    const proCount = proSubs.items.filter((s: any) => s.tier === 'PRO').length;
    const enterpriseCount = proSubs.items.filter((s: any) => s.tier === 'ENTERPRISE').length;
    const estimatedMRR = (proCount * 29) + (enterpriseCount * 99);

    const metrics = {
      users: {
        total: founders.items.length + talents.items.length + investors.items.length + admins.items.length,
        active: activeUsers.items.length,
        byRole: {
          FOUNDER: founders.items.length,
          TALENT: talents.items.length,
          INVESTOR: investors.items.length,
          ADMIN: admins.items.length,
        },
        newThisMonth: newUsersThisMonth,
      },
      startups: {
        total: allStartups.items.length,
        active: activeStartups.items.length,
        pendingReview: pendingStartups.items.length,
      },
      applications: {
        total: allApplications.items.length,
        thisMonth: applicationsThisMonth,
      },
      revenue: {
        mrr: estimatedMRR,
        subscriptions: {
          PRO: proCount,
          ENTERPRISE: enterpriseCount,
        },
      },
    };

    return success(metrics);

  } catch (err) {
    logger.error('Failed to get metrics', err as Error);
    return errors.internal('Failed to retrieve metrics');
  }
}
