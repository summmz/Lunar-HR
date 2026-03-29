import { eq, desc, and, like, gte, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { 
  InsertUser, 
  users,
  employees,
  payroll,
  notifications,
  chatHistory,
  salaryHistory,
  leaveRequests,
  attendance,
  departments,
  type Employee,
  type Payroll,
  type Notification,
  type ChatHistory,
  type SalaryHistory,
  type LeaveRequest,
  type InsertLeaveRequest,
  type Attendance,
  type InsertAttendance,
  type Department,
  type InsertDepartment,
} from "../drizzle/schema";
import { ENV } from './_core/env';

// Convert string or Date to a Date object for Drizzle date(mode:'date') columns
function toDateObj(d: Date | string): Date {
  if (d instanceof Date) return d;
  if (/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(d)) return new Date(d + 'T00:00:00');
  return new Date(d);
}


let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create a pooled Drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const pool = mysql.createPool({
        uri: process.env.DATABASE_URL,
        connectionLimit: 10,
        waitForConnections: true,
        queueLimit: 0,
      });
      _db = drizzle(pool);
    } catch (error) {
      console.warn("[Database] Failed to create connection pool:", error);
      _db = null;
    }
  }
  return _db;
}

// ============ USER OPERATIONS ============

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  // Exclude admins — this list is used to show unlinked sign-ins for assignment
  return db.select().from(users).where(eq(users.role, "user")).orderBy(desc(users.createdAt));
}

// ============ EMPLOYEE OPERATIONS ============

export async function createEmployee(data: Omit<typeof employees.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create employee: database not available");
    return [{ insertId: Math.floor(Math.random() * 1000) }];
  }

  const result = await db.insert(employees).values(data);
  return result;
}

export async function getEmployeeById(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get employee: database not available");
    return undefined;
  }

  const result = await db.select().from(employees).where(eq(employees.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Look up an employee by their linked user account ID.
 * Used by user-facing pages so a logged-in user can find their own HR record
 * without needing to know their employeeId.
 *
 * Returns `null` if no employee profile has been linked to this user yet.
 */
export async function getEmployeeByUserId(userId: number): Promise<Employee | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(employees)
    .where(eq(employees.userId, userId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

/**
 * Look up an employee by their email address.
 * Used during login to auto-link a new user account to an existing employee
 * record when the emails match.
 */
export async function getEmployeeByEmail(email: string): Promise<Employee | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(employees)
    .where(eq(employees.email, email))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function getAllEmployees(limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) {
    return [
      {
        id: 1,
        userId: null,
        firstName: "Admin",
        lastName: "User",
        email: "admin@example.com",
        phone: "123-456-7890",
        department: "HR",
        position: "HR Manager",
        hireDate: new Date(),
        status: 'active' as const,
        basicSalary: "5000",
        allowances: "500",
        deductions: "200",
        reportingManager: "Manager Name",
        dateOfBirth: new Date("1990-01-01"),
        address: "123 Main St",
        city: "Stockholm",
        state: "Stockholm",
        zipCode: "12345",
        country: "Sweden",
        profileImage: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];
  }

  return db.select().from(employees).limit(limit).offset(offset);
}

export async function searchEmployees(query: string, limit = 50) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(employees).where(
    like(employees.firstName, `%${query}%`)
  ).limit(limit);
}

export async function filterEmployees(filters: {
  department?: string;
  status?: string;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];
  if (filters.department) {
    conditions.push(eq(employees.department, filters.department));
  }
  if (filters.status) {
    conditions.push(eq(employees.status, filters.status as any));
  }

  const query = conditions.length > 0 ? db.select().from(employees).where(and(...conditions)) : db.select().from(employees);
  
  return query.limit(filters.limit || 50).offset(filters.offset || 0);
}

export async function updateEmployee(id: number, data: Partial<typeof employees.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.update(employees).set(data).where(eq(employees.id, id));
}

export async function deleteEmployee(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.delete(employees).where(eq(employees.id, id));
}

export async function getEmployeeCount() {
  const db = await getDb();
  if (!db) return 0;

  const result = await db.select({ count: employees.id }).from(employees);
  return result.length;
}

export async function getEmployeesByDepartment(department: string) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(employees).where(eq(employees.department, department));
}

// ============ PAYROLL OPERATIONS ============

export async function createPayroll(data: Omit<typeof payroll.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create payroll: database not available");
    return { affectedRows: 1 };
  }

  return db.insert(payroll).values(data);
}

export async function getPayrollByEmployeeId(employeeId: number, limit = 12) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(payroll)
    .where(eq(payroll.employeeId, employeeId))
    .orderBy(desc(payroll.month))
    .limit(limit);
}

export async function getPayrollByMonth(month: Date) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(payroll).where(eq(payroll.month, month));
}

