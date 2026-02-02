import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getItem, queryByPK } from '../../lib/dynamodb/client.js';
import { success, errors, getUserId, getUserRole, logger } from '../../lib/utils/response.js';
import type { StartupItem, StartupRoleItem } from '../../types/index.js';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const claims = event.requestContext.authorizer?.claims;
    if (!claims) {
      return errors.unauthorized('Missing authorization');
    }

    const userId = getUserId(claims);
    const userRole = getUserRole(claims);
    const startupId = event.pathParameters?.startupId;

    if (!startupId) {
      return errors.badRequest('Startup ID is required');
    }

    logger.info('Getting startup', { userId, startupId });

    const startup = await getItem<StartupItem>(`STARTUP#${startupId}`, 'METADATA');

    if (!startup) {
      return errors.notFound('Startup');
    }

    // Check visibility permissions
    const isOwner = startup.founderId === userId;
    const isAdmin = userRole === 'ADMIN';
    const isInvestor = userRole === 'INVESTOR';

    if (!isOwner && !isAdmin) {
      // Check visibility rules
      if (startup.visibility === 'PRIVATE') {
        return errors.forbidden('This startup is private');
      }
      if (startup.visibility === 'INVESTORS_ONLY' && !isInvestor) {
        return errors.forbidden('This startup is only visible to investors');
      }
      if (startup.status !== 'ACTIVE') {
        return errors.forbidden('This startup is not available');
      }
    }

    // Get startup roles
    const rolesResult = await queryByPK<StartupRoleItem>(`STARTUP#${startupId}`, 'ROLE#');
    const roles = rolesResult.items.map(r => ({
      roleId: r.roleId,
      title: r.title,
      description: r.description,
      type: r.type,
      compensation: r.compensation,
      equityRange: r.equityRange,
      skills: r.skills,
      isOpen: r.isOpen,
      applicantCount: r.applicantCount,
      createdAt: r.createdAt,
    }));

    // Build response based on ownership
    const response: Record<string, unknown> = {
      startupId: startup.startupId,
      name: startup.name,
      tagline: startup.tagline,
      description: startup.description,
      industry: startup.industry,
      stage: startup.stage,
      location: startup.location,
      logoUrl: startup.logoUrl,
      websiteUrl: startup.websiteUrl,
      teamSize: startup.teamSize,
      fundingRaised: startup.fundingRaised,
      tags: startup.tags,
      visibility: startup.visibility,
      status: startup.status,
      roles,
      createdAt: startup.createdAt,
    };

    // Add founder-only fields
    if (isOwner || isAdmin) {
      response.founderId = startup.founderId;
      response.fundingGoal = startup.fundingGoal;
      response.pitchDeckUrl = startup.pitchDeckUrl;
      response.updatedAt = startup.updatedAt;
    }

    // Add pitch deck URL for investors
    if (isInvestor || isOwner || isAdmin) {
      response.pitchDeckUrl = startup.pitchDeckUrl;
    }

    return success(response);

  } catch (err) {
    logger.error('Failed to get startup', err as Error);
    return errors.internal('Failed to retrieve startup');
  }
}
