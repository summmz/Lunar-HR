import { OAuth2Client } from 'google-auth-library';
import { ENV } from './_core/env';
import { upsertUser } from './db';

// Lazily create the client so it reads credentials after dotenv has loaded
function getOAuthClient() {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID ?? ENV.googleOAuthClientId;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET ?? ENV.googleOAuthClientSecret;

  console.log('[Google OAuth] Client ID present:', !!clientId, '| Secret present:', !!clientSecret);

  return new OAuth2Client(clientId, clientSecret);
}

export interface GoogleProfile {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export async function exchangeGoogleCode(code: string, redirectUri: string): Promise<GoogleProfile> {
  const client = getOAuthClient();

  console.log('[Google OAuth] Exchanging code, redirectUri:', redirectUri);

  try {
    const { tokens } = await client.getToken({ code, redirect_uri: redirectUri });
    client.setCredentials(tokens);

    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token!,
      audience: process.env.GOOGLE_OAUTH_CLIENT_ID ?? ENV.googleOAuthClientId,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      throw new Error('Failed to get Google profile');
    }

    return {
      id: payload.sub,
      email: payload.email || '',
      name: payload.name || '',
      picture: payload.picture,
    };
  } catch (error: any) {
    console.error('[Google OAuth] Token exchange failed:', error?.response?.data ?? error?.message ?? error);
    throw new Error('Failed to exchange Google code for token');
  }
}

export async function handleGoogleOAuthCallback(profile: GoogleProfile) {
  await upsertUser({
    openId: `google_${profile.id}`,
    email: profile.email,
    name: profile.name,
    loginMethod: 'google',
  });

  return `google_${profile.id}`;
}
