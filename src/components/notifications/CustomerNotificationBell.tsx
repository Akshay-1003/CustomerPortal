import { Link } from "react-router-dom";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CustomerNotificationActions } from "@/components/notifications/CustomerNotificationActions";
import {
  useCustomerNotifications,
  useMarkCustomerNotificationRead,
} from "@/hooks/useNotifications";
import { useAuth } from "@/hooks/useAuth";
import { canEditCustomerModule } from "@/lib/permissions";
import type { NotificationEvent } from "@/types/notifications";

export function CustomerNotificationBell() {
  const { user } = useAuth();
  const notificationsQuery = useCustomerNotifications({ limit: 25 });
  const markRead = useMarkCustomerNotificationRead();
  const notifications = notificationsQuery.data?.notifications ?? [];
  const unreadCount = notifications.filter((item) => !item.read_by_customer).length;
  const canUpdateNotifications = canEditCustomerModule(
    user?.user,
    "customer_notifications",
    user?.roles
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative shrink-0">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 ? (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[11px] font-semibold text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[min(380px,calc(100vw-1rem))] p-0">
        <div className="border-b px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Notifications</p>
              <p className="text-xs text-muted-foreground">
                {unreadCount} unread
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/notifications">View All</Link>
            </Button>
          </div>
        </div>

        <div className="max-h-[420px] overflow-y-auto p-2">
          {notificationsQuery.isLoading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No notifications.
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.slice(0, 6).map((notification) => (
                <NotificationPreview
                  key={notification.id}
                  notification={notification}
                  canMarkRead={canUpdateNotifications}
                  onMarkRead={() =>
                    markRead.mutate({
                      notificationId: notification.id,
                      read: true,
                    })
                  }
                />
              ))}
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NotificationPreview({
  notification,
  canMarkRead,
  onMarkRead,
}: {
  notification: NotificationEvent;
  canMarkRead: boolean;
  onMarkRead: () => void;
}) {
  return (
    <div className="rounded-lg border bg-background p-3 shadow-sm">
      <div className="flex items-start gap-3">
        <span
          className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
            notification.read_by_customer ? "bg-muted" : "bg-primary"
          }`}
        />
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="text-sm font-semibold leading-5 text-foreground">
              {notification.title}
            </p>
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
              {notification.message}
            </p>
            <p className="mt-2 text-[11px] font-medium text-muted-foreground">
              {formatDateTime(notification.sent_at || notification.created_at)}
            </p>
          </div>
          <CustomerNotificationActions notification={notification} />
          {!notification.read_by_customer && canMarkRead ? (
            <Button variant="ghost" size="sm" className="h-7 px-2" onClick={onMarkRead}>
              <CheckCheck className="h-3.5 w-3.5" />
              Mark read
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function formatDateTime(value?: string | null) {
  if (!value) return "Now";

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
