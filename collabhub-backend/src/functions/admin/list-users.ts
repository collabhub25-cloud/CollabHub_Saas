import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { queryGSI } from '../../lib/dynamodb/client.js';
import { paginatedSuccess, errors, getUserRole, isAdmin, logger } from '../../lib/utils/response.js';
import type { UserItem } from '../../types/index.js';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const claims = event.requestContext.authorizer?.claims;
    if (!claims || !isAdmin(claims)) {
      return errors.forbidden('Admin access required');
    }

    // Parse query parameters
    const page = parseInt(event.queryStringParameters?.page || '1');
    const limit = Math.min(parseInt(event.queryStringParameters?.limit || '20'), 100);
    const role = event.queryStringParameters?.role?.toUpperCase();
    const status = event.queryStringParameters?.status?.toUpperCase();
    const search = event.queryStringParameters?.search?.toLowerCase();

    logger.info('Admin listing users', { page, limit, role, status });

    let users: UserItem[] = [];

    if (role) {
      // Query by role
      const result = await queryGSI<UserItem>(
        'GSI1',
        'GSI1PK',
        `ROLE#${role}`,
        undefined,
        undefined,
        200
      );
      users = result.items;
    } else if (status) {
      // Query by status
      const result = await queryGSI<UserItem>(
        'GSI2',
        'GSI2PK',
        `STATUS#${status}`,
        undefined,
        undefined,
        200
      );
      users = result.items;
    } else {
      // Query all users
      const result = await queryGSI<UserItem>(
        'GSI3',
        'entityType',
        'USER',
        'createdAt',
        undefined,
        200,
        false
      );
      users = result.items;
    }

    // Filter by search if provided
    if (search) {
      users = users.filter(u => 
        u.email.toLowerCase().includes(search) ||
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(search)
      );
    }

    // Paginate
    const startIndex = (page - 1) * limit;
    const paginatedUsers = users.slice(startIndex, startIndex + limit);

    const sanitizedUsers = paginatedUsers.map(u => ({
      userId: u.userId,
      email: u.email,
      role: u.role,
      firstName: u.firstName,
      lastName: u.lastName,
      avatarUrl: u.avatarUrl,
      status: u.status,
      subscriptionTier: u.subscriptionTier,
      createdAt: u.createdAt,
    }));

    return paginatedSuccess(
      { users: sanitizedUsers },
      {
        page,
        limit,
        total: users.length,
        hasMore: startIndex + limit < users.length,
      }
    );

  } catch (err) {
    logger.error('Failed to list users', err as Error);
    return errors.internal('Failed to retrieve users');
  }
}