// Returns the payroll record for a specific employee + month, or null if none exists.
// Used to prevent duplicate payroll entries.
export async function getPayrollByEmployeeAndMonth(employeeId: number, month: Date) {
  const db = await getDb();
  if (!db) return null;

  const results = await db
    .select()
    .from(payroll)
    .where(and(eq(payroll.employeeId, employeeId), eq(payroll.month, month)))
    .limit(1);
  return results[0] ?? null;
}

export async function updatePayroll(id: number, data: Partial<typeof payroll.$inferInsert>) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update payroll: database not available");
    return { affectedRows: 1 };
  }

  return db.update(payroll).set(data).where(eq(payroll.id, id));
}

export async function getPayrollStats() {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select({
    totalGross: payroll.grossSalary,
    totalNet: payroll.netSalary,
    count: payroll.id
  }).from(payroll);

  return result;
}

// ============ DOCUMENT OPERATIONS ============




export async function createNotification(data: Omit<typeof notifications.$inferInsert, 'id' | 'createdAt'>) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create notification: database not available");
    return { affectedRows: 1 };
  }

  return db.insert(notifications).values(data);
}

export async function getNotificationsByUserId(userId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function getUnreadNotifications(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)))
    .orderBy(desc(notifications.createdAt));
}

export async function markNotificationAsRead(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
}

export async function markAllNotificationsAsRead(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot mark all as read: database not available");
    return { affectedRows: 0 };
  }

  return db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
}

// ============ CHAT HISTORY OPERATIONS ============

export async function saveChatMessage(data: Omit<typeof chatHistory.$inferInsert, 'id' | 'createdAt'>) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot save chat message: database not available");
    return { affectedRows: 0 };
  }

  return db.insert(chatHistory).values(data);
}

export async function getChatHistory(userId: number, employeeId?: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(chatHistory.userId, userId)];
  if (employeeId) {
    conditions.push(eq(chatHistory.employeeId, employeeId));
  }

  return db.select().from(chatHistory)
    .where(and(...conditions))
    .orderBy(desc(chatHistory.createdAt))
    .limit(limit);
}

// ============ SALARY HISTORY OPERATIONS ============

export async function createSalaryHistory(data: Omit<typeof salaryHistory.$inferInsert, 'id' | 'createdAt'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(salaryHistory).values(data);
}

export async function getSalaryHistoryByEmployeeId(employeeId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(salaryHistory)
    .where(eq(salaryHistory.employeeId, employeeId))
    .orderBy(desc(salaryHistory.effectiveDate));
}

// ============ STATISTICS OPERATIONS ============

export async function getHRStats() {
  const db = await getDb();
  if (!db) {
    return {
      activeEmployees: 0,
      totalEmployees: 0,
      departmentCount: 0,
    };
  }

  // Use SQL count() instead of fetching all rows into memory
  const [activeResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(employees)
    .where(eq(employees.status, 'active'));

  const [totalResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(employees);

  const departments = await db
    .select({ department: employees.department })
    .from(employees)
    .groupBy(employees.department);

  return {
    activeEmployees: Number(activeResult.count),
    totalEmployees: Number(totalResult.count),
    departmentCount: departments.length,
  };
}

// ============ LEAVE REQUEST OPERATIONS ============

export async function createLeaveRequest(data: InsertLeaveRequest) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const clean = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined)
  ) as InsertLeaveRequest;
  return db.insert(leaveRequests).values(clean);
}

export async function getLeaveRequestById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const results = await db.select().from(leaveRequests).where(eq(leaveRequests.id, id));
  return results[0] ?? null;
}

export async function getLeaveRequestsByEmployeeId(employeeId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(leaveRequests)
    .where(eq(leaveRequests.employeeId, employeeId))
    .orderBy(desc(leaveRequests.createdAt));
}

// Returns any pending/approved leave requests that overlap the given date range.
// Used to prevent conflicting leave submissions.
export async function getOverlappingLeaveRequests(employeeId: number, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];
  const startObj = toDateObj(startDate);
  const endObj = toDateObj(endDate);
  return db.select().from(leaveRequests).where(
    and(
      eq(leaveRequests.employeeId, employeeId),
      // Overlap condition: existing.start <= newEnd AND existing.end >= newStart
      lte(leaveRequests.startDate, endObj),
      gte(leaveRequests.endDate, startObj),
      sql`${leaveRequests.status} IN ('pending', 'approved')`
    )
  );
}

export async function getAllLeaveRequests(status?: string) {
  const db = await getDb();
  if (!db) return [];
  const query = db.select().from(leaveRequests);
  if (status) {
    return query.where(eq(leaveRequests.status, status as any)).orderBy(desc(leaveRequests.createdAt));
  }
  return query.orderBy(desc(leaveRequests.createdAt));
}

export async function updateLeaveRequest(id: number, data: Partial<InsertLeaveRequest>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const clean = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined)
  ) as Partial<InsertLeaveRequest>;
  return db.update(leaveRequests).set(clean).where(eq(leaveRequests.id, id));
}

