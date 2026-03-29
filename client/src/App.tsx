import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import BlobCursor from "./components/BlobCursor";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import Home from "./pages/Home";
import AdminDashboard from "./pages/AdminDashboard";
import AdminEmployees from "./pages/AdminEmployees";
import AdminDepartments from "./pages/AdminDepartments";
import EmployeeDetails from "./pages/EmployeeDetails";
import AdminPayroll from "./pages/AdminPayroll";
import AdminSettings from "./pages/AdminSettings";
import AdminLeave from "./pages/AdminLeave";
import AdminAttendance from "./pages/AdminAttendance";
import UserDashboard from "./pages/UserDashboard";
import UserSettings from "./pages/UserSettings";
import AdminNotifications from "./pages/AdminNotifications";
import UserNotifications from "./pages/UserNotifications";
import UserSalary from "./pages/UserSalary";
import UserChat from "./pages/UserChat";
import UserLeave from "./pages/UserLeave";
import UserAttendance from "./pages/UserAttendance";

/** Renders children only for admins; redirects everyone else to their dashboard */
function AdminOnly({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Redirect to="/" />;
  if (user.role !== "admin") return <Redirect to="/user/dashboard" />;
  return <>{children}</>;
}

/** Renders children only for authenticated users; redirects guests to home */
function AuthOnly({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Redirect to="/" />;
  return <>{children}</>;
}

function Router() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/" component={Home} />

      {/* Admin Routes — guarded: admin role required */}
      <Route path="/admin/dashboard">
        {() => (<AdminOnly><DashboardLayout><AdminDashboard /></DashboardLayout></AdminOnly>)}
      </Route>
      <Route path="/admin/employees">
        {() => (<AdminOnly><DashboardLayout><AdminEmployees /></DashboardLayout></AdminOnly>)}
      </Route>
      <Route path="/admin/departments">
        {() => (<AdminOnly><DashboardLayout><AdminDepartments /></DashboardLayout></AdminOnly>)}
      </Route>
      <Route path="/admin/employees/:id">
        {() => (<AdminOnly><DashboardLayout><EmployeeDetails /></DashboardLayout></AdminOnly>)}
      </Route>
      <Route path="/admin/payroll">
        {() => (<AdminOnly><DashboardLayout><AdminPayroll /></DashboardLayout></AdminOnly>)}
      </Route>
      <Route path="/admin/leave">
        {() => (<AdminOnly><DashboardLayout><AdminLeave /></DashboardLayout></AdminOnly>)}
      </Route>
      <Route path="/admin/attendance">
        {() => (<AdminOnly><DashboardLayout><AdminAttendance /></DashboardLayout></AdminOnly>)}
      </Route>
      <Route path="/admin/settings">
        {() => (<AdminOnly><DashboardLayout><AdminSettings /></DashboardLayout></AdminOnly>)}
      </Route>
      <Route path="/admin/notifications">
        {() => (<AdminOnly><DashboardLayout><AdminNotifications /></DashboardLayout></AdminOnly>)}
      </Route>

      {/* User Routes — guarded: any authenticated user */}
      <Route path="/user/dashboard">
        {() => (<AuthOnly><DashboardLayout><UserDashboard /></DashboardLayout></AuthOnly>)}
      </Route>
      <Route path="/user/leave">
        {() => (<AuthOnly><DashboardLayout><UserLeave /></DashboardLayout></AuthOnly>)}
      </Route>
      <Route path="/user/attendance">
        {() => (<AuthOnly><DashboardLayout><UserAttendance /></DashboardLayout></AuthOnly>)}
      </Route>
      <Route path="/user/salary">
        {() => (<AuthOnly><DashboardLayout><UserSalary /></DashboardLayout></AuthOnly>)}
      </Route>
      <Route path="/user/chat">
        {() => (<AuthOnly><DashboardLayout><UserChat /></DashboardLayout></AuthOnly>)}
      </Route>
      <Route path="/user/settings">
        {() => (<AuthOnly><DashboardLayout><UserSettings /></DashboardLayout></AuthOnly>)}
      </Route>
      <Route path="/user/profile">
        {() => (<AuthOnly><DashboardLayout><UserSettings /></DashboardLayout></AuthOnly>)}
      </Route>
      <Route path="/user/notifications">
        {() => (<AuthOnly><DashboardLayout><UserNotifications /></DashboardLayout></AuthOnly>)}
      </Route>

      {/* Legacy redirects — use Wouter Redirect, not window.location */}
      <Route path="/dashboard">
        {() => {
          if (!user) return <Redirect to="/" />;
          return <Redirect to={user.role === "admin" ? "/admin/dashboard" : "/user/dashboard"} />;
        }}
      </Route>
      <Route path="/employees">
        {() => <Redirect to={user?.role === "admin" ? "/admin/employees" : "/"} />}
      </Route>
      <Route path="/payroll">
        {() => <Redirect to={user?.role === "admin" ? "/admin/payroll" : "/"} />}
      </Route>

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <BlobCursor />
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
