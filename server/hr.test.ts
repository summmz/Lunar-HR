import { describe, it, expect, beforeEach, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock user contexts
function createAdminContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "admin-user",
      email: "admin@example.com",
      name: "Admin User",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as TrpcContext["res"],
  };
}

function createUserContext(): TrpcContext {
  return {
    user: {
      id: 2,
      openId: "regular-user",
      email: "user@example.com",
      name: "Regular User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as TrpcContext["res"],
  };
}

describe("HR System - Employee Router", () => {
  it("should list employees with pagination", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.employee.list({
      limit: 50,
      offset: 0,
    });

    expect(Array.isArray(result)).toBe(true);
  });

  it("should search employees by name", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.employee.search("John");

    expect(Array.isArray(result)).toBe(true);
  });

  it("should filter employees by department", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.employee.filter({
      department: "Engineering",
      limit: 50,
    });

    expect(Array.isArray(result)).toBe(true);
  });

  it("should filter employees by status", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.employee.filter({
      status: "active",
      limit: 50,
    });

    expect(Array.isArray(result)).toBe(true);
  });

  it("should get employee count", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const count = await caller.employee.count();

    expect(typeof count).toBe("number");
    expect(count).toBeGreaterThanOrEqual(0);
  });

  it("should get employees by department", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.employee.getByDepartment("Engineering");

    expect(Array.isArray(result)).toBe(true);
  });
});

describe("HR System - Payroll Router", () => {
  it("should retrieve payroll by employee ID", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.payroll.getByEmployeeId(1);

    expect(Array.isArray(result)).toBe(true);
  });

  it("should retrieve payroll stats", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const stats = await caller.payroll.stats();

    expect(Array.isArray(stats)).toBe(true);
  });
});

describe("HR System - Notification Router", () => {
  it("should list notifications for user", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.notification.list({
      limit: 20,
    });

    expect(Array.isArray(result)).toBe(true);
  });

  it("should get unread notifications", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.notification.unread();

    expect(Array.isArray(result)).toBe(true);
  });

  it("should mark all notifications as read", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.notification.markAllAsRead();

    expect(result.success).toBe(true);
  });
});

describe("HR System - Chat Router", () => {
  it("should retrieve chat history", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.chat.getHistory({
      limit: 50,
    });

    expect(Array.isArray(result)).toBe(true);
  });

  it("should send a chat message and get response", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.chat.sendMessage({
      message: "What is the onboarding process?",
    });

    expect(result.success).toBe(true);
    expect(typeof result.response).toBe("string");
    expect(result.response.length).toBeGreaterThan(0);
  });

  it("should handle salary-related queries", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.chat.sendMessage({
      message: "Can you help me with salary information?",
    });

    expect(result.success).toBe(true);
    expect(result.response.toLowerCase()).toContain("salary");
  });

  it("should handle HR policy questions", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.chat.sendMessage({
      message: "What are the HR policies?",
    });

    expect(result.success).toBe(true);
    expect(result.response.toLowerCase()).toContain("polic");
  });
});

describe("HR System - Dashboard Router", () => {
  it("should retrieve HR statistics", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const stats = await caller.dashboard.stats();

    expect(stats).toBeDefined();
    expect(typeof stats?.totalEmployees).toBe("number");
    expect(typeof stats?.activeEmployees).toBe("number");
    expect(typeof stats?.departmentCount).toBe("number");
  });
});

describe("HR System - Salary History Router", () => {
  it("should retrieve salary history for employee", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.salaryHistory.getByEmployeeId(1);

    expect(Array.isArray(result)).toBe(true);
  });
});

describe("HR System - Document Router", () => {
  it("should retrieve documents by employee ID", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.document.getByEmployeeId(1);

    expect(Array.isArray(result)).toBe(true);
  });
});

describe("HR System - Authorization", () => {
  it("should allow admin to access admin procedures", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // Admin should be able to access admin procedures
    const result = await caller.employee.list({
      limit: 50,
      offset: 0,
    });

    expect(Array.isArray(result)).toBe(true);
  });

  it("should allow regular users to access protected procedures", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    // Regular users should be able to access protected procedures
    const result = await caller.employee.list({
      limit: 50,
      offset: 0,
    });

    expect(Array.isArray(result)).toBe(true);
  });
});
