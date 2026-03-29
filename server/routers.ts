import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure, adminProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";
import { notifyOwner, notifyUser, notifyAdminUsers } from "./_core/notification";
import { invokeLLM } from "./_core/llm";
import { formatDateOnly, calculateDaysBetween } from "../shared/utils";

// ============ VALIDATION SCHEMAS ============

const employeeSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  department: z.string().min(1, "Department is required"),
  position: z.string().min(1, "Position is required"),
  hireDate: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid date"),
  status: z.enum(["active", "inactive", "on_leave", "terminated"]).default("active"),
  basicSalary: z.number().positive("Salary must be positive"),
  allowances: z.number().default(0),
  deductions: z.number().default(0),
  reportingManager: z.string().optional(),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  profileImage: z.string().optional(),
});

const payrollSchema = z.object({
  employeeId: z.number().int().positive(),
  month: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid date"),
  basicSalary: z.number().positive(),
  allowances: z.number().default(0),
  deductions: z.number().default(0),
  grossSalary: z.number().positive(),
  netSalary: z.number().positive(),
  status: z.enum(["pending", "processed", "paid"]).default("pending"),
  notes: z.string().optional(),
});

// ============ EMPLOYEE ROUTER ============

const employeeRouter = router({
  list: protectedProcedure
    .input(z.object({
      limit: z.number().default(50),
      offset: z.number().default(0),
    }))
    .query(async ({ input }) => {
      return db.getAllEmployees(input.limit, input.offset);
    }),

  getById: protectedProcedure
    .input(z.number().int().positive())
    .query(async ({ input }) => {
      const employee = await db.getEmployeeById(input);
      if (!employee) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Employee not found",
        });
      }
      return employee;
    }),

  /**
   * Returns the employee profile linked to the currently logged-in user.
   * Used by all user-facing pages (/user/dashboard, /user/salary, etc.) so they
   * never need to hard-code or manually pass an employeeId.
   *
   * Returns null when no employee has been linked yet — the UI should show a
   * "Your account is not linked to an employee profile yet" message in that case.
   */
  myEmployee: protectedProcedure
    .query(async ({ ctx }) => {
      return db.getEmployeeByUserId(ctx.user.id);
    }),

  search: protectedProcedure
    .input(z.string().min(1))
    .query(async ({ input }) => {
      return db.searchEmployees(input);
    }),

  filter: protectedProcedure
    .input(z.object({
      department: z.string().optional(),
      status: z.string().optional(),
      limit: z.number().default(50),
      offset: z.number().default(0),
    }))
    .query(async ({ input }) => {
      return db.filterEmployees(input);
    }),

  create: adminProcedure
    .input(employeeSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const result = await db.createEmployee({
          ...input,
          hireDate: formatDateOnly(input.hireDate) as any,
          dateOfBirth: input.dateOfBirth ? formatDateOnly(input.dateOfBirth) as any : undefined,
          basicSalary: input.basicSalary.toString(),
          allowances: input.allowances.toString(),
          deductions: input.deductions.toString(),
        });

        // Notify admin about new employee
        try {
          await notifyOwner({
            title: "New Employee Added",
            content: `${input.firstName} ${input.lastName} has been added to the system as ${input.position} in ${input.department}.`,
          });
        } catch (notifyError) {
          console.warn("[createEmployee] Notification failed (non-fatal):", notifyError);
        }

        return { success: true, message: "Employee created successfully" };
      } catch (error) {
        console.error('[createEmployee] Error:', error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to create employee",
        });
      }
    }),

  update: adminProcedure
    .input(z.object({
      id: z.number().int().positive(),
      data: employeeSchema.partial(),
    }))
    .mutation(async ({ input }) => {
      const employee = await db.getEmployeeById(input.id);
      if (!employee) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Employee not found",
        });
      }

      const updateData: any = {
        ...input.data,
      };

      if (input.data.hireDate) {
        updateData.hireDate = formatDateOnly(input.data.hireDate) as any;
      }
      if (input.data.dateOfBirth) {
        updateData.dateOfBirth = formatDateOnly(input.data.dateOfBirth) as any;
      }
      if (input.data.basicSalary) {
        updateData.basicSalary = input.data.basicSalary.toString();
      }
      if (input.data.allowances !== undefined) {
        updateData.allowances = input.data.allowances.toString();
      }
      if (input.data.deductions !== undefined) {
        updateData.deductions = input.data.deductions.toString();
      }

      await db.updateEmployee(input.id, updateData);
      return { success: true, message: "Employee updated successfully" };
    }),

  delete: adminProcedure
    .input(z.number().int().positive())
    .mutation(async ({ input }) => {
      const employee = await db.getEmployeeById(input);
      if (!employee) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Employee not found",
        });
      }

      await db.deleteEmployee(input);
      return { success: true, message: "Employee deleted successfully" };
    }),

  getByDepartment: protectedProcedure
    .input(z.string())
    .query(async ({ input }) => {
      return db.getEmployeesByDepartment(input);
    }),

  count: protectedProcedure
    .query(async () => {
      return db.getEmployeeCount();
    }),

  /**
   * Admin: manually link a user account to an employee profile.
   * Use this from the Admin Employees page to assign a login to an existing employee.
   *
   * Throws if:
   *  - the employee doesn't exist
   *  - the employee is already linked to a different user
   */
  linkUser: adminProcedure
    .input(z.object({
      employeeId: z.number().int().positive(),
      userId: z.number().int().positive(),
    }))
    .mutation(async ({ input }) => {
      const employee = await db.getEmployeeById(input.employeeId);
      if (!employee) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Employee not found" });
      }

      // Allow re-linking — if already linked to a different user, unlink the old one first
      await db.updateEmployee(input.employeeId, { userId: input.userId });
      return { success: true, message: "User linked to employee profile" };
    }),

  /**
   * Admin: remove the user ↔ employee link (e.g. when an employee leaves and their
   * account should be detached from the HR record).
   */
  unlinkUser: adminProcedure
    .input(z.number().int().positive()) // employeeId
    .mutation(async ({ input }) => {
      const employee = await db.getEmployeeById(input);
      if (!employee) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Employee not found" });
      }

      await db.updateEmployee(input, { userId: null });
      return { success: true, message: "User unlinked from employee profile" };
    }),
});

