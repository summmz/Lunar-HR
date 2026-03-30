import { trpc } from '@/lib/trpc';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, TrendingUp, DollarSign, AlertCircle, Settings, Building2 } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useLocation } from 'wouter';

export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const { data: stats } = trpc.dashboard.stats.useQuery();
  const { data: employees = [] } = trpc.employee.list.useQuery({
    limit: 100,
    offset: 0,
  });

  const { data: notifications = [] } = trpc.notification.list.useQuery({
    limit: 10,
  });

  // Department distribution
  const departmentCounts = employees.reduce((acc, emp) => {
    const existing = acc.find(d => d.name === emp.department);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: emp.department, value: 1 });
    }
    return acc;
  }, [] as Array<{ name: string; value: number }>);

  const COLORS = ['#5A8FD4', '#E8A5C5', '#A8D5BA', '#FFD9A8'];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-4xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="subtitle mt-1">System overview and management controls</p>
        </div>
        <Button
          onClick={() => navigate('/admin/settings')}
          className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
        >
          <Settings className="w-4 h-4" />
          Settings
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-scandinavian cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate('/admin/employees')}>
          <div className="flex items-center justify-between">
            <div>
              <p className="subtitle">Total Employees</p>
              <p className="text-3xl font-bold text-foreground mt-2">{stats?.totalEmployees || 0}</p>
            </div>
            <div className="shape-circle-md bg-primary/20 flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="card-scandinavian cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate('/admin/employees')}>
          <div className="flex items-center justify-between">
            <div>
              <p className="subtitle">Active Employees</p>
              <p className="text-3xl font-bold text-foreground mt-2">{stats?.activeEmployees || 0}</p>
            </div>
            <div className="shape-circle-md bg-secondary/20 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-secondary" />
            </div>
          </div>
        </Card>

        <Card className="card-scandinavian cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate('/admin/departments')}>
          <div className="flex items-center justify-between">
            <div>
              <p className="subtitle">Departments</p>
              <p className="text-3xl font-bold text-foreground mt-2">{stats?.departmentCount || 0}</p>
            </div>
            <div className="shape-circle-md bg-primary/20 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="card-scandinavian cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate('/admin/notifications')}>
          <div className="flex items-center justify-between">
            <div>
              <p className="subtitle">Pending Notifications</p>
              <p className="text-3xl font-bold text-foreground mt-2">{notifications.filter(n => !n.isRead).length}</p>
            </div>
            <div className="shape-circle-md bg-secondary/20 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-secondary" />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Distribution */}
        <Card className="card-scandinavian">
          <h2 className="text-xl font-semibold text-foreground mb-4">Department Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={departmentCounts}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {departmentCounts.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Quick Actions */}
        <Card className="card-scandinavian">
          <h2 className="text-xl font-semibold text-foreground mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Button
              onClick={() => navigate('/admin/employees')}
              className="w-full justify-start bg-primary/10 text-primary hover:bg-primary/20"
            >
              <Users className="w-4 h-4 mr-2" />
              Manage Employees
            </Button>
            <Button
              onClick={() => navigate('/admin/payroll')}
              className="w-full justify-start bg-primary/10 text-primary hover:bg-primary/20"
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Process Payroll
            </Button>
            <Button
              onClick={() => navigate('/admin/notifications')}
              className="w-full justify-start bg-primary/10 text-primary hover:bg-primary/20"
            >
              <AlertCircle className="w-4 h-4 mr-2" />
              View Notifications
            </Button>
          </div>
        </Card>
      </div>

      {/* Recent Notifications */}
      <Card className="card-scandinavian">
        <h2 className="text-xl font-semibold text-foreground mb-4">Recent Notifications</h2>
        <div className="space-y-3">
          {notifications.slice(0, 5).map((notif) => (
            <div key={notif.id} className="flex items-start gap-3 py-3 border-b border-border last:border-0">
              <div className={`w-2 h-2 rounded-full mt-2 ${notif.isRead ? 'bg-muted' : 'bg-primary'}`}></div>
              <div className="flex-1">
                <p className={`font-medium ${notif.isRead ? 'text-muted-foreground' : 'text-foreground'}`}>
                  {notif.title}
                </p>
                <p className="text-sm text-muted-foreground">{notif.content}</p>
              </div>
              <span className="text-xs text-muted-foreground">
                {new Date(notif.createdAt).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* System Stats */}
      <Card className="card-scandinavian">
        <h2 className="text-xl font-semibold text-foreground mb-4">System Information</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="subtitle">Total Records</p>
            <p className="text-2xl font-bold text-foreground mt-1">{employees.length}</p>
          </div>
          <div>
            <p className="subtitle">Active Users</p>
            <p className="text-2xl font-bold text-foreground mt-1">{stats?.activeEmployees || 0}</p>
          </div>
          <div>
            <p className="subtitle">System Status</p>
            <p className="text-2xl font-bold text-green-600 mt-1">Operational</p>
          </div>
          <div>
            <p className="subtitle">Last Updated</p>
            <p className="text-sm font-medium text-foreground mt-1">{new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
