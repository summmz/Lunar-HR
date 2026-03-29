import { Request, Response } from 'express';
import { COOKIE_NAME } from '@shared/const';
import { getSessionCookieOptions } from './_core/cookies';
import { sdk } from './_core/sdk';
import { exchangeGoogleCode, handleGoogleOAuthCallback as processGoogleOAuthCallback } from './oauth-google';
import { getUserByOpenId } from './db';

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

export async function handleGoogleOAuthCallbackRoute(req: Request, res: Response) {
  try {
    const { code, state } = req.query;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Missing authorization code' });
    }

    if (!state || typeof state !== 'string') {
      return res.status(400).json({ error: 'Missing state parameter' });
    }

    // Exchange code for Google profile
    const redirectUri = `${req.protocol}://${req.get('host')}/api/oauth/callback`;
    const googleProfile = await exchangeGoogleCode(code, redirectUri);

    // Handle OAuth callback and get openId
    const openId = await processGoogleOAuthCallback(googleProfile);

    // Get user from database
    const user = await getUserByOpenId(openId);
    if (!user) {
      return res.status(401).json({ error: 'User not found after OAuth' });
    }

    // Create session token
    const token = await sdk.createSessionToken(user.openId, {
      name: user.name || '',
      expiresInMs: ONE_YEAR_MS,
    });

    // Set session cookie
    const cookieOptions = getSessionCookieOptions(req);
    res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });

    // Parse state to get redirect URL
    let redirectUrl = '/dashboard';
    try {
      const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
      if (stateData.returnPath && typeof stateData.returnPath === 'string') {
        redirectUrl = stateData.returnPath;
      }
    } catch (e) {
      // Fallback to default redirect
    }

    // Redirect to dashboard or specified return path
    return res.redirect(redirectUrl);
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    res.status(500).json({ error: 'OAuth callback failed' });
  }
}
