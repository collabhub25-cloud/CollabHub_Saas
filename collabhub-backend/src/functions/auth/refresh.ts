import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { CognitoIdentityProviderClient, AdminInitiateAuthCommand } from '@aws-sdk/client-cognito-identity-provider';
import { success, errors, parseBody, logger } from '../../lib/utils/response.js';
import { refreshTokenSchema, validate, formatValidationErrors } from '../../schemas/index.js';

const cognitoClient = new CognitoIdentityProviderClient({ region: process.env.REGION });
const USER_POOL_ID = process.env.USER_POOL_ID!;
const USER_POOL_CLIENT_ID = process.env.USER_POOL_CLIENT_ID!;

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const body = parseBody(event.body);
    if (!body) {
      return errors.badRequest('Request body is required');
    }

    // Validate input
    const validation = validate(refreshTokenSchema, body);
    if (!validation.success) {
      return errors.badRequest('Validation failed', { errors: formatValidationErrors(validation.errors) });
    }

    const { refreshToken } = validation.data;

    try {
      const authResult = await cognitoClient.send(new AdminInitiateAuthCommand({
        UserPoolId: USER_POOL_ID,
        ClientId: USER_POOL_CLIENT_ID,
        AuthFlow: 'REFRESH_TOKEN_AUTH',
        AuthParameters: {
          REFRESH_TOKEN: refreshToken,
        },
      }));

      if (!authResult.AuthenticationResult) {
        return errors.unauthorized('Token refresh failed');
      }

      logger.info('Token refreshed successfully');

      return success({
        idToken: authResult.AuthenticationResult.IdToken,
        accessToken: authResult.AuthenticationResult.AccessToken,
        expiresIn: authResult.AuthenticationResult.ExpiresIn,
      });

    } catch (cognitoError: any) {
      if (cognitoError.name === 'NotAuthorizedException') {
        return errors.unauthorized('Invalid or expired refresh token');
      }
      throw cognitoError;
    }

  } catch (err) {
    logger.error('Token refresh failed', err as Error);
    return errors.internal('Token refresh failed');
  }
}