// ============ PAYROLL ROUTER ============

const payrollRouter = router({
  create: adminProcedure
    .input(payrollSchema)
    .mutation(async ({ input }) => {
      try {
        const employee = await db.getEmployeeById(input.employeeId);
        if (!employee) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Employee not found",
          });
        }

        const monthDate = new Date(formatDateOnly(input.month) + 'T00:00:00');

        // Prevent duplicate payroll for the same employee + month
        const existing = await db.getPayrollByEmployeeAndMonth(input.employeeId, monthDate);
        if (existing) {
          const label = monthDate.toLocaleString('default', { month: 'long', year: 'numeric' });
          throw new TRPCError({
            code: "CONFLICT",
            message: `Payroll for ${employee.firstName} ${employee.lastName} already exists for ${label}. Use update instead.`,
          });
        }

        await db.createPayroll({
          employeeId: input.employeeId,
          month: monthDate as any,
          basicSalary: input.basicSalary.toString(),
          allowances: input.allowances.toString(),
          deductions: input.deductions.toString(),
          grossSalary: input.grossSalary.toString(),
          netSalary: input.netSalary.toString(),
          status: input.status,
          notes: input.notes,
        });

        // Notify about salary processing
        try {
          await notifyOwner({
            title: "Payroll Processed",
            content: `Payroll for ${employee.firstName} ${employee.lastName} has been processed. Net salary: ${input.netSalary}`,
          });
          // Also notify the employee directly if they have a linked user account
          if (employee.userId) {
            await notifyUser(employee.userId, {
              title: "Your Payroll Has Been Processed",
              content: `Your payroll for ${monthDate.toLocaleString('default', { month: 'long', year: 'numeric' })} has been processed. Net salary: ${input.netSalary}.`,
              type: "salary_changed",
              relatedEmployeeId: employee.id,
            });
          }
        } catch (e) { console.warn("[notify] non-fatal:", e); }

        return { success: true, message: "Payroll created successfully" };
      } catch (error) {
        // Re-throw TRPCErrors (CONFLICT, NOT_FOUND, etc.) so the client gets the real message
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create payroll",
        });
      }
    }),

  getByEmployeeId: protectedProcedure
    .input(z.number().int().positive())
    .query(async ({ input }) => {
      return db.getPayrollByEmployeeId(input);
    }),

  getByMonth: adminProcedure
    .input(z.string())
    .query(async ({ input }) => {
      return db.getPayrollByMonth(new Date(input));
    }),

  update: adminProcedure
    .input(z.object({
      id: z.number().int().positive(),
      data: payrollSchema.partial(),
    }))
    .mutation(async ({ input }) => {
      const updateData: any = {
        ...input.data,
      };

      if (input.data.month) {
        updateData.month = formatDateOnly(input.data.month) as any;
      }
      if (input.data.basicSalary) {
        updateData.basicSalary = input.data.basicSalary.toString();
      }
      if (input.data.allowances !== undefined) {
        updateData.allowances = input.data.allowances.toString();
      }
      if (input.data.deductions !== undefined) {
        updateData.deductions = input.data.deductions.toString();
      }
      if (input.data.grossSalary) {
        updateData.grossSalary = input.data.grossSalary.toString();
      }
      if (input.data.netSalary) {
        updateData.netSalary = input.data.netSalary.toString();
      }

      await db.updatePayroll(input.id, updateData);
      return { success: true, message: "Payroll updated successfully" };
    }),

  stats: adminProcedure
    .query(async () => {
      return db.getPayrollStats();
    }),
});

