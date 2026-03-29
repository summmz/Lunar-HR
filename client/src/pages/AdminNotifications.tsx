import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Bell, Check, CheckCheck, CalendarDays, UserPlus, DollarSign, FileText, Info } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

const TYPE_META: Record<string, { label: string; icon: any; color: string; link?: string }> = {
  leave_request:    { label: "Leave Request",    icon: CalendarDays, color: "text-amber-500",  link: "/admin/leave" },
  employee_added:   { label: "New Employee",     icon: UserPlus,     color: "text-green-500"  },
  salary_changed:   { label: "Salary Change",    icon: DollarSign,   color: "text-blue-500"   },
  document_uploaded:{ label: "Document",         icon: FileText,     color: "text-purple-500" },
  other:            { label: "Info",             icon: Info,         color: "text-muted-foreground" },
};

export default function AdminNotifications() {
  const [search, setSearch] = useState("");
  const [, navigate] = useLocation();

  const { data: notifications = [], refetch } = trpc.notification.list.useQuery({ limit: 200 });

  const markAsRead = trpc.notification.markAsRead.useMutation({
    onSuccess: () => refetch(),
  });

  const markAllAsRead = trpc.notification.markAllAsRead.useMutation({
    onSuccess: () => { toast.success("All notifications marked as read"); refetch(); },
    onError: () => toast.error("Failed to mark notifications as read"),
  });

  const filtered = (notifications as any[]).filter((n: any) =>
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.content.toLowerCase().includes(search.toLowerCase())
  );

  const unreadCount = (notifications as any[]).filter((n: any) => !n.isRead).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
              : "All caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            onClick={() => markAllAsRead.mutate()}
            disabled={markAllAsRead.isPending}
            className="gap-2 shrink-0"
          >
            <CheckCheck className="h-4 w-4" />
            Mark All as Read
          </Button>
        )}
      </div>

      <Input
        placeholder="Search notifications..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md"
      />

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Bell className="w-12 h-12 text-muted-foreground mb-4 opacity-30" />
              <p className="font-medium text-muted-foreground">No notifications found</p>
            </CardContent>
          </Card>
        ) : (
          filtered.map((n: any) => {
            const meta = TYPE_META[n.type] ?? TYPE_META.other;
            const Icon = meta.icon;
            return (
              <div
                key={n.id}
                className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${
                  n.isRead ? "bg-card opacity-60" : "bg-card border-primary/40 shadow-sm"
                }`}
              >
                <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${n.isRead ? "bg-muted" : "bg-primary/10"}`}>
                  <Icon className={`h-4 w-4 ${n.isRead ? "text-muted-foreground" : meta.color}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`font-medium text-sm ${n.isRead ? "text-muted-foreground" : "text-foreground"}`}>
                      {n.title}
                    </p>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                      {meta.label}
                    </Badge>
                    {!n.isRead && (
                      <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{n.content}</p>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {new Date(n.createdAt).toLocaleString("en-IN", {
                      day: "numeric", month: "short", year: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {meta.link && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs gap-1.5"
                      onClick={() => navigate(meta.link)}
                    >
                      <Icon className="h-3 w-3" />
                      View
                    </Button>
                  )}
                  {!n.isRead && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      title="Mark as read"
                      onClick={() => markAsRead.mutate(n.id)}
                      disabled={markAsRead.isPending}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
