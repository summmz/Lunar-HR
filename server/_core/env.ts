export const ENV = {
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  googleOAuthClientId: process.env.GOOGLE_OAUTH_CLIENT_ID ?? "",
  googleOAuthClientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET ?? "",
  // Explicit app URL for OAuth redirect URIs — avoids protocol detection issues behind proxies.
  // Set this to your full origin e.g. https://yourdomain.com in production.
  appUrl: process.env.APP_URL ?? "",
  frontendUrl: process.env.FRONTEND_URL ?? "",
};

export type EnvType = typeof ENV;
