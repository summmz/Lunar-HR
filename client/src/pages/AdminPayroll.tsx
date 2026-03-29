import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, DollarSign, TrendingUp, Download } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminPayroll() {
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

  const { data: payrollStats = [] } = trpc.payroll.stats.useQuery();

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

  const handleExportPayroll = () => {
    if (!selectedEmployeeId) {
      toast.error('Please select an employee first');
      return;
    }
    
    const employee = employees.find(e => e.id === selectedEmployeeId);
    if (!employee || payrollData.length === 0) {
      toast.error('No payroll data to export');
      return;
    }

    const headers = ['Month', 'Basic Salary', 'Allowances', 'Deductions', 'Gross Salary', 'Net Salary', 'Status'];
    const rows = payrollData.map(p => [
      new Date(p.month).toLocaleDateString(),
      parseFloat(p.basicSalary as any).toFixed(2),
      parseFloat(p.allowances as any).toFixed(2),
      parseFloat(p.deductions as any).toFixed(2),
      parseFloat(p.grossSalary as any).toFixed(2),
      parseFloat(p.netSalary as any).toFixed(2),
      p.status,
    ]);

    const csvContent = [
      `Employee: ${employee.firstName} ${employee.lastName}`,
      `Email: ${employee.email}`,
      `Department: ${employee.department}`,
      `Position: ${employee.position}`,
      '',
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payroll_${employee.firstName}_${employee.lastName}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast.success('Payroll exported successfully');
  };

  const handleGenerateReport = () => {
    if (payrollStats.length === 0) {
      toast.error('No payroll data available');
      return;
    }

    const totalEmployees = employees.length;
    const totalPayroll = payrollStats.reduce((sum, p: any) => sum + parseFloat(p.netSalary || 0), 0);
    const totalGross = payrollStats.reduce((sum, p: any) => sum + parseFloat(p.grossSalary || 0), 0);
    const paidCount = payrollStats.filter((p: any) => p.status === 'paid').length;
    const pendingCount = payrollStats.filter((p: any) => p.status === 'pending').length;

    const reportContent = [
      'PAYROLL REPORT',
      `Generated: ${new Date().toLocaleString()}`,
      '',
      `Total Employees: ${totalEmployees}`,
      `Total Payroll Records: ${payrollStats.length}`,
      `Paid: ${paidCount}`,
      `Pending: ${pendingCount}`,
      `Total Net Salary (All): $${totalPayroll.toFixed(2)}`,
      `Total Gross Salary (All): $${totalGross.toFixed(2)}`,
    ].join('\n');

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payroll_report_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast.success('Report generated successfully');
  };

  const handleExportAllPayroll = () => {
    if (payrollStats.length === 0) {
      toast.error('No payroll data to export');
      return;
    }

    const headers = ['Employee Name', 'Month', 'Basic Salary', 'Allowances', 'Deductions', 'Gross Salary', 'Net Salary', 'Status'];
    const rows = (payrollStats as any[]).map(p => {
      const emp = employees.find(e => e.id === p.employeeId);
      return [
        emp ? `${emp.firstName} ${emp.lastName}` : 'Unknown',
        new Date(p.month).toLocaleDateString(),
        parseFloat(p.basicSalary as any).toFixed(2),
        parseFloat(p.allowances as any).toFixed(2),
        parseFloat(p.deductions as any).toFixed(2),
        parseFloat(p.grossSalary as any).toFixed(2),
        parseFloat(p.netSalary as any).toFixed(2),
        p.status,
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `all_payroll_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast.success('All payroll data exported successfully');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Payroll Management</h1>
          <p className="text-sm text-muted-foreground mt-2">Track and manage employee salaries</p>
        </div>
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
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground uppercase">Employee</label>
                <select
                  name="employeeId"
                  required
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                >
                  <option value="">Select Employee</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground uppercase">Month</label>
                <input
                  type="month"
                  name="month"
                  required
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground uppercase">Basic Salary</label>
                <input
                  type="number"
                  name="basicSalary"
                  placeholder="0.00"
                  step="0.01"
                  required
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground uppercase">Allowances</label>
                <input
                  type="number"
                  name="allowances"
                  placeholder="0.00"
                  step="0.01"
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground uppercase">Deductions</label>
                <input
                  type="number"
                  name="deductions"
                  placeholder="0.00"
                  step="0.01"
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                />
              </div>
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
                Process Payroll
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="card-scandinavian">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Employees</p>
              <p className="text-3xl font-bold text-foreground mt-2">{employees.length}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="card-scandinavian">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Payroll Processed</p>
              <p className="text-3xl font-bold text-foreground mt-2">{payrollStats?.length || 0}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="card-scandinavian">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending Payroll</p>
              <p className="text-3xl font-bold text-foreground mt-2">
                {payrollStats?.filter((p: any) => p.status === 'pending').length || 0}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-primary" />
            </div>
          </div>
        </Card>
      </div>

      {/* Employee Payroll Selection */}
      <Card className="card-scandinavian">
        <h2 className="text-lg font-semibold text-foreground mb-4">Employee Payroll History</h2>
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <select
            value={selectedEmployeeId || ''}
            onChange={(e) => setSelectedEmployeeId(parseInt(e.target.value) || null)}
            className="px-3 py-2 border border-border rounded-md bg-background text-foreground flex-1"
          >
            <option value="">Select an employee to view payroll history</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.firstName} {emp.lastName}
              </option>
            ))}
          </select>
          <Button 
            className="bg-primary/10 text-primary hover:bg-primary/20 gap-2"
            onClick={handleExportPayroll}
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>

        {selectedEmployeeId && payrollData.length > 0 ? (
          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Month</th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground">Basic</th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground">Allowances</th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground">Deductions</th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground">Gross</th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground">Net Salary</th>
                  <th className="text-center py-3 px-4 font-semibold text-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {payrollData.map((payroll, index) => (
                  <tr 
                    key={payroll.id} 
                    className="border-b border-border hover:bg-muted/20"
                  >
                    <td className="py-3 px-4">{new Date(payroll.month).toLocaleDateString()}</td>
                    <td className="text-right py-3 px-4">${parseFloat(payroll.basicSalary as any).toFixed(2)}</td>
                    <td className="text-right py-3 px-4">${parseFloat(payroll.allowances as any).toFixed(2)}</td>
                    <td className="text-right py-3 px-4">${parseFloat(payroll.deductions as any).toFixed(2)}</td>
                    <td className="text-right py-3 px-4">${parseFloat(payroll.grossSalary as any).toFixed(2)}</td>
                    <td className="text-right py-3 px-4 font-semibold">${parseFloat(payroll.netSalary as any).toFixed(2)}</td>
                    <td className="text-center py-3 px-4">
                      <span className={`text-xs px-2 py-1 rounded font-medium ${
                        payroll.status === 'paid'
                          ? 'bg-green-100 text-green-700'
                          : payroll.status === 'processed'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {payroll.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : selectedEmployeeId ? (
          <p className="text-center text-muted-foreground py-12">No payroll records found</p>
        ) : (
          <p className="text-center text-muted-foreground py-12">Select an employee to view payroll history</p>
        )}
      </Card>

      {/* Bulk Actions */}
      <Card className="card-scandinavian">
        <h2 className="text-xl font-semibold text-foreground mb-4">Bulk Actions</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            className="w-full sm:w-auto bg-primary/10 text-primary hover:bg-primary/20"
            onClick={handleGenerateReport}
          >
            📊 Generate Monthly Report
          </Button>
          <Button 
            className="w-full sm:w-auto bg-primary/10 text-primary hover:bg-primary/20"
            onClick={handleExportAllPayroll}
          >
            📥 Export All Payroll
          </Button>
        </div>
      </Card>
    </div>
  );
}
