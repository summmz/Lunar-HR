import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { ENV } from "./env";
import {
  exchangeGoogleCode,
  handleGoogleOAuthCallback as processGoogleOAuthCallback,
} from "../oauth-google";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

/**
 * Derives the request origin robustly:
 * 1. Uses APP_URL env var if set (most reliable — avoids proxy issues).
 * 2. Falls back to x-forwarded-proto + host headers (common reverse proxy setup).
 * 3. Falls back to req.protocol + host.
 */
function getOrigin(req: Request): string {
  if (ENV.appUrl) {
    return ENV.appUrl.replace(/\/$/, "");
  }

  const forwardedProto = req.headers["x-forwarded-proto"];
  const proto = Array.isArray(forwardedProto)
    ? forwardedProto[0]
    : forwardedProto?.split(",")[0].trim() ?? req.protocol;

  const host = req.headers["x-forwarded-host"] ?? req.get("host");
  return `${proto}://${host}`;
}

export function registerOAuthRoutes(app: Express) {
  // Trust proxy headers so req.protocol reflects https behind a load balancer
  app.set("trust proxy", true);

  app.get("/api/oauth/google/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      const origin = getOrigin(req);
      const redirectUri = `${origin}/api/oauth/google/callback`;

      console.log("[Google OAuth] Callback — origin:", origin, "redirectUri:", redirectUri);

      const googleProfile = await exchangeGoogleCode(code, redirectUri);
      const openId = await processGoogleOAuthCallback(googleProfile);

      const user = await db.getUserByOpenId(openId);
      if (!user) {
        res.status(401).json({ error: "User not found after OAuth" });
        return;
      }

      const sessionToken = await sdk.createSessionToken(openId, {
        name: user.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, {
        ...cookieOptions,
        maxAge: ONE_YEAR_MS,
      });

      const dashboardPath =
        user.role === "admin" ? "/admin/dashboard" : "/user/dashboard";

      const finalRedirectUrl = ENV.frontendUrl
        ? `${ENV.frontendUrl.replace(/\/$/, "")}${dashboardPath}`
        : dashboardPath;

      res.redirect(302, finalRedirectUrl);
    } catch (error) {
      console.error("[Google OAuth] Callback failed:", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
