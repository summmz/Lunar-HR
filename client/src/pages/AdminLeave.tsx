import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import {
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  User,
} from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  approved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  cancelled: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
};

const LEAVE_TYPE_LABELS: Record<string, string> = {
  annual: "Annual",
  sick: "Sick",
  casual: "Casual",
  maternity: "Maternity",
  paternity: "Paternity",
  unpaid: "Unpaid",
  other: "Other",
};

type LeaveRequest = {
  id: number;
  employeeId: number;
  leaveType: string;
  startDate: Date | string;
  endDate: Date | string;
  totalDays: number;
  reason?: string | null;
  status: string;
  reviewNotes?: string | null;
  createdAt: Date | string;
};

export default function AdminLeave() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [reviewDialog, setReviewDialog] = useState<{
    open: boolean;
    request: LeaveRequest | null;
    action: "approved" | "rejected" | null;
  }>({ open: false, request: null, action: null });
  const [reviewNotes, setReviewNotes] = useState("");

  const { data: leaveRequests = [], isLoading, refetch } = trpc.leave.list.useQuery(
    { status: statusFilter === "all" ? undefined : statusFilter },
    { refetchOnWindowFocus: false }
  );

  const { data: stats } = trpc.leave.stats.useQuery({ employeeId: undefined });
  const { data: employees = [] } = trpc.employee.list.useQuery({ limit: 200, offset: 0 });

  const reviewMutation = trpc.leave.review.useMutation({
    onSuccess: () => {
      toast.success(`Leave request ${reviewDialog.action}`);
      setReviewDialog({ open: false, request: null, action: null });
      setReviewNotes("");
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const getEmployeeName = (id: number) => {
    const emp = employees.find((e: any) => e.id === id);
    return emp ? `${emp.firstName} ${emp.lastName}` : `Employee #${id}`;
  };

  const openReview = (request: LeaveRequest, action: "approved" | "rejected") => {
    setReviewDialog({ open: true, request, action });
    setReviewNotes("");
  };

  const submitReview = () => {
    if (!reviewDialog.request || !reviewDialog.action) return;
    reviewMutation.mutate({
      id: reviewDialog.request.id,
      status: reviewDialog.action,
      reviewNotes,
    });
  };

  const formatDate = (d: string | Date) =>
    new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Leave Management</h1>
        <p className="text-sm text-muted-foreground mt-1">Review and manage employee leave requests</p>
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
                <s.icon className={`h-8 w-8 ${s.color} opacity-80`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Requests</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Leave Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Leave Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : leaveRequests.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No leave requests found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {leaveRequests.map((req: LeaveRequest) => (
                <div
                  key={req.id}
                  className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-lg border bg-card hover:bg-accent/30 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{getEmployeeName(req.employeeId)}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {LEAVE_TYPE_LABELS[req.leaveType] ?? req.leaveType} · {req.totalDays} day{req.totalDays > 1 ? "s" : ""}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(req.startDate)} → {formatDate(req.endDate)}
                      </p>
                      {req.reason && (
                        <p className="text-xs text-muted-foreground mt-1 italic">"{req.reason}"</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[req.status] ?? ""}`}>
                      {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                    </span>
                    {req.status === "pending" && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-900/20"
                          onClick={() => openReview(req, "approved")}
                        >
                          <CheckCircle className="h-3.5 w-3.5 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/20"
                          onClick={() => openReview(req, "rejected")}
                        >
                          <XCircle className="h-3.5 w-3.5 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                    {req.reviewNotes && (
                      <p className="text-xs text-muted-foreground max-w-[180px] truncate" title={req.reviewNotes}>
                        Note: {req.reviewNotes}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={reviewDialog.open} onOpenChange={(o) => !o && setReviewDialog({ open: false, request: null, action: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewDialog.action === "approved" ? "Approve" : "Reject"} Leave Request
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {reviewDialog.request && (
              <div className="rounded-lg border p-4 bg-muted/30 space-y-1.5 text-sm">
                <p><span className="text-muted-foreground">Employee:</span> {getEmployeeName(reviewDialog.request.employeeId)}</p>
                <p><span className="text-muted-foreground">Type:</span> {LEAVE_TYPE_LABELS[reviewDialog.request.leaveType]}</p>
                <p><span className="text-muted-foreground">Duration:</span> {reviewDialog.request.totalDays} day(s) · {formatDate(reviewDialog.request.startDate)} → {formatDate(reviewDialog.request.endDate)}</p>
                {reviewDialog.request.reason && <p><span className="text-muted-foreground">Reason:</span> {reviewDialog.request.reason}</p>}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">Review Notes (optional)</label>
              <Textarea
                placeholder="Add a note for the employee..."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialog({ open: false, request: null, action: null })}>
              Cancel
            </Button>
            <Button
              onClick={submitReview}
              disabled={reviewMutation.isPending}
              className={reviewDialog.action === "approved" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
            >
              {reviewMutation.isPending ? "Saving..." : reviewDialog.action === "approved" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