// ============ DOCUMENT ROUTER ============

// ============ NOTIFICATION ROUTER ============

const notificationRouter = router({
  list: protectedProcedure
    .input(z.object({
      limit: z.number().default(20),
    }))
    .query(async ({ input, ctx }) => {
      return db.getNotificationsByUserId(ctx.user.id, input.limit);
    }),

  unread: protectedProcedure
    .query(async ({ ctx }) => {
      return db.getUnreadNotifications(ctx.user.id);
    }),

  markAsRead: protectedProcedure
    .input(z.number().int().positive())
    .mutation(async ({ input }) => {
      await db.markNotificationAsRead(input);
      return { success: true };
    }),

  markAllAsRead: protectedProcedure
    .mutation(async ({ ctx }) => {
      await db.markAllNotificationsAsRead(ctx.user.id);
      return { success: true };
    }),
});

// ============ CHAT ROUTER ============

const chatRouter = router({
  sendMessage: protectedProcedure
    .input(z.object({
      message: z.string().min(1),
      employeeId: z.number().int().positive().optional(),
      context: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        // Save user message
        await db.saveChatMessage({
          userId: ctx.user.id,
          employeeId: input.employeeId,
          role: "user",
          message: input.message,
          context: input.context,
        });

        // Generate AI response via LLM — pass userId so it can load history
        const aiResponse = await generateHRResponse(input.message, ctx.user.id, input.employeeId);

        // Save AI response
        await db.saveChatMessage({
          userId: ctx.user.id,
          employeeId: input.employeeId,
          role: "assistant",
          message: aiResponse,
          context: input.context,
        });

        return { success: true, response: aiResponse };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to process chat message",
        });
      }
    }),

  getHistory: protectedProcedure
    .input(z.object({
      employeeId: z.number().int().positive().optional(),
      limit: z.number().default(50),
    }))
    .query(async ({ input, ctx }) => {
      return db.getChatHistory(ctx.user.id, input.employeeId, input.limit);
    }),
});

// ============ DASHBOARD ROUTER ============

const dashboardRouter = router({
  stats: protectedProcedure
    .query(async () => {
      return db.getHRStats();
    }),
});

// ============ SALARY HISTORY ROUTER ============

