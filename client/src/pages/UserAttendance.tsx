import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Clock, AlertCircle, LogIn, LogOut } from "lucide-react";
import { toast } from "sonner";

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

// SVG ring chart component
function RingChart({
  value,
  total,
  color,
  label,
  sublabel,
  warn,
}: {
  value: number;
  total: number;
  color: string;
  label: string;
  sublabel: string;
  warn?: boolean;
}) {
  const r = 34;
  const circ = 2 * Math.PI * r;
  const pct = total > 0 ? Math.min(value / total, 1) : 0;
  const dash = pct * circ;
  const displayPct = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-20 h-20">
        <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
          {/* track */}
          <circle cx="40" cy="40" r={r} fill="none" stroke="currentColor"
            className="text-muted/30" strokeWidth="7" />
          {/* fill */}
          <circle
            cx="40" cy="40" r={r} fill="none"
            stroke={color}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            style={{ transition: "stroke-dasharray 0.6s ease" }}
          />
        </svg>
        {/* centre label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-sm font-bold text-foreground leading-none">{value}</span>
          <span className="text-[10px] text-muted-foreground leading-none mt-0.5">days</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-xs font-medium text-foreground">{label}</p>
        <p className="text-[10px] text-muted-foreground">{sublabel}</p>
      </div>
    </div>
  );
}

// Big attendance-rate ring
function AttendanceRing({ rate }: { rate: number }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const dash = (rate / 100) * circ;
  const isWarn = rate < 75;
  const color = isWarn ? "#ef4444" : "#22c55e";

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          <circle cx="60" cy="60" r={r} fill="none" stroke="currentColor"
            className="text-muted/20" strokeWidth="10" />
          <circle
            cx="60" cy="60" r={r} fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            style={{ transition: "stroke-dasharray 0.8s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-foreground leading-none">{rate}%</span>
          <span className="text-xs text-muted-foreground mt-0.5">this month</span>
        </div>
      </div>
      {isWarn && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20">
          <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
          <span className="text-xs text-red-600 dark:text-red-400 font-medium">
            Below 75% — 5% salary deduction will apply
          </span>
        </div>
      )}
      {!isWarn && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20">
          <span className="text-xs text-green-600 dark:text-green-400 font-medium">
            Good standing ✓
          </span>
        </div>
      )}
    </div>
  );
}

export default function UserAttendance() {
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  const [startDate, setStartDate] = useState(
    new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(todayStr);

  const utils = trpc.useUtils();
  const { data: myEmployee } = trpc.employee.myEmployee.useQuery();

  const { data: attendanceList = [], isLoading } = trpc.attendance.getByEmployeeAndRange.useQuery(
    { employeeId: myEmployee?.id ?? 0, startDate, endDate },
    { enabled: !!myEmployee?.id }
  );

  const { data: stats } = trpc.attendance.stats.useQuery(
    { employeeId: myEmployee?.id },
    { enabled: !!myEmployee?.id }
  );

  const todayRecord = attendanceList.find(
    (r: any) => new Date(r.date).toISOString().split("T")[0] === todayStr
  );
  const hasCheckedIn = !!todayRecord;
  const hasCheckedOut = !!todayRecord?.checkOut;

  const checkInMutation = trpc.attendance.checkIn.useMutation({
    onSuccess: () => {
      toast.success("Checked in successfully!");
      utils.attendance.getByEmployeeAndRange.invalidate();
      utils.attendance.stats.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const checkOutMutation = trpc.attendance.checkOut.useMutation({
    onSuccess: () => {
      toast.success("Checked out. Have a great evening!");
      utils.attendance.getByEmployeeAndRange.invalidate();
      utils.attendance.stats.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const nowFormatted = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  const nowDateFormatted = now.toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const total = stats?.total ?? 0;
  const present = stats?.present ?? 0;
  const absent = stats?.absent ?? 0;
  const late = stats?.late ?? 0;
  const halfDay = stats?.halfDay ?? 0;
  const onLeave = stats?.onLeave ?? 0;
  const attendanceRate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });

  const formatTime = (t: string | null) =>
    t ? new Date(t).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—";

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">My Attendance</h1>
        <p className="text-sm text-muted-foreground mt-1">Mark your attendance and view history</p>
      </div>

      {!myEmployee ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <AlertCircle className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No employee profile linked to your account.</p>
            <p className="text-xs mt-1">Contact your HR admin to set up your profile.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* ── Today's Check-in Card ── */}
          <Card className="card-scandinavian">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Clock className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{nowDateFormatted}</p>
                  <p className="text-3xl font-bold text-foreground tracking-tight">{nowFormatted}</p>
                  <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                    {hasCheckedIn && (
                      <span>In: <span className="font-medium text-foreground">{formatTime(todayRecord.checkIn)}</span></span>
                    )}
                    {hasCheckedOut && (
                      <span>Out: <span className="font-medium text-foreground">{formatTime(todayRecord.checkOut)}</span></span>
                    )}
                    {todayRecord?.workHours && (
                      <span>Hours: <span className="font-medium text-foreground">{todayRecord.workHours}h</span></span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {hasCheckedOut ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    Day complete ✓
                  </span>
                ) : hasCheckedIn ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                    Checked in
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                    Not checked in
                  </span>
                )}

                {!hasCheckedIn && (
                  <Button
                    onClick={() => checkInMutation.mutate({ employeeId: myEmployee.id })}
                    disabled={checkInMutation.isPending}
                    className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    <LogIn className="w-4 h-4" />
                    {checkInMutation.isPending ? "Checking in…" : "Check In"}
                  </Button>
                )}
                {hasCheckedIn && !hasCheckedOut && (
                  <Button
                    onClick={() => checkOutMutation.mutate({ attendanceId: todayRecord.id })}
                    disabled={checkOutMutation.isPending}
                    variant="outline"
                    className="gap-2 border-destructive/50 text-destructive hover:bg-destructive/10"
                  >
                    <LogOut className="w-4 h-4" />
                    {checkOutMutation.isPending ? "Checking out…" : "Check Out"}
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* ── Metrics ── */}
          <Card className="card-scandinavian">
            <h2 className="text-base font-semibold text-foreground mb-6">This Month's Overview</h2>
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* Big attendance rate ring */}
              <div className="shrink-0">
                <AttendanceRing rate={attendanceRate} />
              </div>

              {/* Divider */}
              <div className="hidden md:block w-px self-stretch bg-border" />

              {/* Individual stat rings */}
              <div className="flex flex-wrap justify-center gap-6 flex-1">
                <RingChart
                  value={present}
                  total={total}
                  color="#22c55e"
                  label="Present"
                  sublabel={`${total > 0 ? Math.round((present / total) * 100) : 0}% of days`}
                />
                <RingChart
                  value={absent}
                  total={total}
                  color="#ef4444"
                  label="Absent"
                  sublabel={`${total > 0 ? Math.round((absent / total) * 100) : 0}% of days`}
                />
                <RingChart
                  value={late}
                  total={total}
                  color="#f59e0b"
                  label="Late"
                  sublabel={`${total > 0 ? Math.round((late / total) * 100) : 0}% of days`}
                />
                <RingChart
                  value={halfDay}
                  total={total}
                  color="#3b82f6"
                  label="Half Day"
                  sublabel={`${total > 0 ? Math.round((halfDay / total) * 100) : 0}% of days`}
                />
                <RingChart
                  value={onLeave}
                  total={total}
                  color="#a855f7"
                  label="On Leave"
                  sublabel={`${total > 0 ? Math.round((onLeave / total) * 100) : 0}% of days`}
                />
              </div>
            </div>
          </Card>

          {/* ── History ── */}
          <Card>
            <CardHeader className="flex-row items-center justify-between gap-4 pb-4">
              <CardTitle className="text-base">Attendance History</CardTitle>
              <div className="flex items-center gap-2">
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-36" />
                <span className="text-muted-foreground text-sm">to</span>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-36" max={todayStr} />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : attendanceList.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Clock className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p>No attendance records in this range</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {attendanceList.map((rec: any) => (
                    <div
                      key={rec.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/20 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-20 text-sm text-muted-foreground">{formatDate(rec.date)}</div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[rec.status]}`}>
                          {STATUS_LABELS[rec.status]}
                        </span>
                      </div>
                      <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <span className="hidden md:inline">In: {formatTime(rec.checkIn)}</span>
                        <span className="hidden md:inline">Out: {formatTime(rec.checkOut)}</span>
                        {rec.workHours && (
                          <span className="font-medium text-foreground">{rec.workHours}h</span>
                        )}
                        {rec.notes && (
                          <span className="text-xs italic max-w-[100px] truncate" title={rec.notes}>{rec.notes}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
