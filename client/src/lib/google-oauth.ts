export function getGoogleLoginUrl(returnPath?: string): string {
  const clientId = import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID;

  if (!clientId || clientId === 'your-google-client-id') {
    throw new Error(
      'VITE_GOOGLE_OAUTH_CLIENT_ID is not configured. ' +
      'Copy .env.example to .env.local and fill in your Google OAuth credentials.'
    );
  }

  const apiUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
  const redirectUri = `${apiUrl}/api/oauth/google/callback`;

  const state = btoa(JSON.stringify({
    returnPath: returnPath || '/dashboard',
  }));

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Redirects to Google OAuth. Throws a descriptive Error if not configured.
 * Callers should catch and display the message to the user.
 */
export function handleGoogleLoginClick(returnPath?: string): void {
  const url = getGoogleLoginUrl(returnPath);
  window.location.href = url;
}