export async function getLeaveStats(employeeId?: number) {
  const db = await getDb();
  if (!db) return { pending: 0, approved: 0, rejected: 0, total: 0 };
  
  const query = employeeId
    ? db.select().from(leaveRequests).where(eq(leaveRequests.employeeId, employeeId))
    : db.select().from(leaveRequests);
  
  const all = await query;
  return {
    pending: all.filter(r => r.status === 'pending').length,
    approved: all.filter(r => r.status === 'approved').length,
    rejected: all.filter(r => r.status === 'rejected').length,
    total: all.length,
  };
}

// ============ ATTENDANCE OPERATIONS ============

export async function createAttendance(data: InsertAttendance) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const clean = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined)
  ) as InsertAttendance;
  return db.insert(attendance).values(clean);
}

export async function getAttendanceById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const results = await db.select().from(attendance).where(eq(attendance.id, id));
  return results[0] ?? null;
}

export async function getAttendanceByEmployeeId(employeeId: number, limit = 30) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(attendance)
    .where(eq(attendance.employeeId, employeeId))
    .orderBy(desc(attendance.date))
    .limit(limit);
}

// Returns today's attendance record for an employee, or null if not checked in yet.
// Used to prevent duplicate check-ins on the same day.
export async function getAttendanceByEmployeeAndDate(employeeId: number, date: Date) {
  const db = await getDb();
  if (!db) return null;
  const dateObj = toDateObj(date);
  const results = await db.select().from(attendance)
    .where(and(eq(attendance.employeeId, employeeId), eq(attendance.date, dateObj)))
    .limit(1);
  return results[0] ?? null;
}

export async function getAttendanceByDate(date: Date) {
  const db = await getDb();
  if (!db) return [];
  // MySQL DATE columns must be compared with a YYYY-MM-DD string, not a Date object
  const dateObj = toDateObj(date);
  return db.select().from(attendance)
    .where(eq(attendance.date, dateObj));
}

export async function getAttendanceByEmployeeAndDateRange(employeeId: number, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];
  const startObj = toDateObj(startDate);
  const endObj = toDateObj(endDate);
  return db.select().from(attendance)
    .where(and(
      eq(attendance.employeeId, employeeId),
      gte(attendance.date, startObj),
      lte(attendance.date, endObj),
    ))
    .orderBy(desc(attendance.date));
}

export async function getAllAttendanceByDateRange(startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];
  const startObj = toDateObj(startDate);
  const endObj = toDateObj(endDate);
  return db.select().from(attendance)
    .where(and(
      gte(attendance.date, startObj),
      lte(attendance.date, endObj),
    ))
    .orderBy(desc(attendance.date));
}

export async function updateAttendance(id: number, data: Partial<InsertAttendance>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const clean = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined)
  ) as Partial<InsertAttendance>;
  return db.update(attendance).set(clean).where(eq(attendance.id, id));
}

export async function getAttendanceStats(employeeId?: number) {
  const db = await getDb();
  if (!db) return { present: 0, absent: 0, late: 0, halfDay: 0, total: 0 };
  
  const now = new Date();
  const startObj = new Date(now.getFullYear(), now.getMonth(), 1);
  const endObj = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const conditions = employeeId
    ? and(eq(attendance.employeeId, employeeId), gte(attendance.date, startObj), lte(attendance.date, endObj))
    : and(gte(attendance.date, startObj), lte(attendance.date, endObj));

  const all = await db.select().from(attendance).where(conditions);

  return {
    present: all.filter(r => r.status === 'present').length,
    absent: all.filter(r => r.status === 'absent').length,
    late: all.filter(r => r.status === 'late').length,
    halfDay: all.filter(r => r.status === 'half_day').length,
    onLeave: all.filter(r => r.status === 'on_leave').length,
    total: all.length,
  };
}

export async function deleteAttendance(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(attendance).where(eq(attendance.id, id));
}

// ============ DEPARTMENT OPERATIONS ============

export async function getAllDepartments() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(departments).orderBy(departments.name);
}

export async function getDepartmentById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const results = await db.select().from(departments).where(eq(departments.id, id));
  return results[0] ?? null;
}

export async function getDepartmentByName(name: string) {
  const db = await getDb();
  if (!db) return null;
  const results = await db.select().from(departments).where(eq(departments.name, name));
  return results[0] ?? null;
}

export async function createDepartment(data: InsertDepartment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(departments).values(data);
}

export async function updateDepartment(id: number, data: Partial<InsertDepartment>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const clean = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined)
  ) as Partial<InsertDepartment>;
  return db.update(departments).set(clean).where(eq(departments.id, id));
}

export async function deleteDepartment(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(departments).where(eq(departments.id, id));
}

// ============ ADMIN USER HELPERS ============

/** Returns all users with role = 'admin'. Used to fan-out in-app notifications to every admin. */
export async function getAllAdminUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).where(eq(users.role, "admin"));
}
