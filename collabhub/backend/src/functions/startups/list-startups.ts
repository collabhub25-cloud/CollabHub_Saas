import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { queryGSI } from '../../lib/dynamodb/client.js';
import { paginatedSuccess, errors, getUserId, getUserRole, logger } from '../../lib/utils/response.js';
import type { StartupItem } from '../../types/index.js';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const claims = event.requestContext.authorizer?.claims;
    if (!claims) {
      return errors.unauthorized('Missing authorization');
    }

    const userId = getUserId(claims);
    const userRole = getUserRole(claims);
    
    // Parse query parameters
    const page = parseInt(event.queryStringParameters?.page || '1');
    const limit = Math.min(parseInt(event.queryStringParameters?.limit || '20'), 100);
    const industry = event.queryStringParameters?.industry;
    const stage = event.queryStringParameters?.stage;

    logger.info('Listing startups', { userId, userRole, page, limit });

    let startups: StartupItem[] = [];
    let total = 0;

    // Query based on user role and visibility
    if (userRole === 'ADMIN') {
      // Admins see all startups
      const result = await queryGSI<StartupItem>(
        'GSI3',
        'entityType',
        'STARTUP',
        'createdAt',
        undefined,
        limit,
        false // newest first
      );
      startups = result.items;
      total = startups.length;
    } else if (userRole === 'INVESTOR') {
      // Investors see PUBLIC and INVESTORS_ONLY startups
      const publicResult = await queryGSI<StartupItem>(
        'GSI2',
        'GSI2PK',
        'VISIBILITY#PUBLIC#STATUS#ACTIVE',
        undefined,
        undefined,
        limit
      );
      
      const investorOnlyResult = await queryGSI<StartupItem>(
        'GSI2',
        'GSI2PK',
        'VISIBILITY#INVESTORS_ONLY#STATUS#ACTIVE',
        undefined,
        undefined,
        limit
      );
      
      startups = [...publicResult.items, ...investorOnlyResult.items];
      total = startups.length;
    } else {
      // Talents and Founders see PUBLIC startups
      const result = await queryGSI<StartupItem>(
        'GSI2',
        'GSI2PK',
        'VISIBILITY#PUBLIC#STATUS#ACTIVE',
        undefined,
        undefined,
        limit
      );
      startups = result.items;
      total = startups.length;
    }

    // Apply filters
    if (industry) {
      startups = startups.filter(s => s.industry.toLowerCase() === industry.toLowerCase());
    }
    if (stage) {
      startups = startups.filter(s => s.stage === stage.toUpperCase());
    }

    // Paginate
    const startIndex = (page - 1) * limit;
    const paginatedStartups = startups.slice(startIndex, startIndex + limit);

    // Sanitize response
    const sanitizedStartups = paginatedStartups.map(s => ({
      startupId: s.startupId,
      name: s.name,
      tagline: s.tagline,
      description: s.description.substring(0, 200) + (s.description.length > 200 ? '...' : ''),
      industry: s.industry,
      stage: s.stage,
      location: s.location,
      logoUrl: s.logoUrl,
      websiteUrl: s.websiteUrl,
      teamSize: s.teamSize,
      fundingRaised: s.fundingRaised,
      tags: s.tags,
      visibility: s.visibility,
      status: s.status,
      createdAt: s.createdAt,
    }));

    return paginatedSuccess(
      { startups: sanitizedStartups },
      {
        page,
        limit,
        total: startups.length,
        hasMore: startIndex + limit < startups.length,
      }
    );

  } catch (err) {
    logger.error('Failed to list startups', err as Error);
    return errors.internal('Failed to retrieve startups');
  }
}