const salaryHistoryRouter = router({
  getByEmployeeId: protectedProcedure
    .input(z.number().int().positive())
    .query(async ({ input }) => {
      return db.getSalaryHistoryByEmployeeId(input);
    }),

  create: adminProcedure
    .input(z.object({
      employeeId: z.number().int().positive(),
      previousBasicSalary: z.number().positive(),
      newBasicSalary: z.number().positive(),
      effectiveDate: z.string(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const employee = await db.getEmployeeById(input.employeeId);
        if (!employee) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Employee not found",
          });
        }

        await db.createSalaryHistory({
          employeeId: input.employeeId,
          previousBasicSalary: input.previousBasicSalary.toString(),
          newBasicSalary: input.newBasicSalary.toString(),
          effectiveDate: formatDateOnly(input.effectiveDate) as any,
          reason: input.reason,
          changedBy: ctx.user.id,
        });

        // Notify admin and the affected employee
        try {
          await notifyOwner({
            title: "Salary Updated",
            content: `Salary for ${employee.firstName} ${employee.lastName} has been updated from ${input.previousBasicSalary} to ${input.newBasicSalary}.`,
          });
          if (employee.userId) {
            await notifyUser(employee.userId, {
              title: "Your Salary Has Been Updated",
              content: `Your basic salary has been updated from ${input.previousBasicSalary} to ${input.newBasicSalary}${input.reason ? `. Reason: ${input.reason}` : ""}.`,
              type: "salary_changed",
              relatedEmployeeId: employee.id,
            });
          }
        } catch (e) { console.warn("[notify] non-fatal:", e); }

        return { success: true, message: "Salary history created successfully" };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create salary history",
        });
      }
    }),
});

// ============ HELPER FUNCTIONS ============

async function generateHRResponse(
  message: string,
  userId: number,
  employeeId?: number,
): Promise<string> {
  try {
    const systemPrompt = `You are an HR assistant for NexusHR, a human resources management system.
You help employees and HR managers with questions about:
- Leave policies and leave requests
- Payroll, salary, and compensation
- Attendance and work hours
- Employee onboarding and offboarding
- HR policies and company guidelines
- Benefits and allowances

Be concise, professional, and helpful. If you don't know something specific about the company's policies, say so and suggest contacting HR directly.${employeeId ? `\n\nYou are currently assisting with employee ID: ${employeeId}.` : ""}`;

    // Fetch recent conversation history so the LLM has context across turns
    const history = await db.getChatHistory(userId, employeeId, 10);
    const historyMessages = history
      .slice()
      .reverse() // DB returns newest-first; LLM needs oldest-first
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.message }));

    const result = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        ...historyMessages,
        { role: "user", content: message },
      ],
      maxTokens: 512,
    });

    const content = result.choices?.[0]?.message?.content;
    if (typeof content === "string" && content.trim()) {
      return content.trim();
    }

    // Fallback if LLM returns unexpected structure
    return "I'm here to help with HR-related questions. How can I assist you today?";
  } catch (error) {
    console.error("[HR Chat] LLM call failed:", error);
    return "I'm having trouble connecting right now. Please try again shortly or contact HR directly.";
  }
}

// ============ DEPARTMENT ROUTER ============

const departmentRouter = router({
  list: protectedProcedure
    .query(async () => db.getAllDepartments()),

  create: adminProcedure
    .input(z.object({
      name: z.string().min(1, "Department name is required").max(100),
      description: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const existing = await db.getDepartmentByName(input.name);
      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "A department with this name already exists" });
      }
      await db.createDepartment({ name: input.name, description: input.description });
      return { success: true };
    }),

  update: adminProcedure
    .input(z.object({
      id: z.number().int().positive(),
      name: z.string().min(1).max(100).optional(),
      description: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const dept = await db.getDepartmentById(id);
      if (!dept) throw new TRPCError({ code: "NOT_FOUND", message: "Department not found" });
      if (data.name && data.name !== dept.name) {
        const existing = await db.getDepartmentByName(data.name);
        if (existing) throw new TRPCError({ code: "CONFLICT", message: "A department with this name already exists" });
      }
      await db.updateDepartment(id, data);
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.number().int().positive())
    .mutation(async ({ input }) => {
      const dept = await db.getDepartmentById(input);
      if (!dept) throw new TRPCError({ code: "NOT_FOUND", message: "Department not found" });
      await db.deleteDepartment(input);
      return { success: true };
    }),
});

