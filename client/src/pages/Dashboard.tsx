import { trpc } from '@/lib/trpc';
import { Card } from '@/components/ui/card';
import { Users, TrendingUp, DollarSign, AlertCircle } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function Dashboard() {
  const { data: stats } = trpc.dashboard.stats.useQuery();
  const { data: employees = [] } = trpc.employee.list.useQuery({
    limit: 100,
    offset: 0,
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

  // Status distribution
  const statusCounts = employees.reduce((acc, emp) => {
    const existing = acc.find(s => s.name === emp.status);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: emp.status, value: 1 });
    }
    return acc;
  }, [] as Array<{ name: string; value: number }>);

  const COLORS = ['#5A8FD4', '#E8A5C5', '#A8D5BA', '#FFD9A8'];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-foreground">Dashboard</h1>
        <p className="subtitle mt-2">Overview of your HR operations</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-scandinavian">
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

        <Card className="card-scandinavian">
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

        <Card className="card-scandinavian">
          <div className="flex items-center justify-between">
            <div>
              <p className="subtitle">Departments</p>
              <p className="text-3xl font-bold text-foreground mt-2">{stats?.departmentCount || 0}</p>
            </div>
            <div className="shape-circle-md bg-primary/20 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="card-scandinavian">
          <div className="flex items-center justify-between">
            <div>
              <p className="subtitle">Pending Tasks</p>
              <p className="text-3xl font-bold text-foreground mt-2">0</p>
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

        {/* Employee Status */}
        <Card className="card-scandinavian">
          <h2 className="text-xl font-semibold text-foreground mb-4">Employee Status</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={statusCounts}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" stroke="var(--muted-foreground)" />
              <YAxis stroke="var(--muted-foreground)" />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'var(--card)',
                  border: `1px solid var(--border)`,
                  color: 'var(--foreground)',
                }}
              />
              <Bar dataKey="value" fill="var(--primary)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="card-scandinavian">
        <h2 className="text-xl font-semibold text-foreground mb-4">Recent Employees</h2>
        <div className="space-y-3">
          {employees.slice(0, 5).map((employee) => (
            <div key={employee.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
              <div>
                <p className="font-medium text-foreground">{employee.firstName} {employee.lastName}</p>
                <p className="text-sm text-muted-foreground">{employee.position}</p>
              </div>
              <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded">
                {employee.department}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
