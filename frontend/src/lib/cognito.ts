import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  RespondToAuthChallengeCommand,
} from '@aws-sdk/client-cognito-identity-provider';

const CLIENT_ID = '5pr9578kadh8qtk8qahk08cjga';
const REGION = 'eu-west-1';

const client = new CognitoIdentityProviderClient({ region: REGION });

export interface LoginResult {
  challenge?: 'NEW_PASSWORD_REQUIRED';
  session?: string;
  accessToken?: string;
  idToken?: string;
}

export async function login(email: string, password: string): Promise<LoginResult> {
  const result = await client.send(
    new InitiateAuthCommand({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: CLIENT_ID,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },
    }),
  );

  if (result.ChallengeName === 'NEW_PASSWORD_REQUIRED') {
    return { challenge: 'NEW_PASSWORD_REQUIRED', session: result.Session };
  }

  return {
    accessToken: result.AuthenticationResult?.AccessToken,
    idToken: result.AuthenticationResult?.IdToken,
  };
}

export async function completeNewPassword(
  email: string,
  newPassword: string,
  session: string,
): Promise<{ accessToken?: string; idToken?: string }> {
  const result = await client.send(
    new RespondToAuthChallengeCommand({
      ClientId: CLIENT_ID,
      ChallengeName: 'NEW_PASSWORD_REQUIRED',
      Session: session,
      ChallengeResponses: {
        USERNAME: email,
        NEW_PASSWORD: newPassword,
      },
    }),
  );

  return {
    accessToken: result.AuthenticationResult?.AccessToken,
    idToken: result.AuthenticationResult?.IdToken,
  };
}

// Decodes a JWT's payload without verifying the signature.
// Fine for reading our own token's claims client-side — the token itself
// was already verified by Cognito when it was issued.
export function decodeToken(token: string): Record<string, unknown> {
  const payload = token.split('.')[1];
  const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
  return JSON.parse(decoded);
}