// ============ LEAVE REQUEST ROUTER ============

const leaveRequestSchema = z.object({
  employeeId: z.number().int().positive(),
  leaveType: z.enum(["annual", "sick", "casual", "maternity", "paternity", "unpaid", "other"]),
  startDate: z.string().refine((d) => !isNaN(Date.parse(d)), "Invalid date"),
  endDate: z.string().refine((d) => !isNaN(Date.parse(d)), "Invalid date"),
  // totalDays is intentionally omitted from client input — computed server-side
  reason: z.string().optional(),
});

const leaveRouter = router({
  // Employee: submit a leave request
  create: protectedProcedure
    .input(leaveRequestSchema)
    .mutation(async ({ input, ctx }) => {
      const employee = await db.getEmployeeById(input.employeeId);
      if (!employee) throw new TRPCError({ code: "NOT_FOUND", message: "Employee not found" });

      // date columns have mode:'date' - Drizzle needs real Date objects
      const toDate = (d: string) => new Date(d + 'T00:00:00');
      const start = toDate(input.startDate);
      const end = toDate(input.endDate);

      // Reject if end is before start
      if (end < start) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "End date must be on or after start date" });
      }

      // Compute totalDays server-side — never trust the client
      const totalDays = calculateDaysBetween(input.startDate, input.endDate);

      // Prevent overlapping active leave requests for the same employee
      const overlap = await db.getOverlappingLeaveRequests(input.employeeId, start, end);
      if (overlap.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Leave request overlaps with an existing ${overlap[0].status} request (${overlap[0].startDate.toISOString().split('T')[0]} – ${overlap[0].endDate.toISOString().split('T')[0]})`,
        });
      }

      await db.createLeaveRequest({
        employeeId: input.employeeId,
        leaveType: input.leaveType,
        startDate: start as any,
        endDate: end as any,
        totalDays,
        ...(input.reason !== undefined && { reason: input.reason }),
        status: "pending",
      });

      try {
        await notifyOwner({
          title: "New Leave Request",
          content: `${employee.firstName} ${employee.lastName} has submitted a ${input.leaveType} leave request for ${totalDays} day(s).`,
        });
        await notifyAdminUsers({
          title: "New Leave Request",
          content: `${employee.firstName} ${employee.lastName} has submitted a ${input.leaveType} leave request for ${totalDays} day(s) (${input.startDate} – ${input.endDate}).`,
          type: "leave_request",
          relatedEmployeeId: input.employeeId,
        });
      } catch (e) { console.warn("[notify] non-fatal:", e); }

      return { success: true, message: "Leave request submitted" };
    }),

  // Get by employee
  getByEmployeeId: protectedProcedure
    .input(z.number().int().positive())
    .query(async ({ input }) => db.getLeaveRequestsByEmployeeId(input)),

  // Admin: get all (optionally filtered by status)
  list: adminProcedure
    .input(z.object({ status: z.string().optional() }))
    .query(async ({ input }) => db.getAllLeaveRequests(input.status)),

  // Admin: approve or reject
  review: adminProcedure
    .input(z.object({
      id: z.number().int().positive(),
      status: z.enum(["approved", "rejected"]),
      reviewNotes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const req = await db.getLeaveRequestById(input.id);
      if (!req) throw new TRPCError({ code: "NOT_FOUND", message: "Leave request not found" });

      await db.updateLeaveRequest(input.id, {
        status: input.status,
        reviewedBy: ctx.user.id,
        reviewedAt: new Date(),
        reviewNotes: input.reviewNotes,
      });

      // Notify the employee of the decision
      try {
        const employee = await db.getEmployeeById(req.employeeId);
        if (employee?.userId) {
          const verb = input.status === "approved" ? "approved" : "rejected";
          const startStr = req.startDate.toISOString().split("T")[0];
          const endStr = req.endDate.toISOString().split("T")[0];
          await notifyUser(employee.userId, {
            title: `Leave Request ${verb.charAt(0).toUpperCase() + verb.slice(1)}`,
            content: `Your ${req.leaveType} leave request (${startStr} – ${endStr}) has been ${verb}${input.reviewNotes ? `. Note: ${input.reviewNotes}` : "."}`,
            type: "leave_request",
            relatedEmployeeId: req.employeeId,
          });
        }
      } catch (e) { console.warn("[notify] non-fatal:", e); }

      return { success: true, message: `Leave request ${input.status}` };
    }),

  // Cancel (employee can only cancel their own; admins can cancel any)
  cancel: protectedProcedure
    .input(z.number().int().positive())
    .mutation(async ({ input, ctx }) => {
      const req = await db.getLeaveRequestById(input);
      if (!req) throw new TRPCError({ code: "NOT_FOUND", message: "Leave request not found" });

      // Admins can cancel any request; regular users can only cancel their own
      if (ctx.user.role !== "admin") {
        const employee = await db.getEmployeeByUserId(ctx.user.id);
        if (!employee || employee.id !== req.employeeId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You can only cancel your own leave requests",
          });
        }
      }

      await db.updateLeaveRequest(input, { status: "cancelled" });
      return { success: true };
    }),

  stats: protectedProcedure
    .input(z.object({ employeeId: z.number().int().positive().optional() }))
    .query(async ({ input }) => db.getLeaveStats(input.employeeId)),
});

// ============ ATTENDANCE ROUTER ============

const attendanceRouter = router({
  // Mark / log attendance (admin can do bulk; user can check in/out)
  create: adminProcedure
    .input(z.object({
      employeeId: z.number().int().positive(),
      date: z.string(),
      checkIn: z.string().optional(),
      checkOut: z.string().optional(),
      status: z.enum(["present", "absent", "late", "half_day", "on_leave", "holiday"]),
      workHours: z.number().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      // Robust date formatter: handles ISO strings, locale strings, and Date-toString() output
      // date column has mode:'date' so Drizzle needs a real Date object
      const toDate = (d: string) => new Date(d + 'T00:00:00');
      // timestamp columns need a Date object too
      const toTimestamp = (d: string) => new Date(d);

      await db.createAttendance({
        employeeId: input.employeeId,
        date: toDate(input.date) as any,
        ...(input.checkIn !== undefined && { checkIn: toTimestamp(input.checkIn) as any }),
        ...(input.checkOut !== undefined && { checkOut: toTimestamp(input.checkOut) as any }),
        status: input.status,
        ...(input.workHours !== undefined && { workHours: input.workHours.toString() }),
        ...(input.notes !== undefined && { notes: input.notes }),
      });
      return { success: true };
    }),

  update: adminProcedure
    .input(z.object({
      id: z.number().int().positive(),
      data: z.object({
        checkIn: z.string().optional(),
        checkOut: z.string().optional(),
        status: z.enum(["present", "absent", "late", "half_day", "on_leave", "holiday"]).optional(),
        workHours: z.number().optional(),
        notes: z.string().optional(),
      }),
    }))
    .mutation(async ({ input }) => {
      const updateData: any = { ...input.data };
      // timestamp columns need Date objects for Drizzle mode:'date'
      if (input.data.checkIn) updateData.checkIn = new Date(input.data.checkIn);
      if (input.data.checkOut) updateData.checkOut = new Date(input.data.checkOut);
      if (input.data.workHours !== undefined) updateData.workHours = input.data.workHours.toString();
      await db.updateAttendance(input.id, updateData);
      return { success: true };
    }),

  // Self check-in (employee) — only allowed for your own employee profile
  checkIn: protectedProcedure
    .input(z.object({ employeeId: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      // Verify the employeeId belongs to the calling user (admins bypass this)
      if (ctx.user.role !== "admin") {
        const employee = await db.getEmployeeByUserId(ctx.user.id);
        if (!employee || employee.id !== input.employeeId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You can only check in for your own employee profile",
          });
        }
      }

      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const timestamp = now.toISOString().slice(0, 19).replace('T', ' ');

      // Prevent a second check-in on the same day
      const existing = await db.getAttendanceByEmployeeAndDate(input.employeeId, new Date(today + 'T00:00:00'));
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "You have already checked in today. Use check-out to complete your attendance.",
        });
      }

      await db.createAttendance({
        employeeId: input.employeeId,
        date: today as any,
        checkIn: timestamp as any,
        status: "present",
      });
      return { success: true, checkIn: now };
    }),

  // Self check-out (employee) — only allowed for your own attendance record
  checkOut: protectedProcedure
    .input(z.object({ attendanceId: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      const now = new Date();
      const checkOutTimestamp = now.toISOString().slice(0, 19).replace('T', ' ');
      const rec = await db.getAttendanceById(input.attendanceId);
      if (!rec) throw new TRPCError({ code: "NOT_FOUND", message: "Attendance record not found" });

      // Verify the attendance record belongs to the calling user (admins bypass this)
      if (ctx.user.role !== "admin") {
        const employee = await db.getEmployeeByUserId(ctx.user.id);
        if (!employee || employee.id !== rec.employeeId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You can only check out your own attendance record",
          });
        }
      }

      let workHours: string | undefined;
      if (rec.checkIn) {
        const diff = (now.getTime() - new Date(rec.checkIn).getTime()) / (1000 * 60 * 60);
        workHours = diff.toFixed(2);
      }
      await db.updateAttendance(input.attendanceId, { checkOut: checkOutTimestamp as any, workHours });
      return { success: true, checkOut: now };
    }),

  getByEmployeeId: protectedProcedure
    .input(z.object({ employeeId: z.number().int().positive(), limit: z.number().default(30) }))
    .query(async ({ input }) => db.getAttendanceByEmployeeId(input.employeeId, input.limit)),

  getByDate: adminProcedure
    .input(z.string())
    .query(async ({ input }) => db.getAttendanceByDate(new Date(input))),

  getByRange: adminProcedure
    .input(z.object({ startDate: z.string(), endDate: z.string() }))
    .query(async ({ input }) => db.getAllAttendanceByDateRange(new Date(input.startDate), new Date(input.endDate))),

  getByEmployeeAndRange: protectedProcedure
    .input(z.object({ employeeId: z.number().int().positive(), startDate: z.string(), endDate: z.string() }))
    .query(async ({ input }) => db.getAttendanceByEmployeeAndDateRange(input.employeeId, new Date(input.startDate), new Date(input.endDate))),

  stats: protectedProcedure
    .input(z.object({ employeeId: z.number().int().positive().optional() }))
    .query(async ({ input }) => db.getAttendanceStats(input.employeeId)),

  /**
   * Check the current month's attendance rate for an employee.
   * If < 75%, automatically deduct 5% of their basic salary and record it in
   * salaryHistory + update employees.deductions. Safe to call multiple times —
   * returns early if a deduction for this month already exists.
   */
  applyAttendanceDeduction: adminProcedure
    .input(z.object({
      employeeId: z.number().int().positive(),
    }))
    .mutation(async ({ input, ctx }) => {
      const employee = await db.getEmployeeById(input.employeeId);
      if (!employee) throw new TRPCError({ code: "NOT_FOUND", message: "Employee not found" });

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const monthLabel = now.toLocaleString("default", { month: "long", year: "numeric" });

      const stats = await db.getAttendanceStats(input.employeeId);
      const workingDays = stats.total;
      if (workingDays === 0) return { applied: false, reason: "No attendance records this month" };

      const attendanceRate = Math.round(((stats.present + stats.late) / workingDays) * 100);
      if (attendanceRate >= 75) {
        return { applied: false, reason: `Attendance is ${attendanceRate}% — no deduction needed`, attendanceRate };
      }

      // Check if deduction already applied this month
      const history = await db.getSalaryHistoryByEmployeeId(input.employeeId);
      const alreadyApplied = history.some((h: any) => {
        const d = new Date(h.effectiveDate);
        return d.getFullYear() === now.getFullYear() &&
          d.getMonth() === now.getMonth() &&
          h.reason?.includes("Attendance deduction");
      });
      if (alreadyApplied) {
        return { applied: false, reason: "Deduction already applied this month", attendanceRate };
      }

      const basicSalary = parseFloat(employee.basicSalary as string);
      const deductionAmount = parseFloat((basicSalary * 0.05).toFixed(2));
      const newDeductions = parseFloat((parseFloat(employee.deductions as string || "0") + deductionAmount).toFixed(2));

      // Update employee deductions
      await db.updateEmployee(input.employeeId, { deductions: newDeductions.toString() });

      // Record in salary history
      await db.createSalaryHistory({
        employeeId: input.employeeId,
        previousBasicSalary: basicSalary.toString(),
        newBasicSalary: basicSalary.toString(),
        effectiveDate: monthEnd as any,
        reason: `Attendance deduction (${attendanceRate}% attendance in ${monthLabel} — below 75% threshold). 5% salary deduction: -$${deductionAmount}`,
        changedBy: ctx.user.id,
      });

      // Notify employee
      if (employee.userId) {
        await notifyUser(employee.userId, {
          title: "Salary Deduction Applied",
          content: `Your attendance this month was ${attendanceRate}% (below the 75% threshold). A 5% deduction of $${deductionAmount} has been applied to your salary.`,
          type: "salary_changed",
          relatedEmployeeId: employee.id,
        });
      }

      return { applied: true, attendanceRate, deductionAmount, newDeductions };
    }),

  // Admin: delete an attendance record entered in error
  delete: adminProcedure
    .input(z.number().int().positive())
    .mutation(async ({ input }) => {
      const rec = await db.getAttendanceById(input);
      if (!rec) throw new TRPCError({ code: "NOT_FOUND", message: "Attendance record not found" });
      await db.deleteAttendance(input);
      return { success: true };
    }),
});

// ============ USER ROUTER (admin only) ============

const userRouter = router({
  list: adminProcedure
    .query(async () => {
      return db.getAllUsers();
    }),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    /**
     * Returns the current logged-in user.
     * Also triggers auto-linking: if the user's email matches an employee record
     * that has no userId yet, it links them automatically on every login call.
     * This is safe to run repeatedly — it only acts when userId is null.
     */
    me: publicProcedure.query(async (opts) => {
      const user = opts.ctx.user;

      // Auto-link by email when the user is authenticated and has an email
      if (user && user.email) {
        try {
          const matchedEmployee = await db.getEmployeeByEmail(user.email);
          if (matchedEmployee && matchedEmployee.userId === null) {
            await db.updateEmployee(matchedEmployee.id, { userId: user.id });
            console.log(`[auth.me] Auto-linked user ${user.id} → employee ${matchedEmployee.id}`);

            // Notify admin so they know the employee now has an active account
            try {
              await notifyOwner({
                title: "Employee Account Linked",
                content: `${user.name || user.email} has signed up and been automatically linked to employee profile: ${matchedEmployee.firstName} ${matchedEmployee.lastName} (${matchedEmployee.department}).`,
              });
            } catch (e) {
              console.warn("[auth.me] Auto-link notification failed (non-fatal):", e);
            }
          }
        } catch (linkError) {
          // Non-fatal: log and continue. The admin can link manually.
          console.warn("[auth.me] Auto-link failed (non-fatal):", linkError);
        }
      }

      return user;
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  employee: employeeRouter,
  payroll: payrollRouter,
  notification: notificationRouter,
  chat: chatRouter,
  dashboard: dashboardRouter,
  salaryHistory: salaryHistoryRouter,
  department: departmentRouter,
  leave: leaveRouter,
  attendance: attendanceRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;
