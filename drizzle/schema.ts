import { 
  int, 
  mysqlEnum, 
  mysqlTable, 
  text, 
  timestamp, 
  varchar,
  decimal,
  date,
  boolean,
  longtext,
  index
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Employee table - Core HR data
 */
export const employees = mysqlTable("employees", {
  id: int("id").autoincrement().primaryKey(),
  // FK → users.id — nullable because an employee may not have a login yet
  userId: int("userId").unique().references(() => users.id, { onDelete: "set null" }),
  firstName: varchar("firstName", { length: 100 }).notNull(),
  lastName: varchar("lastName", { length: 100 }).notNull(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  phone: varchar("phone", { length: 20 }),
  department: varchar("department", { length: 100 }).notNull(),
  position: varchar("position", { length: 100 }).notNull(),
  hireDate: date("hireDate", { mode: 'date' }).notNull(),
  status: mysqlEnum("status", ["active", "inactive", "on_leave", "terminated"]).default("active").notNull(),
  basicSalary: decimal("basicSalary", { precision: 12, scale: 2 }).notNull(),
  allowances: decimal("allowances", { precision: 12, scale: 2 }).default("0"),
  deductions: decimal("deductions", { precision: 12, scale: 2 }).default("0"),
  reportingManager: varchar("reportingManager", { length: 100 }),
  dateOfBirth: date("dateOfBirth", { mode: 'date' }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  zipCode: varchar("zipCode", { length: 20 }),
  country: varchar("country", { length: 100 }),
  profileImage: varchar("profileImage", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("employees_userId_idx").on(table.userId),
  emailIdx: index("email_idx").on(table.email),
  departmentIdx: index("department_idx").on(table.department),
  statusIdx: index("status_idx").on(table.status),
}));

export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = typeof employees.$inferInsert;

/**
 * Payroll table - Salary and compensation tracking
 */
export const payroll = mysqlTable("payroll", {
  id: int("id").autoincrement().primaryKey(),
  // FK → employees.id — cascade delete: remove payroll when employee is deleted
  employeeId: int("employeeId").notNull().references(() => employees.id, { onDelete: "cascade" }),
  month: date("month", { mode: 'date' }).notNull(),
  basicSalary: decimal("basicSalary", { precision: 12, scale: 2 }).notNull(),
  allowances: decimal("allowances", { precision: 12, scale: 2 }).default("0"),
  deductions: decimal("deductions", { precision: 12, scale: 2 }).default("0"),
  grossSalary: decimal("grossSalary", { precision: 12, scale: 2 }).notNull(),
  netSalary: decimal("netSalary", { precision: 12, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["pending", "processed", "paid"]).default("pending").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  employeeIdIdx: index("payroll_employeeId_idx").on(table.employeeId),
  monthIdx: index("payroll_month_idx").on(table.month),
}));

export type Payroll = typeof payroll.$inferSelect;
export type InsertPayroll = typeof payroll.$inferInsert;


/**
 * Notifications table - HR event notifications
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  // FK → users.id — cascade delete
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  type: mysqlEnum("type", ["employee_added", "salary_changed", "document_uploaded", "leave_request", "other"]).notNull(),
  // FK → employees.id — set null if employee deleted
  relatedEmployeeId: int("relatedEmployeeId").references(() => employees.id, { onDelete: "set null" }),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("notifications_userId_idx").on(table.userId),
  isReadIdx: index("notifications_isRead_idx").on(table.isRead),
}));

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * Chat history table - HR chatbot conversations
 */
export const chatHistory = mysqlTable("chatHistory", {
  id: int("id").autoincrement().primaryKey(),
  // FK → users.id — cascade delete
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  // FK → employees.id — set null if employee deleted
  employeeId: int("employeeId").references(() => employees.id, { onDelete: "set null" }),
  role: mysqlEnum("role", ["user", "assistant"]).notNull(),
  message: longtext("message").notNull(),
  context: varchar("context", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("chatHistory_userId_idx").on(table.userId),
  employeeIdIdx: index("chatHistory_employeeId_idx").on(table.employeeId),
}));

export type ChatHistory = typeof chatHistory.$inferSelect;
export type InsertChatHistory = typeof chatHistory.$inferInsert;

/**
 * Salary history table - Track salary changes over time
 */
export const salaryHistory = mysqlTable("salaryHistory", {
  id: int("id").autoincrement().primaryKey(),
  // FK → employees.id — cascade delete
  employeeId: int("employeeId").notNull().references(() => employees.id, { onDelete: "cascade" }),
  previousBasicSalary: decimal("previousBasicSalary", { precision: 12, scale: 2 }).notNull(),
  newBasicSalary: decimal("newBasicSalary", { precision: 12, scale: 2 }).notNull(),
  effectiveDate: date("effectiveDate", { mode: 'date' }).notNull(),
  reason: text("reason"),
  // FK → users.id — restrict: preserve audit trail
  changedBy: int("changedBy").notNull().references(() => users.id, { onDelete: "restrict" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  employeeIdIdx: index("salaryHistory_employeeId_idx").on(table.employeeId),
}));

export type SalaryHistory = typeof salaryHistory.$inferSelect;
export type InsertSalaryHistory = typeof salaryHistory.$inferInsert;

/**
 * Leave Requests table - Employee leave/time-off management
 */
export const leaveRequests = mysqlTable("leaveRequests", {
  id: int("id").autoincrement().primaryKey(),
  // FK → employees.id — cascade delete
  employeeId: int("employeeId").notNull().references(() => employees.id, { onDelete: "cascade" }),
  leaveType: mysqlEnum("leaveType", ["annual", "sick", "casual", "maternity", "paternity", "unpaid", "other"]).notNull(),
  startDate: date("startDate", { mode: 'date' }).notNull(),
  endDate: date("endDate", { mode: 'date' }).notNull(),
  totalDays: int("totalDays").notNull(),
  reason: text("reason"),
  status: mysqlEnum("status", ["pending", "approved", "rejected", "cancelled"]).default("pending").notNull(),
  // FK → users.id — set null if reviewer account is removed
  reviewedBy: int("reviewedBy").references(() => users.id, { onDelete: "set null" }),
  reviewedAt: timestamp("reviewedAt"),
  reviewNotes: text("reviewNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  employeeIdIdx: index("leaveRequests_employeeId_idx").on(table.employeeId),
  statusIdx: index("leaveRequests_status_idx").on(table.status),
  startDateIdx: index("leaveRequests_startDate_idx").on(table.startDate),
}));

export type LeaveRequest = typeof leaveRequests.$inferSelect;
export type InsertLeaveRequest = typeof leaveRequests.$inferInsert;

/**
 * Attendance table - Daily attendance tracking
 */
export const attendance = mysqlTable("attendance", {
  id: int("id").autoincrement().primaryKey(),
  // FK → employees.id — cascade delete
  employeeId: int("employeeId").notNull().references(() => employees.id, { onDelete: "cascade" }),
  date: date("date", { mode: 'date' }).notNull(),
  checkIn: timestamp("checkIn"),
  checkOut: timestamp("checkOut"),
  status: mysqlEnum("status", ["present", "absent", "late", "half_day", "on_leave", "holiday"]).default("present").notNull(),
  workHours: decimal("workHours", { precision: 4, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  employeeIdIdx: index("attendance_employeeId_idx").on(table.employeeId),
  dateIdx: index("attendance_date_idx").on(table.date),
  employeeDateIdx: index("attendance_employeeId_date_idx").on(table.employeeId, table.date),
}));

export type Attendance = typeof attendance.$inferSelect;
export type InsertAttendance = typeof attendance.$inferInsert;

/**
 * Departments table - Central department registry
 */
export const departments = mysqlTable("departments", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Department = typeof departments.$inferSelect;
export type InsertDepartment = typeof departments.$inferInsert;
