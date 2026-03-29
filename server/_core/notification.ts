import { TRPCError } from "@trpc/server";
import { ENV } from "./env";
import * as db from "../db";

export type NotificationPayload = {
  title: string;
  content: string;
};

const TITLE_MAX_LENGTH = 1200;
const CONTENT_MAX_LENGTH = 20000;

const trimValue = (value: string): string => value.trim();
const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const buildEndpointUrl = (baseUrl: string): string => {
  const normalizedBase = baseUrl.endsWith("/")
    ? baseUrl
    : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};

const validatePayload = (input: NotificationPayload): NotificationPayload => {
  if (!isNonEmptyString(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required.",
    });
  }
  if (!isNonEmptyString(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required.",
    });
  }

  const title = trimValue(input.title);
  const content = trimValue(input.content);

  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`,
    });
  }

  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`,
    });
  }

  return { title, content };
};

/**
 * Dispatches a project-owner notification through the Manus Notification Service.
 * Returns `true` if the request was accepted, `false` when the upstream service
 * cannot be reached (callers can fall back to email/slack). Validation errors
 * bubble up as TRPC errors so callers can fix the payload.
 */
export async function notifyOwner(
  payload: NotificationPayload
): Promise<boolean> {
  const { title, content } = validatePayload(payload);

  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured.",
    });
  }

  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured.",
    });
  }

  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1",
      },
      body: JSON.stringify({ title, content }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${
          detail ? `: ${detail}` : ""
        }`
      );
      return false;
    }

    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

/**
 * Creates an in-app notification for every admin user in the database.
 * Call this alongside notifyOwner so admins see events in their Notifications
 * page — not just via the external Manus push service.
 */
export async function notifyAdminUsers(
  payload: NotificationPayload & {
    type?: "employee_added" | "salary_changed" | "document_uploaded" | "leave_request" | "other";
    relatedEmployeeId?: number;
  }
): Promise<void> {
  try {
    const adminUsers = await db.getAllAdminUsers();
    await Promise.all(
      adminUsers.map((admin) =>
        db.createNotification({
          userId: admin.id,
          title: payload.title,
          content: payload.content,
          type: payload.type ?? "other",
          relatedEmployeeId: payload.relatedEmployeeId,
        })
      )
    );
  } catch (error) {
    console.warn("[Notification] Failed to notify admin users:", error);
  }
}

/**
 * Creates an in-app notification for a specific user in the database.
 * Unlike notifyOwner (which pings the external Manus service), this writes
 * directly to the notifications table so the employee sees it in their
 * Notifications page.
 */
export async function notifyUser(
  userId: number,
  payload: NotificationPayload & {
    type?: "employee_added" | "salary_changed" | "document_uploaded" | "leave_request" | "other";
    relatedEmployeeId?: number;
  }
): Promise<void> {
  try {
    await db.createNotification({
      userId,
      title: payload.title,
      content: payload.content,
      type: payload.type ?? "other",
      relatedEmployeeId: payload.relatedEmployeeId,
    });
  } catch (error) {
    console.warn("[Notification] Failed to create in-app notification:", error);
  }
}
