import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, TrendingDown, Calendar, ArrowUpRight } from "lucide-react";

export default function UserSalary() {
  const { data: employee } = trpc.employee.myEmployee.useQuery();
  const { data: salaryHistory = [], isLoading } = trpc.salaryHistory.getByEmployeeId.useQuery(
    employee?.id ?? 0,
    { enabled: !!employee?.id }
  );

  const formatCurrency = (val: any) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(parseFloat(val) || 0);

  const latestSalary = salaryHistory[0];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Salary Overview</h1>
        <p className="subtitle mt-1">Your compensation history and details</p>
      </div>

      {/* Current Salary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="card-scandinavian">
          <div className="flex items-start justify-between">
            <div>
              <p className="subtitle">Current Basic Salary</p>
              <p className="text-3xl font-bold text-foreground mt-2">
                {employee ? formatCurrency(employee.basicSalary) : "—"}
              </p>
            </div>
            <div className="shape-circle-md bg-primary/20 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="card-scandinavian">
          <div className="flex items-start justify-between">
            <div>
              <p className="subtitle">Allowances</p>
              <p className="text-3xl font-bold text-green-500 mt-2">
                {employee ? formatCurrency(employee.allowances) : "—"}
              </p>
            </div>
            <div className="shape-circle-md bg-green-500/20 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-500" />
            </div>
          </div>
        </Card>

        <Card className="card-scandinavian">
          <div className="flex items-start justify-between">
            <div>
              <p className="subtitle">Deductions</p>
              <p className="text-3xl font-bold text-destructive mt-2">
                {employee ? formatCurrency(employee.deductions) : "—"}
              </p>
            </div>
            <div className="shape-circle-md bg-destructive/20 flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-destructive" />
            </div>
          </div>
        </Card>
      </div>

      {/* Net Salary */}
      {employee && (
        <Card className="card-scandinavian border-primary/30 bg-primary/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="subtitle">Estimated Net Salary</p>
              <p className="text-4xl font-bold text-primary mt-2">
                {formatCurrency(
                  parseFloat(employee.basicSalary || "0") +
                  parseFloat(employee.allowances || "0") -
                  parseFloat(employee.deductions || "0")
                )}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Basic + Allowances − Deductions</p>
            </div>
            <ArrowUpRight className="w-10 h-10 text-primary/40" />
          </div>
        </Card>
      )}

      {/* Salary History */}
      <Card className="card-scandinavian">
        <h2 className="text-xl font-semibold text-foreground mb-4">Salary History</h2>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : salaryHistory.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No salary history records found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {salaryHistory.map((record: any, idx: number) => {
              const isIncrease = parseFloat(record.newBasicSalary) > parseFloat(record.previousBasicSalary);
              return (
                <div
                  key={record.id || idx}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/40 border border-border"
                >
                  <div className="flex items-center gap-4">
                    <div className={`shape-circle-sm flex items-center justify-center ${isIncrease ? "bg-green-500/20" : "bg-destructive/20"}`}>
                      {isIncrease
                        ? <TrendingUp className="w-4 h-4 text-green-500" />
                        : <TrendingDown className="w-4 h-4 text-destructive" />}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {formatCurrency(record.previousBasicSalary)} → {formatCurrency(record.newBasicSalary)}
                      </p>
                      {record.reason && (
                        <p className="text-xs text-muted-foreground mt-0.5">{record.reason}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={isIncrease ? "default" : "destructive"} className="mb-1">
                      {isIncrease ? "+" : ""}
                      {formatCurrency(parseFloat(record.newBasicSalary) - parseFloat(record.previousBasicSalary))}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {record.effectiveDate
                        ? new Date(record.effectiveDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
                        : "—"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
