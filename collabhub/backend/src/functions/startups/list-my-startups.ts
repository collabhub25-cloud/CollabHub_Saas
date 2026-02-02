import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { queryGSI } from '../../lib/dynamodb/client.js';
import { success, errors, getUserId, getUserRole, logger } from '../../lib/utils/response.js';
import type { StartupItem } from '../../types/index.js';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const claims = event.requestContext.authorizer?.claims;
    if (!claims) {
      return errors.unauthorized('Missing authorization');
    }

    const userId = getUserId(claims);
    const userRole = getUserRole(claims);

    // Only founders can list their own startups
    if (userRole !== 'FOUNDER' && userRole !== 'ADMIN') {
      return errors.forbidden('Only founders can access this resource');
    }

    logger.info('Listing founder startups', { userId });

    // Query startups by founder
    const result = await queryGSI<StartupItem>(
      'GSI1',
      'GSI1PK',
      `FOUNDER#${userId}`,
      'GSI1SK',
      'STARTUP#',
      100,
      false // newest first
    );

    const startups = result.items.map(s => ({
      startupId: s.startupId,
      name: s.name,
      tagline: s.tagline,
      description: s.description,
      industry: s.industry,
      stage: s.stage,
      location: s.location,
      logoUrl: s.logoUrl,
      websiteUrl: s.websiteUrl,
      pitchDeckUrl: s.pitchDeckUrl,
      teamSize: s.teamSize,
      fundingGoal: s.fundingGoal,
      fundingRaised: s.fundingRaised,
      tags: s.tags,
      visibility: s.visibility,
      status: s.status,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }));

    return success({ startups });

  } catch (err) {
    logger.error('Failed to list my startups', err as Error);
    return errors.internal('Failed to retrieve startups');
  }
}
