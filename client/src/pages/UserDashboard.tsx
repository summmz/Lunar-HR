import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, DollarSign, Bell, MessageSquare, LogOut } from 'lucide-react';
import { useLocation } from 'wouter';

export default function UserDashboard() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();

  const { data: myEmployee } = trpc.employee.myEmployee.useQuery();

  const { data: notifications = [] } = trpc.notification.list.useQuery({
    limit: 5,
  });

  const { data: salaryHistory = [] } = trpc.salaryHistory.getByEmployeeId.useQuery(
    myEmployee?.id ?? 0,
    { enabled: !!myEmployee?.id }
  );

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Welcome, {user?.name}</h1>
          <p className="subtitle mt-2">Your personal HR dashboard</p>
        </div>
        <Button
          onClick={handleLogout}
          variant="outline"
          className="border-border hover:bg-muted gap-2"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </Button>
      </div>

      {/* Personal Information Card */}
      <Card className="card-scandinavian">
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="shape-circle-lg bg-primary/20 flex items-center justify-center">
            <User className="w-12 h-12 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-foreground">{user?.name}</h2>
            <p className="text-muted-foreground">{user?.email}</p>
            <div className="flex gap-4 mt-4">
              <div>
                <p className="subtitle">Role</p>
                <p className="font-medium text-foreground capitalize">{user?.role}</p>
              </div>
              <div>
                <p className="subtitle">Member Since</p>
                <p className="font-medium text-foreground">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>
          <Button
            onClick={() => navigate('/user/profile')}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Edit Profile
          </Button>
        </div>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="card-scandinavian cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate('/user/salary')}>
          <div className="flex items-center justify-between">
            <div>
              <p className="subtitle">Salary Records</p>
              <p className="text-3xl font-bold text-foreground mt-2">{salaryHistory.length}</p>
            </div>
            <div className="shape-circle-md bg-primary/20 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="card-scandinavian cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate('/user/notifications')}>
          <div className="flex items-center justify-between">
            <div>
              <p className="subtitle">Notifications</p>
              <p className="text-3xl font-bold text-foreground mt-2">
                {notifications.filter(n => !n.isRead).length}
              </p>
            </div>
            <div className="shape-circle-md bg-secondary/20 flex items-center justify-center">
              <Bell className="w-6 h-6 text-secondary" />
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="card-scandinavian">
        <h2 className="text-xl font-semibold text-foreground mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button
            onClick={() => navigate('/user/salary')}
            className="justify-start bg-primary/10 text-primary hover:bg-primary/20"
          >
            <DollarSign className="w-4 h-4 mr-2" />
            View Salary History
          </Button>
          <Button
            onClick={() => navigate('/user/notifications')}
            className="justify-start bg-primary/10 text-primary hover:bg-primary/20"
          >
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </Button>
          <Button
            onClick={() => navigate('/user/chat')}
            className="justify-start bg-primary/10 text-primary hover:bg-primary/20"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            HR Assistant
          </Button>
        </div>
      </Card>

      {/* Recent Notifications */}
      <Card className="card-scandinavian">
        <h2 className="text-xl font-semibold text-foreground mb-4">Recent Notifications</h2>
        {notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => navigate('/user/notifications')}
                className="flex items-start gap-3 py-3 border-b border-border last:border-0 cursor-pointer hover:bg-accent/30 rounded-md px-2 -mx-2 transition-colors"
              >
                <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${notif.isRead ? 'bg-muted' : 'bg-primary'}`}></div>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium ${notif.isRead ? 'text-muted-foreground' : 'text-foreground'}`}>
                    {notif.title}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">{notif.content}</p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {new Date(notif.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">No notifications yet</p>
        )}
      </Card>

      {/* Salary Overview */}
      <Card className="card-scandinavian">
        <h2 className="text-xl font-semibold text-foreground mb-4">Recent Salary Records</h2>
        {salaryHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-4 font-semibold text-foreground">Effective Date</th>
                  <th className="text-right py-2 px-4 font-semibold text-foreground">Previous</th>
                  <th className="text-right py-2 px-4 font-semibold text-foreground">New Salary</th>
                  <th className="text-left py-2 px-4 font-semibold text-foreground">Reason</th>
                </tr>
              </thead>
              <tbody>
                {salaryHistory.slice(0, 5).map((record: any, idx: number) => (
                  <tr key={idx} className="border-b border-border hover:bg-muted/50">
                    <td className="py-3 px-4">{new Date(record.effectiveDate).toLocaleDateString()}</td>
                    <td className="text-right py-3 px-4 text-muted-foreground">
                      ${parseFloat(record.previousBasicSalary).toLocaleString()}
                    </td>
                    <td className="text-right py-3 px-4 font-semibold text-foreground">
                      ${parseFloat(record.newBasicSalary).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{record.reason || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">No salary records available</p>
        )}
      </Card>
    </div>
  );
}
