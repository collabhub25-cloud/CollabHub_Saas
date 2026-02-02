import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { queryGSI, batchGetItems } from '../../lib/dynamodb/client.js';
import { paginatedSuccess, errors, getUserId, getUserRole, logger } from '../../lib/utils/response.js';
import type { ApplicationItem, StartupItem, UserItem } from '../../types/index.js';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const claims = event.requestContext.authorizer?.claims;
    if (!claims) {
      return errors.unauthorized('Missing authorization');
    }

    const userId = getUserId(claims);
    const userRole = getUserRole(claims);

    // Only founders and admins can list applications
    if (userRole !== 'FOUNDER' && userRole !== 'ADMIN') {
      return errors.forbidden('Only founders can view applications');
    }

    // Parse query parameters
    const startupId = event.queryStringParameters?.startupId;
    const roleId = event.queryStringParameters?.roleId;
    const status = event.queryStringParameters?.status;
    const page = parseInt(event.queryStringParameters?.page || '1');
    const limit = Math.min(parseInt(event.queryStringParameters?.limit || '20'), 100);

    if (!startupId) {
      return errors.badRequest('startupId is required');
    }

    logger.info('Listing applications', { userId, startupId, roleId });

    // Query applications
    let gsi2pk = `STARTUP#${startupId}`;
    if (roleId) {
      gsi2pk += `#ROLE#${roleId}`;
    }

    const result = await queryGSI<ApplicationItem>(
      'GSI2',
      'GSI2PK',
      gsi2pk,
      status ? 'GSI2SK' : undefined,
      status ? `STATUS#${status.toUpperCase()}` : undefined,
      100,
      false
    );

    let applications = result.items;

    // Get applicant details
    if (applications.length > 0) {
      const userKeys = applications.map(a => ({ pk: `USER#${a.applicantId}`, sk: 'PROFILE' }));
      const users = await batchGetItems<UserItem>(userKeys);
      const userMap = new Map(users.map(u => [u.userId, u]));

      applications = applications.map(a => {
        const applicant = userMap.get(a.applicantId);
        return {
          ...a,
          applicantName: applicant ? `${applicant.firstName} ${applicant.lastName}` : 'Unknown',
          applicantEmail: applicant?.email,
          applicantAvatar: applicant?.avatarUrl,
        } as any;
      });
    }

    // Paginate
    const startIndex = (page - 1) * limit;
    const paginatedApps = applications.slice(startIndex, startIndex + limit);

    // Sanitize response
    const sanitizedApps = paginatedApps.map((a: any) => ({
      applicationId: a.applicationId,
      startupId: a.startupId,
      roleId: a.roleId,
      applicantId: a.applicantId,
      applicantName: a.applicantName,
      applicantEmail: a.applicantEmail,
      applicantAvatar: a.applicantAvatar,
      coverLetter: a.coverLetter?.substring(0, 200) + (a.coverLetter?.length > 200 ? '...' : ''),
      resumeUrl: a.resumeUrl,
      status: a.status,
      createdAt: a.createdAt,
    }));

    return paginatedSuccess(
      { applications: sanitizedApps },
      {
        page,
        limit,
        total: applications.length,
        hasMore: startIndex + limit < applications.length,
      }
    );

  } catch (err) {
    logger.error('Failed to list applications', err as Error);
    return errors.internal('Failed to retrieve applications');
  }
}
