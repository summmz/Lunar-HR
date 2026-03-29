import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Building2, Plus, Pencil, Trash2, Users } from "lucide-react";

type Department = {
  id: number;
  name: string;
  description?: string | null;
  createdAt: Date | string;
};

type DepartmentForm = {
  name: string;
  description: string;
};

const emptyForm: DepartmentForm = { name: "", description: "" };

export default function AdminDepartments() {
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Department | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null);
  const [form, setForm] = useState<DepartmentForm>(emptyForm);

  const { data: departments = [], isLoading, refetch } = trpc.department.list.useQuery();
  const { data: employees = [] } = trpc.employee.list.useQuery({ limit: 500, offset: 0 });

  const countByDept = (name: string) =>
    (employees as any[]).filter((e: any) => e.department === name).length;

  const createMutation = trpc.department.create.useMutation({
    onSuccess: () => {
      toast.success("Department created");
      setCreateOpen(false);
      setForm(emptyForm);
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.department.update.useMutation({
    onSuccess: () => {
      toast.success("Department updated");
      setEditTarget(null);
      setForm(emptyForm);
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.department.delete.useMutation({
    onSuccess: () => {
      toast.success("Department deleted");
      setDeleteTarget(null);
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const openCreate = () => {
    setForm(emptyForm);
    setCreateOpen(true);
  };

  const openEdit = (dept: Department) => {
    setForm({ name: dept.name, description: dept.description ?? "" });
    setEditTarget(dept);
  };

  const submitCreate = () => {
    if (!form.name.trim()) return toast.error("Department name is required");
    createMutation.mutate({ name: form.name.trim(), description: form.description || undefined });
  };

  const submitEdit = () => {
    if (!editTarget) return;
    if (!form.name.trim()) return toast.error("Department name is required");
    updateMutation.mutate({ id: editTarget.id, name: form.name.trim(), description: form.description || undefined });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Departments</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your organisation's departments
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          New Department
        </Button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Departments</p>
                <p className="text-2xl font-bold mt-1">{departments.length}</p>
              </div>
              <Building2 className="h-8 w-8 text-primary opacity-70" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Employees</p>
                <p className="text-2xl font-bold mt-1">{employees.length}</p>
              </div>
              <Users className="h-8 w-8 text-primary opacity-70" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Department list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Departments</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : departments.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-3 opacity-25" />
              <p className="font-medium">No departments yet</p>
              <p className="text-sm mt-1">Create your first department to get started.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {(departments as Department[]).map((dept) => {
                const count = countByDept(dept.name);
                return (
                  <div
                    key={dept.id}
                    className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{dept.name}</p>
                        {dept.description && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {dept.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {count} employee{count !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => openEdit(dept)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setDeleteTarget(dept)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={(o) => { if (!o) { setCreateOpen(false); setForm(emptyForm); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Department</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Name *</label>
              <Input
                placeholder="e.g. Engineering"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && submitCreate()}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                placeholder="Optional description..."
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateOpen(false); setForm(emptyForm); }}>
              Cancel
            </Button>
            <Button onClick={submitCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editTarget} onOpenChange={(o) => { if (!o) { setEditTarget(null); setForm(emptyForm); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Department</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Name *</label>
              <Input
                placeholder="e.g. Engineering"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && submitEdit()}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                placeholder="Optional description..."
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditTarget(null); setForm(emptyForm); }}>
              Cancel
            </Button>
            <Button onClick={submitEdit} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Department</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong>?
              {countByDept(deleteTarget?.name ?? "") > 0 && (
                <span className="block mt-2 text-amber-600 dark:text-amber-400 font-medium">
                  ⚠ {countByDept(deleteTarget?.name ?? "")} employee(s) are currently assigned to this department.
                  Their department field will remain but won't match any managed department until updated.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
