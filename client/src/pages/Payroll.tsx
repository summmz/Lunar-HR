import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/_core/hooks/useAuth';
import { Plus, DollarSign, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

export default function Payroll() {
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);

  // Queries
  const { data: employees = [], isLoading: employeesLoading } = trpc.employee.list.useQuery({
    limit: 100,
    offset: 0,
  });

  const { data: payrollData = [] } = trpc.payroll.getByEmployeeId.useQuery(
    selectedEmployeeId || 0,
    { enabled: !!selectedEmployeeId }
  );

  // Mutations
  const createPayrollMutation = trpc.payroll.create.useMutation({
    onSuccess: () => {
      toast.success('Payroll created successfully');
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create payroll');
    },
  });

  const handleCreatePayroll = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const basicSalary = parseFloat(formData.get('basicSalary') as string);
    const allowances = parseFloat(formData.get('allowances') as string) || 0;
    const deductions = parseFloat(formData.get('deductions') as string) || 0;
    const grossSalary = basicSalary + allowances;
    const netSalary = grossSalary - deductions;

    createPayrollMutation.mutate({
      employeeId: parseInt(formData.get('employeeId') as string),
      month: formData.get('month') as string,
      basicSalary,
      allowances,
      deductions,
      grossSalary,
      netSalary,
      status: 'pending',
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Payroll Management</h1>
          <p className="subtitle mt-2">Track and manage employee salaries</p>
        </div>
        {user?.role === 'admin' && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                <Plus className="w-4 h-4" />
                Process Payroll
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Process Payroll</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreatePayroll} className="space-y-4">
                <select
                  name="employeeId"
                  required
                  className="input-scandinavian"
                >
                  <option value="">Select Employee</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName}
                    </option>
                  ))}
                </select>
                <input
                  type="month"
                  name="month"
                  required
                  className="input-scandinavian"
                />
                <input
                  type="number"
                  name="basicSalary"
                  placeholder="Basic Salary"
                  step="0.01"
                  required
                  className="input-scandinavian"
                />
                <input
                  type="number"
                  name="allowances"
                  placeholder="Allowances"
                  step="0.01"
                  className="input-scandinavian"
                />
                <input
                  type="number"
                  name="deductions"
                  placeholder="Deductions"
                  step="0.01"
                  className="input-scandinavian"
                />
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
                  Process Payroll
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="card-scandinavian">
          <div className="flex items-center justify-between">
            <div>
              <p className="subtitle">Total Employees</p>
              <p className="text-3xl font-bold text-foreground mt-2">{employees.length}</p>
            </div>
            <div className="shape-circle-md bg-primary/20 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="card-scandinavian">
          <div className="flex items-center justify-between">
            <div>
              <p className="subtitle">Payroll Processed</p>
              <p className="text-3xl font-bold text-foreground mt-2">0</p>
            </div>
            <div className="shape-circle-md bg-secondary/20 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-secondary" />
            </div>
          </div>
        </Card>

        <Card className="card-scandinavian">
          <div className="flex items-center justify-between">
            <div>
              <p className="subtitle">Pending Payroll</p>
              <p className="text-3xl font-bold text-foreground mt-2">0</p>
            </div>
            <div className="shape-circle-md bg-primary/20 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-primary" />
            </div>
          </div>
        </Card>
      </div>

      {/* Employee Payroll Selection */}
      <Card className="card-scandinavian">
        <h2 className="text-xl font-semibold text-foreground mb-4">Employee Payroll History</h2>
        <select
          value={selectedEmployeeId || ''}
          onChange={(e) => setSelectedEmployeeId(parseInt(e.target.value) || null)}
          className="input-scandinavian mb-4"
        >
          <option value="">Select an employee to view payroll history</option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.firstName} {emp.lastName}
            </option>
          ))}
        </select>

        {selectedEmployeeId && payrollData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-4 font-semibold text-foreground">Month</th>
                  <th className="text-right py-2 px-4 font-semibold text-foreground">Basic</th>
                  <th className="text-right py-2 px-4 font-semibold text-foreground">Allowances</th>
                  <th className="text-right py-2 px-4 font-semibold text-foreground">Deductions</th>
                  <th className="text-right py-2 px-4 font-semibold text-foreground">Net Salary</th>
                  <th className="text-center py-2 px-4 font-semibold text-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {payrollData.map((payroll) => (
                  <tr key={payroll.id} className="border-b border-border hover:bg-muted/50">
                    <td className="py-3 px-4">{new Date(payroll.month).toLocaleDateString()}</td>
                    <td className="text-right py-3 px-4">${parseFloat(payroll.basicSalary as any).toFixed(2)}</td>
                    <td className="text-right py-3 px-4">${parseFloat(payroll.allowances as any).toFixed(2)}</td>
                    <td className="text-right py-3 px-4">${parseFloat(payroll.deductions as any).toFixed(2)}</td>
                    <td className="text-right py-3 px-4 font-semibold">${parseFloat(payroll.netSalary as any).toFixed(2)}</td>
                    <td className="text-center py-3 px-4">
                      <span className={`text-xs px-2 py-1 rounded ${
                        payroll.status === 'paid'
                          ? 'bg-green-100 text-green-700'
                          : payroll.status === 'processed'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {payroll.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : selectedEmployeeId ? (
          <p className="text-center text-muted-foreground py-8">No payroll records found</p>
        ) : (
          <p className="text-center text-muted-foreground py-8">Select an employee to view payroll history</p>
        )}
      </Card>
    </div>
  );
}
