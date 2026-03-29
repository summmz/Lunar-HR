export function getGoogleLoginUrl(returnPath?: string): string {
  const clientId = import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID;
  if (!clientId) {
    throw new Error('Google OAuth Client ID not configured');
  }

  const redirectUri = `${window.location.origin}/api/oauth/google/callback`;
  
  // Create state with return path
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

export function handleGoogleLoginClick(returnPath?: string) {
  try {
    const url = getGoogleLoginUrl(returnPath);
    window.location.href = url;
  } catch (error) {
    console.error('Failed to generate Google login URL:', error);
  }
}
