import { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  Calendar, 
  DollarSign, 
  FileText,
  Clock,
  ChevronRight,
  Link,
  Link2Off,
  ShieldCheck,
  ShieldOff,
  Cake,
  Building2,
  Users,
  Globe,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function EmployeeDetails() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const employeeId = parseInt(id || '0');

  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [linkUserId, setLinkUserId] = useState('');

  const { data: employee, isLoading, error, refetch } = trpc.employee.getById.useQuery(employeeId, {
    enabled: employeeId > 0,
  });

  const { data: salaryHistory = [] } = trpc.salaryHistory.getByEmployeeId.useQuery(employeeId, {
    enabled: employeeId > 0,
  });

  const { data: payrolls = [] } = trpc.payroll.getByEmployeeId.useQuery(employeeId, {
    enabled: employeeId > 0,
  });

  const { data: attendanceStats } = trpc.attendance.stats.useQuery(
    { employeeId },
    { enabled: employeeId > 0 }
  );

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const monthEnd = now.toISOString().split('T')[0];

  const { data: attendanceRecords = [] } = trpc.attendance.getByEmployeeAndRange.useQuery(
    { employeeId, startDate: monthStart, endDate: monthEnd },
    { enabled: employeeId > 0 }
  );

  const utils = trpc.useUtils();
  const deductionMutation = trpc.attendance.applyAttendanceDeduction.useMutation({
    onSuccess: (res) => {
      if (res.applied) {
        toast.success(`Deduction applied — ${res.attendanceRate}% attendance, -$${res.deductionAmount} deducted`);
        refetch();
        utils.salaryHistory.getByEmployeeId.invalidate(employeeId);
      } else {
        toast.info(res.reason ?? 'No deduction needed');
      }
    },
    onError: (e) => toast.error(e.message),
  });

  const linkUserMutation = trpc.employee.linkUser.useMutation({
    onSuccess: () => {
      toast.success('User account linked successfully');
      refetch();
      setIsLinkDialogOpen(false);
      setLinkUserId('');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to link user');
    },
  });

  const unlinkUserMutation = trpc.employee.unlinkUser.useMutation({
    onSuccess: () => {
      toast.success('User account unlinked');
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to unlink user');
    },
  });

  const handleLinkUser = () => {
    const userId = parseInt(linkUserId);
    if (isNaN(userId) || userId <= 0) {
      toast.error('Please enter a valid User ID');
      return;
    }
    linkUserMutation.mutate({ employeeId, userId });
  };

  const handleUnlinkUser = () => {
    if (confirm('Are you sure you want to unlink this user account from the employee profile?')) {
      unlinkUserMutation.mutate(employeeId);
    }
  };

  // ── Ring chart helper ──
  function RingChart({ value, total, color, label }: { value: number; total: number; color: string; label: string }) {
    const r = 28;
    const circ = 2 * Math.PI * r;
    const pct = total > 0 ? Math.min(value / total, 1) : 0;
    return (
      <div className="flex flex-col items-center gap-1.5">
        <div className="relative w-16 h-16">
          <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
            <circle cx="32" cy="32" r={r} fill="none" stroke="currentColor" className="text-muted/20" strokeWidth="6" />
            <circle cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
              strokeDasharray={`${pct * circ} ${circ}`} style={{ transition: 'stroke-dasharray 0.6s ease' }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-sm font-bold text-foreground leading-none">{value}</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-foreground">Employee Not Found</h2>
        <p className="text-muted-foreground mt-2">The employee you are looking for does not exist or has been removed.</p>
        <Button onClick={() => navigate('/admin/employees')} className="mt-6 gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Employees
        </Button>
      </div>
    );
  }

  const isLinked = employee.userId !== null;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Link User Dialog */}
      <Dialog open={isLinkDialogOpen} onOpenChange={(open) => {
        setIsLinkDialogOpen(open);
        if (!open) setLinkUserId('');
      }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Link User Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Enter the User ID of the login account you want to link to <strong>{employee.firstName} {employee.lastName}</strong>. Find User IDs in the <code className="bg-muted px-1 rounded text-xs">users</code> table of your database.
            </p>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase">User ID</label>
              <input
                type="number"
                value={linkUserId}
                onChange={(e) => setLinkUserId(e.target.value)}
                placeholder="e.g. 3"
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground"
              />
            </div>
            <div className="flex gap-2">
              <Button
                className="flex-1 bg-primary hover:bg-primary/90"
                onClick={handleLinkUser}
                disabled={linkUserMutation.isPending}
              >
                {linkUserMutation.isPending ? 'Linking...' : 'Link User'}
              </Button>
              <Button variant="outline" onClick={() => setIsLinkDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/admin/employees')}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-4xl font-bold text-foreground">
            {employee.firstName} {employee.lastName}
          </h1>
          <p className="subtitle mt-1">{employee.position} • {employee.department}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="card-scandinavian lg:col-span-1 space-y-6">
          <div className="flex flex-col items-center text-center p-4">
            <div className="shape-circle-lg bg-primary/20 flex items-center justify-center mb-4">
              <User className="w-12 h-12 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground">
              {employee.firstName} {employee.lastName}
            </h2>
            <span className={`mt-2 px-3 py-1 rounded-full text-xs font-medium ${
              employee.status === 'active'
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-700'
            }`}>
              {employee.status.toUpperCase()}
            </span>
          </div>

          {/* Contact */}
          <div className="pt-4 border-t border-border">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Contact</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3 text-sm">
                <Mail className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <span className="text-foreground break-all">{employee.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-foreground">{employee.phone || 'N/A'}</span>
              </div>
              {employee.dateOfBirth && (
                <div className="flex items-center gap-3 text-sm">
                  <Cake className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-foreground">{format(new Date(employee.dateOfBirth), 'PPP')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Address */}
          <div className="pt-4 border-t border-border">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Address</h3>
            <div className="space-y-1 text-sm">
              {employee.address ? (
                <>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="space-y-0.5">
                      <p className="text-foreground">{employee.address}</p>
                      {(employee.city || employee.state || employee.zipCode) && (
                        <p className="text-foreground">
                          {[employee.city, employee.state, employee.zipCode].filter(Boolean).join(', ')}
                        </p>
                      )}
                      {employee.country && (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Globe className="w-3 h-3" />
                          <span>{employee.country}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-3 text-muted-foreground">
                  <MapPin className="w-4 h-4 shrink-0" />
                  <span>No address on file</span>
                </div>
              )}
            </div>
          </div>

          {/* ── Account Link Status ── */}
          <div className="pt-6 border-t border-border">
            <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider flex items-center gap-2">
              {isLinked
                ? <ShieldCheck className="w-4 h-4 text-green-500" />
                : <ShieldOff className="w-4 h-4 text-amber-500" />
              }
              Login Account
            </h3>

            {isLinked ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <span className="w-2 h-2 rounded-full bg-green-500 shrink-0"></span>
                  <div>
                    <p className="text-xs font-medium text-green-700 dark:text-green-400">Account linked</p>
                    <p className="text-xs text-muted-foreground">User ID: {employee.userId}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-amber-600 border-amber-300 hover:bg-amber-50 gap-2"
                  onClick={handleUnlinkUser}
                  disabled={unlinkUserMutation.isPending}
                >
                  <Link2Off className="w-3.5 h-3.5" />
                  {unlinkUserMutation.isPending ? 'Unlinking...' : 'Unlink Account'}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0"></span>
                  <div>
                    <p className="text-xs font-medium text-amber-700 dark:text-amber-400">No account linked</p>
                    <p className="text-xs text-muted-foreground">Employee cannot log in yet</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  className="w-full bg-primary hover:bg-primary/90 gap-2"
                  onClick={() => setIsLinkDialogOpen(true)}
                >
                  <Link className="w-3.5 h-3.5" />
                  Link User Account
                </Button>
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-border">
            <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">Employment Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Department</span>
                <span className="font-medium text-foreground">{employee.department}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Position</span>
                <span className="font-medium text-foreground">{employee.position}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Hire Date</span>
                <span className="font-medium text-foreground">
                  {format(new Date(employee.hireDate), 'PPP')}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Reports To</span>
                <span className="font-medium text-foreground">{employee.reportingManager || 'N/A'}</span>
              </div>
            </div>
          </div>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          {/* Salary Info */}
          <Card className="card-scandinavian">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                Compensation
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="p-4 bg-muted/30 rounded-lg">
                <p className="subtitle text-xs uppercase">Basic Salary</p>
                <p className="text-xl font-bold text-foreground mt-1">${employee.basicSalary}</p>
              </div>
              <div className="p-4 bg-muted/30 rounded-lg">
                <p className="subtitle text-xs uppercase">Allowances</p>
                <p className="text-xl font-bold text-foreground mt-1">${employee.allowances || '0.00'}</p>
              </div>
              <div className="p-4 bg-muted/30 rounded-lg">
                <p className="subtitle text-xs uppercase">Deductions</p>
                <p className="text-xl font-bold text-foreground mt-1 text-destructive">${employee.deductions || '0.00'}</p>
              </div>
            </div>

            <h3 className="text-sm font-semibold text-foreground mb-4">Salary History</h3>
            <div className="space-y-3">
              {salaryHistory.length > 0 ? salaryHistory.map((history) => (
                <div key={history.id} className="flex items-center justify-between p-3 border border-border rounded-md hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded">
                      <Clock className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Change to ${history.newBasicSalary}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Effective {format(new Date(history.effectiveDate), 'PP')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">{history.reason || 'Annual Review'}</p>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground text-center py-4">No salary history records</p>
              )}
            </div>
          </Card>

          {/* Attendance This Month */}
          <Card className="card-scandinavian">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Attendance — {format(now, 'MMMM yyyy')}
              </h2>
              <Button
                size="sm"
                variant="outline"
                disabled={deductionMutation.isPending}
                onClick={() => deductionMutation.mutate({ employeeId })}
                className="text-xs border-amber-400/40 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10"
              >
                {deductionMutation.isPending ? 'Checking…' : 'Check & Apply Deduction'}
              </Button>
            </div>

            {!attendanceStats || attendanceStats.total === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No attendance records this month</p>
              </div>
            ) : (() => {
              const { present = 0, absent = 0, late = 0, halfDay = 0, onLeave = 0, total = 0 } = attendanceStats as any;
              const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;
              const isWarn = rate < 75;
              const bigR = 44;
              const bigCirc = 2 * Math.PI * bigR;
              const bigDash = (rate / 100) * bigCirc;

              return (
                <div className="space-y-6">
                  {/* Rate + warning banner */}
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    {/* Big ring */}
                    <div className="relative w-28 h-28 shrink-0">
                      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                        <circle cx="50" cy="50" r={bigR} fill="none" stroke="currentColor" className="text-muted/20" strokeWidth="9" />
                        <circle cx="50" cy="50" r={bigR} fill="none"
                          stroke={isWarn ? '#ef4444' : '#22c55e'}
                          strokeWidth="9" strokeLinecap="round"
                          strokeDasharray={`${bigDash} ${bigCirc}`}
                          style={{ transition: 'stroke-dasharray 0.8s ease' }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold text-foreground leading-none">{rate}%</span>
                        <span className="text-[10px] text-muted-foreground mt-0.5">attendance</span>
                      </div>
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${isWarn ? 'bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400' : 'bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400'}`}>
                        {isWarn
                          ? <AlertCircle className="w-4 h-4 shrink-0" />
                          : <CheckCircle2 className="w-4 h-4 shrink-0" />}
                        {isWarn
                          ? `Below 75% threshold — 5% salary deduction applies`
                          : `Good standing — above 75% threshold`}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex justify-between px-3 py-1.5 rounded bg-muted/40">
                          <span className="text-muted-foreground">Total days</span>
                          <span className="font-medium text-foreground">{total}</span>
                        </div>
                        <div className="flex justify-between px-3 py-1.5 rounded bg-muted/40">
                          <span className="text-muted-foreground">Working days left</span>
                          <span className="font-medium text-foreground">
                            {new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Small stat rings */}
                  <div className="flex justify-around flex-wrap gap-4 pt-2 border-t border-border">
                    <RingChart value={present} total={total} color="#22c55e" label="Present" />
                    <RingChart value={absent} total={total} color="#ef4444" label="Absent" />
                    <RingChart value={late} total={total} color="#f59e0b" label="Late" />
                    <RingChart value={halfDay} total={total} color="#3b82f6" label="Half Day" />
                    <RingChart value={onLeave} total={total} color="#a855f7" label="On Leave" />
                  </div>

                  {/* Recent records */}
                  {attendanceRecords.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Recent records</p>
                      {(attendanceRecords as any[]).slice(0, 5).map((rec: any) => (
                        <div key={rec.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/30 text-sm">
                          <span className="text-muted-foreground w-24">
                            {format(new Date(rec.date), 'EEE, d MMM')}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            rec.status === 'present' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                            rec.status === 'absent' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                            rec.status === 'late' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {rec.status.replace('_', ' ')}
                          </span>
                          <span className="text-muted-foreground text-xs">
                            {rec.checkIn ? format(new Date(rec.checkIn), 'HH:mm') : '—'}
                            {rec.checkOut ? ` → ${format(new Date(rec.checkOut), 'HH:mm')}` : ''}
                          </span>
                          <span className="font-medium text-foreground text-xs w-10 text-right">
                            {rec.workHours ? `${rec.workHours}h` : '—'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
          </Card>

          {/* Recent Payroll */}
          <Card className="card-scandinavian">
            <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-secondary" />
              Recent Payroll
            </h2>
            <div className="space-y-4">
              {payrolls.length > 0 ? payrolls.slice(0, 3).map((payroll) => (
                <div key={payroll.id} className="flex items-center justify-between p-4 border border-border rounded-lg shadow-soft">
                  <div>
                    <p className="font-semibold text-foreground">
                      {format(new Date(payroll.month), 'MMMM yyyy')}
                    </p>
                    <p className="text-xs text-muted-foreground">Status: {payroll.status}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-foreground">${payroll.netSalary}</p>
                    <p className="text-xs text-muted-foreground">Net Payout</p>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground text-center py-4">No payroll records yet</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
