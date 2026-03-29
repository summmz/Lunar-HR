import { useState, useDeferredValue } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Trash2, Edit2, Eye, Link, Link2Off, UserPlus, Users, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useLocation } from 'wouter';

export default function AdminEmployees() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartment, setFilterDepartment] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'employees' | 'signins'>('signins');

  // Link user dialog state
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [linkingEmployeeId, setLinkingEmployeeId] = useState<number | null>(null);
  const [linkUserId, setLinkUserId] = useState('');

  // Link-from-user dialog (new sign-ins panel)
  const [isLinkFromUserOpen, setIsLinkFromUserOpen] = useState(false);
  const [linkingUserId, setLinkingUserId] = useState<number | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [assignMode, setAssignMode] = useState<'new' | 'existing'>('new');
  const [existingSearch, setExistingSearch] = useState('');

  // Defer search so typing doesn't block the UI
  const deferredSearch = useDeferredValue(searchQuery);

  // Server-side search — only fires when there's a query
  const { data: searchResults } = trpc.employee.search.useQuery(deferredSearch, {
    enabled: deferredSearch.length > 0,
  });

  // Server-side filter — only fires when a filter is active and no search
  const { data: filterResults } = trpc.employee.filter.useQuery(
    { department: filterDepartment || undefined, status: filterStatus || undefined, limit: 100, offset: 0 },
    { enabled: deferredSearch.length === 0 && (!!filterDepartment || !!filterStatus) }
  );

  // Base list — full dataset when no search/filter active
  const { data: employees = [], isLoading, refetch } = trpc.employee.list.useQuery(
    { limit: 100, offset: 0 },
    { enabled: deferredSearch.length === 0 && !filterDepartment && !filterStatus }
  );
  const { data: allUsers = [], refetch: refetchUsers } = trpc.user.list.useQuery();
  const { data: departments = [] } = trpc.department.list.useQuery();

  // Pick the right dataset based on active mode
  const displayEmployees: any[] =
    deferredSearch.length > 0 ? (searchResults ?? []) :
    (filterDepartment || filterStatus) ? (filterResults ?? []) :
    employees;

  // Users who have signed in but are NOT yet linked to any employee
  const linkedUserIds = new Set(employees.map((e: any) => e.userId).filter(Boolean));
  const unlinkedUsers = allUsers.filter((u: any) => !linkedUserIds.has(u.id) && u.role !== 'admin');
  // Employees that have no user linked (available to assign)
  const unlinkedEmployees = employees.filter((e: any) => e.userId === null);

  // Mutations
  const createMutation = trpc.employee.create.useMutation({
    onSuccess: () => { toast.success('Employee created successfully'); refetch(); setIsDialogOpen(false); setEditingId(null); },
    onError: (error) => toast.error(error.message || 'Failed to create employee'),
  });

  const updateMutation = trpc.employee.update.useMutation({
    onSuccess: () => { toast.success('Employee updated successfully'); refetch(); setIsDialogOpen(false); setEditingId(null); },
    onError: (error) => toast.error(error.message || 'Failed to update employee'),
  });

  const deleteMutation = trpc.employee.delete.useMutation({
    onSuccess: () => { toast.success('Employee deleted successfully'); refetch(); },
    onError: (error) => toast.error(error.message || 'Failed to delete employee'),
  });

  const linkUserMutation = trpc.employee.linkUser.useMutation({
    onSuccess: () => {
      toast.success('User linked to employee successfully');
      refetch(); refetchUsers();
      setIsLinkDialogOpen(false); setLinkUserId(''); setLinkingEmployeeId(null);
      setIsLinkFromUserOpen(false); setSelectedEmployeeId(''); setLinkingUserId(null);
    },
    onError: (error) => toast.error(error.message || 'Failed to link user'),
  });

  const unlinkUserMutation = trpc.employee.unlinkUser.useMutation({
    onSuccess: () => { toast.success('User unlinked from employee'); refetch(); refetchUsers(); },
    onError: (error) => toast.error(error.message || 'Failed to unlink user'),
  });

  // Create a brand-new employee and immediately link the user to it
  const createAndLinkMutation = trpc.employee.create.useMutation({
    onSuccess: async (_result, variables) => {
      await refetch();
      // Find the newly created employee by email and link the user
      const updated = await refetch();
      const newEmp = (updated.data as any[])?.find((e: any) => e.email === variables.email);
      if (newEmp && linkingUserId) {
        linkUserMutation.mutate({ employeeId: newEmp.id, userId: linkingUserId });
      } else {
        toast.success('Employee created — please link manually from the Employees tab');
        setIsLinkFromUserOpen(false);
      }
    },
    onError: (error) => toast.error(error.message || 'Failed to create employee'),
  });

  const handleCreateAndLink = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createAndLinkMutation.mutate({
      firstName: fd.get('firstName') as string,
      lastName: fd.get('lastName') as string,
      email: fd.get('email') as string,
      phone: fd.get('phone') as string || undefined,
      department: fd.get('department') as string,
      position: fd.get('position') as string,
      hireDate: fd.get('hireDate') as string,
      status: (fd.get('status') as any) || 'active',
      basicSalary: parseFloat(fd.get('basicSalary') as string),
    });
  };

  const selectedEmployee = editingId ? employees.find((e: any) => e.id === editingId) : null;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      email: formData.get('email') as string,
      phone: (formData.get('phone') as string) || undefined,
      department: formData.get('department') as string,
      position: formData.get('position') as string,
      hireDate: formData.get('hireDate') as string,
      status: (formData.get('status') as any) || 'active',
      basicSalary: parseFloat(formData.get('basicSalary') as string),
      reportingManager: (formData.get('reportingManager') as string) || undefined,
      dateOfBirth: (formData.get('dateOfBirth') as string) || undefined,
      address: (formData.get('address') as string) || undefined,
      city: (formData.get('city') as string) || undefined,
      state: (formData.get('state') as string) || undefined,
      zipCode: (formData.get('zipCode') as string) || undefined,
      country: (formData.get('country') as string) || undefined,
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleLinkUser = () => {
    const userId = parseInt(linkUserId);
    if (!linkingEmployeeId || isNaN(userId) || userId <= 0) return toast.error('Please enter a valid User ID');
    linkUserMutation.mutate({ employeeId: linkingEmployeeId, userId });
  };

  const handleLinkFromUser = () => {
    const empId = parseInt(selectedEmployeeId);
    if (!linkingUserId || isNaN(empId) || empId <= 0) return toast.error('Please select an employee');
    const emp = employees.find((e: any) => e.id === empId);
    if (emp?.userId !== null && emp?.userId !== linkingUserId) {
      if (!confirm(`${emp?.firstName} ${emp?.lastName} is already linked to User #${emp?.userId}. Replace the link?`)) return;
    }
    linkUserMutation.mutate({ employeeId: empId, userId: linkingUserId });
  };

  const openLinkFromUser = (userId: number) => {
    setLinkingUserId(userId);
    setSelectedEmployeeId('');
    setAssignMode('new');
    setExistingSearch('');
    setIsLinkFromUserOpen(true);
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Employee Management</h1>
          <p className="subtitle mt-2">Manage workforce and review new sign-ins</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setEditingId(null); }}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2" onClick={() => setEditingId(null)}>
              <Plus className="w-4 h-4" />
              Add Employee
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground uppercase">First Name</label>
                  <input type="text" name="firstName" defaultValue={selectedEmployee?.firstName} placeholder="First Name" required className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground uppercase">Last Name</label>
                  <input type="text" name="lastName" defaultValue={selectedEmployee?.lastName} placeholder="Last Name" required className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground uppercase">Email</label>
                <input type="email" name="email" defaultValue={selectedEmployee?.email} placeholder="Email" required className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground uppercase">Phone</label>
                  <input type="tel" name="phone" defaultValue={selectedEmployee?.phone || ''} placeholder="Phone" className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground uppercase">Status</label>
                  <select name="status" defaultValue={selectedEmployee?.status || 'active'} className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="on_leave">On Leave</option>
                    <option value="terminated">Terminated</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground uppercase">Department</label>
                  <select name="department" defaultValue={selectedEmployee?.department} required className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground">
                    <option value="">Select department</option>
                    {(departments as any[]).map((d: any) => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground uppercase">Position</label>
                  <input type="text" name="position" defaultValue={selectedEmployee?.position} placeholder="Position" required className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground uppercase">Hire Date</label>
                  <input type="date" name="hireDate" defaultValue={selectedEmployee?.hireDate ? new Date(selectedEmployee.hireDate).toISOString().split('T')[0] : ''} required className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground uppercase">Basic Salary</label>
                  <input type="number" name="basicSalary" defaultValue={selectedEmployee?.basicSalary} placeholder="Basic Salary" step="0.01" required className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground" />
                </div>
              </div>
              {/* Additional details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground uppercase">Date of Birth</label>
                  <input type="date" name="dateOfBirth" defaultValue={selectedEmployee?.dateOfBirth ? new Date(selectedEmployee.dateOfBirth).toISOString().split('T')[0] : ''} className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground uppercase">Reports To</label>
                  <input type="text" name="reportingManager" defaultValue={selectedEmployee?.reportingManager || ''} placeholder="Manager name" className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground uppercase">Address</label>
                <input type="text" name="address" defaultValue={selectedEmployee?.address || ''} placeholder="Street address" className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground uppercase">City</label>
                  <input type="text" name="city" defaultValue={selectedEmployee?.city || ''} placeholder="City" className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground uppercase">State</label>
                  <input type="text" name="state" defaultValue={selectedEmployee?.state || ''} placeholder="State" className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground uppercase">ZIP Code</label>
                  <input type="text" name="zipCode" defaultValue={selectedEmployee?.zipCode || ''} placeholder="ZIP / Postal code" className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground uppercase">Country</label>
                  <input type="text" name="country" defaultValue={selectedEmployee?.country || ''} placeholder="Country" className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground" />
                </div>
              </div>
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
                {editingId ? 'Update Employee' : 'Create Employee'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Link from employee side dialog */}
      <Dialog open={isLinkDialogOpen} onOpenChange={(open) => { setIsLinkDialogOpen(open); if (!open) { setLinkingEmployeeId(null); setLinkUserId(''); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Link User Account</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Enter the User ID to link to this employee.</p>
            <input type="number" value={linkUserId} onChange={(e) => setLinkUserId(e.target.value)} placeholder="User ID" className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground" />
            <div className="flex gap-2">
              <Button className="flex-1 bg-primary hover:bg-primary/90" onClick={handleLinkUser} disabled={linkUserMutation.isPending}>
                {linkUserMutation.isPending ? 'Linking...' : 'Link User'}
              </Button>
              <Button variant="outline" onClick={() => setIsLinkDialogOpen(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign user dialog — create new employee or link to existing */}
      <Dialog open={isLinkFromUserOpen} onOpenChange={(open) => { setIsLinkFromUserOpen(open); if (!open) { setLinkingUserId(null); setSelectedEmployeeId(''); setAssignMode('new'); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Assign Employee Profile</DialogTitle></DialogHeader>
          <div className="space-y-5">
            {/* User info card */}
            {(() => {
              const user = allUsers.find((u: any) => u.id === linkingUserId);
              return user ? (
                <div className="p-3 rounded-lg bg-muted/50 border text-sm flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary font-semibold">
                    {(user.name || user.email || '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">{user.name || '(No name)'}</p>
                    <p className="text-muted-foreground">{user.email}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Signed in: {formatDate(user.lastSignedIn)}</p>
                  </div>
                </div>
              ) : null;
            })()}

            {/* Mode toggle */}
            <div className="flex gap-1 p-1 bg-muted rounded-lg">
              <button
                onClick={() => setAssignMode('new')}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${assignMode === 'new' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Create New Employee
              </button>
              <button
                onClick={() => setAssignMode('existing')}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${assignMode === 'existing' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Link to Existing
              </button>
            </div>

            {/* CREATE NEW EMPLOYEE form */}
            {assignMode === 'new' && (() => {
              const user = allUsers.find((u: any) => u.id === linkingUserId);
              return (
                <form onSubmit={handleCreateAndLink} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground uppercase">First Name *</label>
                      <input name="firstName" required placeholder="First name" defaultValue={user?.name?.split(' ')[0] || ''} className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm placeholder-muted-foreground" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground uppercase">Last Name *</label>
                      <input name="lastName" required placeholder="Last name" defaultValue={user?.name?.split(' ').slice(1).join(' ') || ''} className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm placeholder-muted-foreground" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground uppercase">Email *</label>
                    <input name="email" type="email" required defaultValue={user?.email || ''} className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm placeholder-muted-foreground" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground uppercase">Department *</label>
                      <select name="department" required className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm">
                        <option value="">Select department</option>
                        {(departments as any[]).map((d: any) => (
                          <option key={d.id} value={d.name}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground uppercase">Position *</label>
                      <input name="position" required placeholder="e.g. Developer" className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm placeholder-muted-foreground" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground uppercase">Phone</label>
                      <input name="phone" placeholder="Phone number" className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm placeholder-muted-foreground" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground uppercase">Status</label>
                      <select name="status" className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm">
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="on_leave">On Leave</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground uppercase">Hire Date *</label>
                      <input name="hireDate" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground uppercase">Basic Salary *</label>
                      <input name="basicSalary" type="number" required placeholder="0.00" step="0.01" className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm placeholder-muted-foreground" />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90" disabled={createAndLinkMutation.isPending || linkUserMutation.isPending}>
                      {createAndLinkMutation.isPending ? 'Creating...' : 'Create & Link'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setIsLinkFromUserOpen(false)}>Cancel</Button>
                  </div>
                </form>
              );
            })()}

            {/* LINK TO EXISTING */}
            {assignMode === 'existing' && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Search and select an existing employee to link this user to.</p>
                <input
                  placeholder="Search by name or email..."
                  value={existingSearch}
                  onChange={(e) => setExistingSearch(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm placeholder-muted-foreground"
                />
                <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
                  {employees
                    .filter((emp: any) => {
                      const q = existingSearch.toLowerCase();
                      return !q || `${emp.firstName} ${emp.lastName} ${emp.email}`.toLowerCase().includes(q);
                    })
                    .map((emp: any) => (
                      <div
                        key={emp.id}
                        onClick={() => setSelectedEmployeeId(String(emp.id))}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedEmployeeId === String(emp.id) ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">{emp.firstName} {emp.lastName}</p>
                            <p className="text-xs text-muted-foreground">{emp.position} · {emp.department}</p>
                            <p className="text-xs text-muted-foreground">{emp.email}</p>
                          </div>
                          {emp.userId !== null ? (
                            <span className="text-xs text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full shrink-0">linked</span>
                          ) : (
                            <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full shrink-0">free</span>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
                <div className="flex gap-2 pt-1">
                  <Button className="flex-1 bg-primary hover:bg-primary/90" onClick={handleLinkFromUser} disabled={linkUserMutation.isPending || !selectedEmployeeId}>
                    {linkUserMutation.isPending ? 'Linking...' : 'Link to Selected'}
                  </Button>
                  <Button variant="outline" onClick={() => setIsLinkFromUserOpen(false)}>Cancel</Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('signins')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'signins' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <Clock className="w-4 h-4" />
          New Sign-ins
          {unlinkedUsers.length > 0 && (
            <span className="ml-1 bg-primary text-primary-foreground text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
              {unlinkedUsers.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('employees')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'employees' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <Users className="w-4 h-4" />
          All Employees
          <span className="ml-1 text-xs text-muted-foreground">({employees.length})</span>
        </button>
      </div>

      {/* NEW SIGN-INS TAB */}
      {activeTab === 'signins' && (
        <div className="space-y-4">
          {unlinkedUsers.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center text-muted-foreground">
                <UserPlus className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No pending sign-ins</p>
                <p className="text-sm mt-1">All signed-in users are already linked to employee profiles.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                These users have signed in but are not yet linked to an employee profile. Review and assign them.
              </p>
              <div className="grid gap-3">
                {unlinkedUsers.map((user: any) => (
                  <Card key={user.id}>
                    <CardContent className="py-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="text-primary font-semibold text-sm">
                              {(user.name || user.email || '?')[0].toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium text-sm">{user.name || '(No name set)'}</p>
                              <Badge variant="outline" className="text-xs">
                                {user.loginMethod || 'unknown'}
                              </Badge>
                              <Badge variant="secondary" className="text-xs text-amber-700 bg-amber-100 border-0">
                                Unassigned
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Last signed in: {formatDate(user.lastSignedIn)} · User ID: #{user.id}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Button
                            size="sm"
                            className="bg-primary hover:bg-primary/90 gap-1.5"
                            onClick={() => openLinkFromUser(user.id)}
                          >
                            <Link className="w-3.5 h-3.5" />
                            Assign Employee
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* EMPLOYEES TAB */}
      {activeTab === 'employees' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search employees..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground"
              />
            </div>
            <select value={filterDepartment} onChange={(e) => setFilterDepartment(e.target.value)} className="px-3 py-2 border border-border rounded-md bg-background text-foreground">
              <option value="">All Departments</option>
              {(departments as any[]).map((d: any) => (
                <option key={d.id} value={d.name}>{d.name}</option>
              ))}
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 border border-border rounded-md bg-background text-foreground">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="on_leave">On Leave</option>
              <option value="terminated">Terminated</option>
            </select>
          </div>

          {/* Stats bar */}
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>{employees.length} total</span>
            <span>·</span>
            <span className="text-green-600 font-medium">{employees.filter((e: any) => e.userId !== null).length} linked</span>
            <span>·</span>
            <span className="text-amber-600 font-medium">{employees.filter((e: any) => e.userId === null).length} not linked</span>
          </div>

          {/* Employee list */}
          <div className="grid gap-4">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              </div>
            ) : displayEmployees.length === 0 ? (
              <Card className="text-center py-12">
                <p className="text-muted-foreground">No employees found</p>
              </Card>
            ) : (
              displayEmployees.map((employee: any) => (
                <Card key={employee.id} className="card-scandinavian">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-lg font-semibold text-foreground">{employee.firstName} {employee.lastName}</h3>
                        {employee.userId !== null ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block"></span>
                            Linked · User #{employee.userId}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block"></span>
                            Not linked
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{employee.position}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">{employee.department}</span>
                        <span className={`text-xs px-2 py-1 rounded ${employee.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                          {employee.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">{employee.email}</p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" onClick={() => navigate(`/admin/employees/${employee.id}`)} title="View details">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" onClick={() => { setEditingId(employee.id); setIsDialogOpen(true); }} title="Edit employee">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      {employee.userId !== null ? (
                        <Button variant="ghost" size="sm" className="text-amber-600 hover:text-amber-700" onClick={() => { if (confirm('Unlink this user account from the employee?')) unlinkUserMutation.mutate(employee.id); }} title="Unlink user account">
                          <Link2Off className="w-4 h-4" />
                        </Button>
                      ) : (
                        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700" onClick={() => { setLinkingEmployeeId(employee.id); setLinkUserId(''); setIsLinkDialogOpen(true); }} title="Link user account">
                          <Link className="w-4 h-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive/80" onClick={() => { if (confirm('Delete this employee?')) deleteMutation.mutate(employee.id); }} title="Delete employee">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
