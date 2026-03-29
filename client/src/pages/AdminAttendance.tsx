import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Clock, Users, TrendingUp, Plus, Pencil } from "lucide-react";

const STATUS_STYLES: Record<string, string> = {
  present: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  absent: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  late: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  half_day: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  on_leave: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  holiday: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
};

const STATUS_LABELS: Record<string, string> = {
  present: "Present",
  absent: "Absent",
  late: "Late",
  half_day: "Half Day",
  on_leave: "On Leave",
  holiday: "Holiday",
};

export default function AdminAttendance() {
  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [logDialog, setLogDialog] = useState(false);
  const [editDialog, setEditDialog] = useState<{ open: boolean; record: any | null }>({ open: false, record: null });

  const [logForm, setLogForm] = useState({
    employeeId: "",
    date: today,
    checkIn: "",
    checkOut: "",
    status: "present" as const,
    workHours: "",
    notes: "",
  });

  const [editForm, setEditForm] = useState({
    checkIn: "",
    checkOut: "",
    status: "present" as string,
    workHours: "",
    notes: "",
  });

  const { data: employees = [] } = trpc.employee.list.useQuery({ limit: 200, offset: 0 });
  const { data: attendanceList = [], isLoading, refetch } = trpc.attendance.getByDate.useQuery(selectedDate);
  const { data: stats } = trpc.attendance.stats.useQuery({ employeeId: undefined });

  const createMutation = trpc.attendance.create.useMutation({
    onSuccess: () => { toast.success("Attendance logged"); setLogDialog(false); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.attendance.update.useMutation({
    onSuccess: () => { toast.success("Attendance updated"); setEditDialog({ open: false, record: null }); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const deductionMutation = trpc.attendance.applyAttendanceDeduction.useMutation({
    onSuccess: (res) => {
      if (res.applied) {
        toast.success(`Deduction applied: ${res.attendanceRate}% attendance → -$${res.deductionAmount} deducted`);
      } else {
        toast.info(res.reason ?? "No deduction needed");
      }
    },
    onError: (e) => toast.error(e.message),
  });

  const getEmployeeName = (id: number) => {
    const emp = employees.find((e: any) => e.id === id);
    return emp ? `${emp.firstName} ${emp.lastName}` : `Employee #${id}`;
  };

  const submitLog = () => {
    createMutation.mutate({
      employeeId: parseInt(logForm.employeeId),
      date: logForm.date,
      checkIn: logForm.checkIn ? `${logForm.date}T${logForm.checkIn}:00` : undefined,
      checkOut: logForm.checkOut ? `${logForm.date}T${logForm.checkOut}:00` : undefined,
      status: logForm.status,
      workHours: logForm.workHours ? parseFloat(logForm.workHours) : undefined,
      notes: logForm.notes || undefined,
    });
  };

  const openEdit = (record: any) => {
    setEditForm({
      checkIn: record.checkIn ? new Date(record.checkIn).toTimeString().slice(0, 5) : "",
      checkOut: record.checkOut ? new Date(record.checkOut).toTimeString().slice(0, 5) : "",
      status: record.status,
      workHours: record.workHours ?? "",
      notes: record.notes ?? "",
    });
    setEditDialog({ open: true, record });
  };

  const submitEdit = () => {
    if (!editDialog.record) return;
    const dateStr = editDialog.record.date.split("T")[0];
    updateMutation.mutate({
      id: editDialog.record.id,
      data: {
        checkIn: editForm.checkIn ? `${dateStr}T${editForm.checkIn}:00` : undefined,
        checkOut: editForm.checkOut ? `${dateStr}T${editForm.checkOut}:00` : undefined,
        status: editForm.status as any,
        workHours: editForm.workHours ? parseFloat(editForm.workHours) : undefined,
        notes: editForm.notes || undefined,
      },
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Attendance Tracking</h1>
          <p className="text-sm text-muted-foreground mt-1">Monitor daily attendance records</p>
        </div>
        <Button onClick={() => setLogDialog(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Log Attendance
        </Button>
      </div>

      {/* Stats (current month) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Present", value: stats?.present ?? 0, color: "text-green-500" },
          { label: "Absent", value: stats?.absent ?? 0, color: "text-red-500" },
          { label: "Late", value: stats?.late ?? 0, color: "text-yellow-500" },
          { label: "Half Day", value: stats?.halfDay ?? 0, color: "text-blue-500" },
          { label: "On Leave", value: stats?.onLeave ?? 0, color: "text-purple-500" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-5 pb-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-muted-foreground mt-1">This month</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Monthly Deduction Panel */}
      <Card className="card-scandinavian border-amber-500/20 bg-amber-500/5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-foreground">Monthly Attendance Deductions</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Employees with less than 75% attendance this month get a 5% salary deduction applied automatically.
              Run per-employee or for all at once.
            </p>
          </div>
          <Button
            variant="outline"
            className="border-amber-500/40 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 shrink-0 gap-2"
            disabled={deductionMutation.isPending || employees.length === 0}
            onClick={async () => {
              let applied = 0;
              let skipped = 0;
              for (const emp of employees) {
                const res = await deductionMutation.mutateAsync({ employeeId: emp.id }).catch(() => null);
                if (res?.applied) applied++;
                else skipped++;
              }
              toast.success(`Done — ${applied} deduction(s) applied, ${skipped} skipped`);
            }}
          >
            <TrendingUp className="w-4 h-4" />
            Run for All Employees
          </Button>
        </div>

        {/* Per-employee rows */}
        {employees.length > 0 && (
          <div className="mt-4 space-y-2">
            {employees.slice(0, 10).map((emp: any) => (
              <div key={emp.id} className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border">
                <div>
                  <p className="text-sm font-medium text-foreground">{emp.firstName} {emp.lastName}</p>
                  <p className="text-xs text-muted-foreground">{emp.department} · ${parseFloat(emp.basicSalary).toLocaleString()} basic</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs text-amber-700 dark:text-amber-400 hover:bg-amber-500/10"
                  disabled={deductionMutation.isPending}
                  onClick={() => deductionMutation.mutate({ employeeId: emp.id })}
                >
                  Check & Apply
                </Button>
              </div>
            ))}
            {employees.length > 10 && (
              <p className="text-xs text-muted-foreground text-center pt-1">+ {employees.length - 10} more — use "Run for All" above</p>
            )}
          </div>
        )}
      </Card>

      {/* Date Picker + Table */}
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-4 pb-4">
          <CardTitle className="text-base">Daily Records</CardTitle>
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-44"
            max={today}
          />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : attendanceList.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No attendance records for this date</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground border-b">
                    <th className="pb-3 font-medium">Employee</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Check In</th>
                    <th className="pb-3 font-medium">Check Out</th>
                    <th className="pb-3 font-medium">Hours</th>
                    <th className="pb-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {attendanceList.map((rec: any) => (
                    <tr key={rec.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 font-medium">{getEmployeeName(rec.employeeId)}</td>
                      <td className="py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[rec.status]}`}>
                          {STATUS_LABELS[rec.status]}
                        </span>
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {rec.checkIn ? new Date(rec.checkIn).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—"}
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {rec.checkOut ? new Date(rec.checkOut).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—"}
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {rec.workHours ? `${rec.workHours}h` : "—"}
                      </td>
                      <td className="py-3">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(rec)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log Dialog */}
      <Dialog open={logDialog} onOpenChange={setLogDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Log Attendance</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Employee</label>
              <Select value={logForm.employeeId} onValueChange={(v) => setLogForm({ ...logForm, employeeId: v })}>
                <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent>
                  {employees.map((e: any) => (
                    <SelectItem key={e.id} value={String(e.id)}>{e.firstName} {e.lastName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Date</label>
                <Input type="date" value={logForm.date} onChange={(e) => setLogForm({ ...logForm, date: e.target.value })} max={today} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={logForm.status} onValueChange={(v) => setLogForm({ ...logForm, status: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_LABELS).map(([v, l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Check In</label>
                <Input type="time" value={logForm.checkIn} onChange={(e) => setLogForm({ ...logForm, checkIn: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Check Out</label>
                <Input type="time" value={logForm.checkOut} onChange={(e) => setLogForm({ ...logForm, checkOut: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes</label>
              <Input placeholder="Optional notes" value={logForm.notes} onChange={(e) => setLogForm({ ...logForm, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLogDialog(false)}>Cancel</Button>
            <Button onClick={submitLog} disabled={createMutation.isPending || !logForm.employeeId}>
              {createMutation.isPending ? "Saving..." : "Log Attendance"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialog.open} onOpenChange={(o) => !o && setEditDialog({ open: false, record: null })}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Attendance Record</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Check In</label>
                <Input type="time" value={editForm.checkIn} onChange={(e) => setEditForm({ ...editForm, checkIn: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Check Out</label>
                <Input type="time" value={editForm.checkOut} onChange={(e) => setEditForm({ ...editForm, checkOut: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes</label>
              <Input placeholder="Optional notes" value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog({ open: false, record: null })}>Cancel</Button>
            <Button onClick={submitEdit} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
