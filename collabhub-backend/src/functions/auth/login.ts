import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { CognitoIdentityProviderClient, AdminInitiateAuthCommand, AdminGetUserCommand } from '@aws-sdk/client-cognito-identity-provider';
import { success, errors, parseBody, logger } from '../../lib/utils/response.js';
import { loginSchema, validate, formatValidationErrors } from '../../schemas/index.js';

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
    const validation = validate(loginSchema, body);
    if (!validation.success) {
      return errors.badRequest('Validation failed', { errors: formatValidationErrors(validation.errors) });
    }

    const { email, password } = validation.data;
    
    logger.info('Login attempt', { email });

    try {
      // Authenticate user
      const authResult = await cognitoClient.send(new AdminInitiateAuthCommand({
        UserPoolId: USER_POOL_ID,
        ClientId: USER_POOL_CLIENT_ID,
        AuthFlow: 'ADMIN_USER_PASSWORD_AUTH',
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password,
        },
      }));

      if (!authResult.AuthenticationResult) {
        return errors.unauthorized('Authentication failed');
      }

      // Get user details
      const userResult = await cognitoClient.send(new AdminGetUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: email,
      }));

      const userAttributes = userResult.UserAttributes || [];
      const getAttribute = (name: string) => 
        userAttributes.find(attr => attr.Name === name)?.Value;

      const userId = getAttribute('sub');
      const role = getAttribute('custom:role') || 'TALENT';
      const firstName = getAttribute('custom:firstName') || '';
      const lastName = getAttribute('custom:lastName') || '';

      logger.info('Login successful', { userId, email, role });

      return success({
        idToken: authResult.AuthenticationResult.IdToken,
        accessToken: authResult.AuthenticationResult.AccessToken,
        refreshToken: authResult.AuthenticationResult.RefreshToken,
        expiresIn: authResult.AuthenticationResult.ExpiresIn,
        user: {
          userId,
          email,
          role,
          firstName,
          lastName,
        },
      });

    } catch (cognitoError: any) {
      if (cognitoError.name === 'NotAuthorizedException') {
        return errors.unauthorized('Invalid email or password');
      }
      if (cognitoError.name === 'UserNotFoundException') {
        return errors.unauthorized('Invalid email or password');
      }
      if (cognitoError.name === 'UserNotConfirmedException') {
        return errors.forbidden('Please verify your email before logging in');
      }
      throw cognitoError;
    }

  } catch (err) {
    logger.error('Login failed', err as Error);
    return errors.internal('Login failed');
  }
}
