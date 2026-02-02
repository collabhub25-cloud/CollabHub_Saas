import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { queryGSI, batchGetItems } from '../../lib/dynamodb/client.js';
import { success, errors, getUserId, getUserRole, logger } from '../../lib/utils/response.js';
import type { ApplicationItem, StartupItem, StartupRoleItem } from '../../types/index.js';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const claims = event.requestContext.authorizer?.claims;
    if (!claims) {
      return errors.unauthorized('Missing authorization');
    }

    const userId = getUserId(claims);
    const userRole = getUserRole(claims);

    // Only talents can view their own applications
    if (userRole !== 'TALENT' && userRole !== 'ADMIN') {
      return errors.forbidden('Only talents can access this resource');
    }

    logger.info('Listing my applications', { userId });

    // Query applications by applicant
    const result = await queryGSI<ApplicationItem>(
      'GSI1',
      'GSI1PK',
      `APPLICANT#${userId}`,
      'GSI1SK',
      'APPLICATION#',
      100,
      false
    );

    const applications = result.items;

    // Get startup and role details
    if (applications.length > 0) {
      const startupKeys = [...new Set(applications.map(a => a.startupId))].map(id => ({
        pk: `STARTUP#${id}`,
        sk: 'METADATA',
      }));
      
      const startups = await batchGetItems<StartupItem>(startupKeys);
      const startupMap = new Map(startups.map(s => [s.startupId, s]));

      // Get role details
      const roleKeys = applications.map(a => ({
        pk: `STARTUP#${a.startupId}`,
        sk: `ROLE#${a.roleId}`,
      }));
      const roles = await batchGetItems<StartupRoleItem>(roleKeys);
      const roleMap = new Map(roles.map(r => [`${r.startupId}#${r.roleId}`, r]));

      const enrichedApps = applications.map(a => {
        const startup = startupMap.get(a.startupId);
        const role = roleMap.get(`${a.startupId}#${a.roleId}`);
        
        return {
          applicationId: a.applicationId,
          startupId: a.startupId,
          roleId: a.roleId,
          startupName: startup?.name || 'Unknown',
          startupLogo: startup?.logoUrl,
          roleTitle: role?.title || 'Unknown',
          coverLetter: a.coverLetter,
          resumeUrl: a.resumeUrl,
          status: a.status,
          createdAt: a.createdAt,
          updatedAt: a.updatedAt,
        };
      });

      return success({ applications: enrichedApps });
    }

    return success({ applications: [] });

  } catch (err) {
    logger.error('Failed to list my applications', err as Error);
    return errors.internal('Failed to retrieve applications');
  }
}
