import type { APIGatewayProxyResult } from 'aws-lambda';
import { ulid } from 'ulid';
import type { ApiResponse, PaginatedResponse } from '../../types/index.js';

// Generate ULID (time-sortable unique ID)
export function generateId(): string {
  return ulid();
}

// Get current ISO timestamp
export function now(): string {
  return new Date().toISOString();
}

// Success response
export function success<T>(data: T, statusCode: number = 200): APIGatewayProxyResult {
  const response: ApiResponse<T> = {
    success: true,
    data,
    meta: {
      requestId: generateId(),
      timestamp: now(),
    },
  };

  return {
    statusCode,
    headers: corsHeaders(),
    body: JSON.stringify(response),
  };
}

// Paginated success response
export function paginatedSuccess<T>(
  data: T,
  pagination: { page: number; limit: number; total: number; hasMore: boolean },
): APIGatewayProxyResult {
  const response: PaginatedResponse<T> = {
    success: true,
    data,
    pagination,
    meta: {
      requestId: generateId(),
      timestamp: now(),
    },
  };

  return {
    statusCode: 200,
    headers: corsHeaders(),
    body: JSON.stringify(response),
  };
}

// Error response
export function error(
  code: string,
  message: string,
  statusCode: number = 400,
  details?: Record<string, unknown>,
): APIGatewayProxyResult {
  const response: ApiResponse = {
    success: false,
    error: {
      code,
      message,
      details,
    },
    meta: {
      requestId: generateId(),
      timestamp: now(),
    },
  };

  return {
    statusCode,
    headers: corsHeaders(),
    body: JSON.stringify(response),
  };
}

// Common error responses
export const errors = {
  badRequest: (message: string, details?: Record<string, unknown>) =>
    error('BAD_REQUEST', message, 400, details),
  
  unauthorized: (message: string = 'Unauthorized') =>
    error('UNAUTHORIZED', message, 401),
  
  forbidden: (message: string = 'Access denied') =>
    error('FORBIDDEN', message, 403),
  
  notFound: (resource: string = 'Resource') =>
    error('NOT_FOUND', `${resource} not found`, 404),
  
  conflict: (message: string) =>
    error('CONFLICT', message, 409),
  
  tooManyRequests: () =>
    error('TOO_MANY_REQUESTS', 'Rate limit exceeded', 429),
  
  internal: (message: string = 'Internal server error') =>
    error('INTERNAL_ERROR', message, 500),
};

// CORS headers
export function corsHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  };
}

// Parse request body safely
export function parseBody<T>(body: string | null): T | null {
  if (!body) return null;
  try {
    return JSON.parse(body) as T;
  } catch {
    return null;
  }
}

// Get user ID from Cognito claims
export function getUserId(claims: Record<string, unknown>): string {
  return claims.sub as string;
}

// Get user role from Cognito claims
export function getUserRole(claims: Record<string, unknown>): string {
  return (claims['custom:role'] as string)?.toUpperCase() || 
         (claims['cognito:groups'] as string[])?.[0] || 
         'TALENT';
}

// Check if user has required role
export function hasRole(claims: Record<string, unknown>, ...allowedRoles: string[]): boolean {
  const userRole = getUserRole(claims);
  return allowedRoles.includes(userRole);
}

// Check if user is admin
export function isAdmin(claims: Record<string, unknown>): boolean {
  return hasRole(claims, 'ADMIN');
}

// Logger
export const logger = {
  info: (message: string, data?: Record<string, unknown>) => {
    console.log(JSON.stringify({ level: 'INFO', message, ...data, timestamp: now() }));
  },
  warn: (message: string, data?: Record<string, unknown>) => {
    console.warn(JSON.stringify({ level: 'WARN', message, ...data, timestamp: now() }));
  },
  error: (message: string, error?: Error, data?: Record<string, unknown>) => {
    console.error(JSON.stringify({
      level: 'ERROR',
      message,
      error: error?.message,
      stack: error?.stack,
      ...data,
      timestamp: now(),
    }));
  },
};
