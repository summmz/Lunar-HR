import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { Bell, CheckCheck, ArrowLeft, BellRing } from "lucide-react";

type Notification = {
  id: number;
  title: string;
  content: string;
  type: string;
  isRead: boolean;
  createdAt: string | Date;
};

export default function UserNotifications() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Notification | null>(null);
  const utils = trpc.useUtils();

  const { data: notifications = [] } = trpc.notification.list.useQuery({ limit: 100 });

  const markAsRead = trpc.notification.markAsRead.useMutation({
    onSuccess: () => utils.notification.list.invalidate(),
  });

  const markAllAsRead = trpc.notification.markAllAsRead.useMutation({
    onSuccess: () => utils.notification.list.invalidate(),
  });

  // Mark all as read when page opens
  useEffect(() => {
    const unread = (notifications as any[]).filter((n: any) => !n.isRead);
    if (unread.length > 0) {
      markAllAsRead.mutate();
    }
  }, [notifications.length]);

  const filtered = (notifications as Notification[]).filter((n) =>
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.content.toLowerCase().includes(search.toLowerCase())
  );

  const unreadCount = (notifications as Notification[]).filter((n) => !n.isRead).length;

  const handleOpen = (n: Notification) => {
    setSelected(n);
    if (!n.isRead) markAsRead.mutate(n.id);
  };

  const typeLabel: Record<string, string> = {
    employee_added: "Employee",
    salary_changed: "Payroll",
    document_uploaded: "Document",
    leave_request: "Leave",
    other: "General",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllAsRead.mutate()}
            disabled={markAllAsRead.isPending}
          >
            <CheckCheck className="w-4 h-4 mr-2" />
            Mark all as read
          </Button>
        )}
      </div>

      <Input
        placeholder="Search notifications..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md"
      />

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No notifications yet</p>
            </CardContent>
          </Card>
        ) : (
          filtered.map((n) => (
            <Card
              key={n.id}
              onClick={() => handleOpen(n)}
              className={`cursor-pointer transition-all hover:border-primary/50 hover:shadow-md ${
                n.isRead ? "opacity-60" : "border-primary"
              }`}
            >
              <CardContent className="pt-5 pb-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {!n.isRead && (
                        <span className="shrink-0 w-2 h-2 rounded-full bg-primary" />
                      )}
                      <h3 className="font-semibold text-foreground leading-tight">{n.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{n.content}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(n.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground border border-border rounded px-2 py-0.5 mt-0.5">
                    {typeLabel[n.type] ?? "General"}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                <BellRing className="w-4 h-4 text-primary" />
              </div>
              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                  {typeLabel[selected?.type ?? ""] ?? "General"}
                </span>
                <DialogTitle className="text-lg leading-tight mt-0.5">
                  {selected?.title}
                </DialogTitle>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 pt-1">
            <p className="text-sm text-foreground leading-relaxed">{selected?.content}</p>
            <p className="text-xs text-muted-foreground border-t border-border pt-3">
              {selected && new Date(selected.createdAt).toLocaleString(undefined, {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="outline" size="sm" onClick={() => setSelected(null)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
