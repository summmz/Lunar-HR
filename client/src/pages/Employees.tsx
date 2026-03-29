import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/_core/hooks/useAuth';
import { Plus, Search, Filter, Trash2, Edit2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Employees() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartment, setFilterDepartment] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Queries
  const { data: employees = [], isLoading, refetch } = trpc.employee.list.useQuery({
    limit: 100,
    offset: 0,
  });

  const { data: searchResults = [] } = trpc.employee.search.useQuery(
    searchQuery,
    { enabled: searchQuery.length > 0 }
  );

  const { data: filteredEmployees = [] } = trpc.employee.filter.useQuery(
    {
      department: filterDepartment,
      status: filterStatus,
      limit: 100,
    },
    { enabled: !!filterDepartment || !!filterStatus }
  );

  // Mutations
  const createMutation = trpc.employee.create.useMutation({
    onSuccess: () => {
      toast.success('Employee created successfully');
      refetch();
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create employee');
    },
  });

  const deleteMutation = trpc.employee.delete.useMutation({
    onSuccess: () => {
      toast.success('Employee deleted successfully');
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete employee');
    },
  });

  // Determine which data to display
  let displayEmployees = employees;
  if (searchQuery.length > 0) {
    displayEmployees = searchResults;
  } else if (filterDepartment || filterStatus) {
    displayEmployees = filteredEmployees;
  }

  const handleCreateEmployee = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    createMutation.mutate({
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      department: formData.get('department') as string,
      position: formData.get('position') as string,
      hireDate: formData.get('hireDate') as string,
      basicSalary: parseFloat(formData.get('basicSalary') as string),
    });
  };

  const handleDeleteEmployee = (id: number) => {
    if (confirm('Are you sure you want to delete this employee?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Employees</h1>
          <p className="subtitle mt-2">Manage and organize your workforce</p>
        </div>
        {user?.role === 'admin' && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                <Plus className="w-4 h-4" />
                Add Employee
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Employee</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateEmployee} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    name="firstName"
                    placeholder="First Name"
                    required
                    className="input-scandinavian"
                  />
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Last Name"
                    required
                    className="input-scandinavian"
                  />
                </div>
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  required
                  className="input-scandinavian"
                />
                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone"
                  className="input-scandinavian"
                />
                <input
                  type="text"
                  name="department"
                  placeholder="Department"
                  required
                  className="input-scandinavian"
                />
                <input
                  type="text"
                  name="position"
                  placeholder="Position"
                  required
                  className="input-scandinavian"
                />
                <input
                  type="date"
                  name="hireDate"
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
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
                  Create Employee
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search employees..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-scandinavian pl-10"
          />
        </div>
        <select
          value={filterDepartment}
          onChange={(e) => setFilterDepartment(e.target.value)}
          className="input-scandinavian"
        >
          <option value="">All Departments</option>
          <option value="Engineering">Engineering</option>
          <option value="Sales">Sales</option>
          <option value="Marketing">Marketing</option>
          <option value="HR">HR</option>
          <option value="Finance">Finance</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="input-scandinavian"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="on_leave">On Leave</option>
          <option value="terminated">Terminated</option>
        </select>
      </div>

      {/* Employee List */}
      <div className="grid gap-4">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          </div>
        ) : displayEmployees.length === 0 ? (
          <Card className="card-scandinavian text-center py-12">
            <p className="text-muted-foreground">No employees found</p>
          </Card>
        ) : (
          displayEmployees.map((employee) => (
            <Card key={employee.id} className="card-scandinavian">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground">
                    {employee.firstName} {employee.lastName}
                  </h3>
                  <p className="text-sm text-muted-foreground">{employee.position}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                      {employee.department}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      employee.status === 'active' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {employee.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{employee.email}</p>
                </div>
                <div className="flex gap-2">
                  {user?.role === 'admin' && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive/80"
                        onClick={() => handleDeleteEmployee(employee.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
