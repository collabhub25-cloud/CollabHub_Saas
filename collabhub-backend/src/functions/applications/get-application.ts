import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getItem, batchGetItems } from '../../lib/dynamodb/client.js';
import { success, errors, getUserId, getUserRole, logger } from '../../lib/utils/response.js';
import type { ApplicationItem, StartupItem, StartupRoleItem, UserItem } from '../../types/index.js';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const claims = event.requestContext.authorizer?.claims;
    if (!claims) {
      return errors.unauthorized('Missing authorization');
    }

    const userId = getUserId(claims);
    const userRole = getUserRole(claims);
    const applicationId = event.pathParameters?.applicationId;

    if (!applicationId) {
      return errors.badRequest('Application ID is required');
    }

    logger.info('Getting application', { userId, applicationId });

    // Get application
    const application = await getItem<ApplicationItem>(`APPLICATION#${applicationId}`, 'METADATA');
    if (!application) {
      return errors.notFound('Application');
    }

    // Check access permissions
    const isApplicant = application.applicantId === userId;
    const isAdmin = userRole === 'ADMIN';
    
    // Get startup to check if user is founder
    const startup = await getItem<StartupItem>(`STARTUP#${application.startupId}`, 'METADATA');
    const isFounder = startup?.founderId === userId;

    if (!isApplicant && !isFounder && !isAdmin) {
      return errors.forbidden('You do not have access to this application');
    }

    // Get related data
    const [role, applicant] = await Promise.all([
      getItem<StartupRoleItem>(`STARTUP#${application.startupId}`, `ROLE#${application.roleId}`),
      getItem<UserItem>(`USER#${application.applicantId}`, 'PROFILE'),
    ]);

    const response: Record<string, unknown> = {
      applicationId: application.applicationId,
      startupId: application.startupId,
      roleId: application.roleId,
      startupName: startup?.name,
      startupLogo: startup?.logoUrl,
      roleTitle: role?.title,
      roleType: role?.type,
      applicantId: application.applicantId,
      applicantName: applicant ? `${applicant.firstName} ${applicant.lastName}` : 'Unknown',
      applicantEmail: applicant?.email,
      applicantAvatar: applicant?.avatarUrl,
      coverLetter: application.coverLetter,
      resumeUrl: application.resumeUrl,
      status: application.status,
      createdAt: application.createdAt,
      updatedAt: application.updatedAt,
    };

    // Add founder notes only for founder/admin
    if (isFounder || isAdmin) {
      response.founderNotes = application.founderNotes;
      response.applicantBio = applicant?.bio;
      response.applicantSkills = applicant?.skills;
      response.applicantLinkedin = applicant?.linkedinUrl;
    }

    return success(response);

  } catch (err) {
    logger.error('Failed to get application', err as Error);
    return errors.internal('Failed to retrieve application');
  }
}
