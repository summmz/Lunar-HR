import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Calendar, Plus, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  approved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  cancelled: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
};

const STATUS_ICON: Record<string, any> = {
  pending: Clock,
  approved: CheckCircle,
  rejected: XCircle,
  cancelled: AlertCircle,
};

const LEAVE_TYPES = [
  { value: "annual", label: "Annual Leave" },
  { value: "sick", label: "Sick Leave" },
  { value: "casual", label: "Casual Leave" },
  { value: "maternity", label: "Maternity Leave" },
  { value: "paternity", label: "Paternity Leave" },
  { value: "unpaid", label: "Unpaid Leave" },
  { value: "other", label: "Other" },
];

function calculateDays(start: string, end: string): number {
  if (!start || !end) return 0;
  const s = new Date(start);
  const e = new Date(end);
  const diff = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  return diff > 0 ? diff : 0;
}

export default function UserLeave() {
  const [applyDialog, setApplyDialog] = useState(false);
  const [form, setForm] = useState({
    leaveType: "annual",
    startDate: "",
    endDate: "",
    reason: "",
  });

  // Use the dedicated endpoint — no need to load the entire employee list
  const { data: myEmployee } = trpc.employee.myEmployee.useQuery();

  const { data: leaveRequests = [], isLoading, refetch } = trpc.leave.getByEmployeeId.useQuery(
    myEmployee?.id ?? 0,
    { enabled: !!myEmployee?.id }
  );

  const { data: stats } = trpc.leave.stats.useQuery(
    { employeeId: myEmployee?.id },
    { enabled: !!myEmployee?.id }
  );

  const createMutation = trpc.leave.create.useMutation({
    onSuccess: () => {
      toast.success("Leave request submitted successfully");
      setApplyDialog(false);
      setForm({ leaveType: "annual", startDate: "", endDate: "", reason: "" });
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const cancelMutation = trpc.leave.cancel.useMutation({
    onSuccess: () => { toast.success("Leave request cancelled"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const totalDays = calculateDays(form.startDate, form.endDate);

  const submitApply = () => {
    if (!myEmployee) return toast.error("Your employee profile was not found");
    if (!form.startDate || !form.endDate) return toast.error("Please select dates");
    if (totalDays <= 0) return toast.error("End date must be after start date");

    createMutation.mutate({
      employeeId: myEmployee.id,
      leaveType: form.leaveType as any,
      startDate: form.startDate,
      endDate: form.endDate,
      // totalDays is now computed server-side — not sent from client
      reason: form.reason || undefined,
    });
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Leave & Time Off</h1>
          <p className="text-sm text-muted-foreground mt-1">Apply for leave and track your requests</p>
        </div>
        <Button onClick={() => setApplyDialog(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Apply for Leave
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Pending", value: stats?.pending ?? 0, icon: Clock, color: "text-yellow-500" },
          { label: "Approved", value: stats?.approved ?? 0, icon: CheckCircle, color: "text-green-500" },
          { label: "Rejected", value: stats?.rejected ?? 0, icon: XCircle, color: "text-red-500" },
          { label: "Total", value: stats?.total ?? 0, icon: Calendar, color: "text-blue-500" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-2xl font-bold mt-1">{s.value}</p>
                </div>
                <s.icon className={`h-7 w-7 ${s.color} opacity-80`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Leave History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">My Leave Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {!myEmployee ? (
            <div className="text-center py-10 text-muted-foreground">
              <AlertCircle className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No employee profile linked to your account.</p>
              <p className="text-xs mt-1">Contact your HR admin to set up your profile.</p>
            </div>
          ) : isLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : leaveRequests.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No leave requests yet</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => setApplyDialog(true)}>
                Apply for Leave
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {leaveRequests.map((req: any) => {
                const StatusIcon = STATUS_ICON[req.status] ?? Clock;
                return (
                  <div
                    key={req.id}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-lg border hover:bg-accent/20 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Calendar className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm capitalize">
                          {LEAVE_TYPES.find(t => t.value === req.leaveType)?.label ?? req.leaveType}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatDate(req.startDate)} → {formatDate(req.endDate)} · {req.totalDays} day{req.totalDays > 1 ? "s" : ""}
                        </p>
                        {req.reason && (
                          <p className="text-xs text-muted-foreground mt-0.5 italic">"{req.reason}"</p>
                        )}
                        {req.reviewNotes && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            HR Note: {req.reviewNotes}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[req.status]}`}>
                        <StatusIcon className="h-3 w-3" />
                        {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                      </span>
                      {req.status === "pending" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => cancelMutation.mutate(req.id)}
                          disabled={cancelMutation.isPending}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Apply Dialog */}
      <Dialog open={applyDialog} onOpenChange={setApplyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply for Leave</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Leave Type</label>
              <Select value={form.leaveType} onValueChange={(v) => setForm({ ...form, leaveType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LEAVE_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Date</label>
                <Input
                  type="date"
                  value={form.startDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">End Date</label>
                <Input
                  type="date"
                  value={form.endDate}
                  min={form.startDate || new Date().toISOString().split("T")[0]}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                />
              </div>
            </div>
            {totalDays > 0 && (
              <p className="text-sm text-muted-foreground">
                Duration: <span className="font-medium text-foreground">{totalDays} day{totalDays > 1 ? "s" : ""}</span>
              </p>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">Reason (optional)</label>
              <Textarea
                placeholder="Briefly describe the reason for your leave..."
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApplyDialog(false)}>Cancel</Button>
            <Button onClick={submitApply} disabled={createMutation.isPending || totalDays <= 0}>
              {createMutation.isPending ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
