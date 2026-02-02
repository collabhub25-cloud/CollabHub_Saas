import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getItem } from '../../lib/dynamodb/client.js';
import { success, errors, getUserId, logger } from '../../lib/utils/response.js';
import type { UserItem } from '../../types/index.js';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const claims = event.requestContext.authorizer?.claims;
    if (!claims) {
      return errors.unauthorized('Missing authorization');
    }

    const userId = getUserId(claims);
    
    logger.info('Getting user profile', { userId });

    const user = await getItem<UserItem>(`USER#${userId}`, 'PROFILE');
    
    if (!user) {
      return errors.notFound('User profile');
    }

    // Return sanitized profile (exclude internal fields)
    const profile = {
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
      subscriptionStatus: user.subscriptionStatus,
      subscriptionTier: user.subscriptionTier,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return success(profile);

  } catch (err) {
    logger.error('Failed to get profile', err as Error);
    return errors.internal('Failed to retrieve profile');
  }
}
