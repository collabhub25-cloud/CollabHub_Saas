import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getItem } from '../../lib/dynamodb/client.js';
import { success, errors, getUserId, getUserRole, logger } from '../../lib/utils/response.js';
import type { UserItem } from '../../types/index.js';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const claims = event.requestContext.authorizer?.claims;
    if (!claims) {
      return errors.unauthorized('Missing authorization');
    }

    const requestingUserId = getUserId(claims);
    const requestingUserRole = getUserRole(claims);
    const targetUserId = event.pathParameters?.userId;
    
    if (!targetUserId) {
      return errors.badRequest('User ID is required');
    }

    logger.info('Getting user by ID', { requestingUserId, targetUserId });

    const user = await getItem<UserItem>(`USER#${targetUserId}`, 'PROFILE');
    
    if (!user) {
      return errors.notFound('User');
    }

    // Determine what fields to return based on relationship
    const isOwnProfile = requestingUserId === targetUserId;
    const isAdmin = requestingUserRole === 'ADMIN';

    if (isOwnProfile || isAdmin) {
      // Full profile for own profile or admin
      return success({
        userId: user.userId,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        skills: user.skills,
        linkedinUrl: user.linkedinUrl,
        status: user.status,
        subscriptionStatus: isOwnProfile ? user.subscriptionStatus : undefined,
        subscriptionTier: isOwnProfile ? user.subscriptionTier : undefined,
        createdAt: user.createdAt,
      });
    }

    // Limited profile for other users
    return success({
      userId: user.userId,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      skills: user.skills,
      linkedinUrl: user.linkedinUrl,
    });

  } catch (err) {
    logger.error('Failed to get user', err as Error);
    return errors.internal('Failed to retrieve user');
  }
}
