import { Bell, CheckCheck } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { notificationService } from "@/services/notification.service";
import { formatSpecificationForPrint } from "@/components/reports/helpers/specificationFormatter";
import { PlanningRequests } from "@/components/notifications/PlanningRequests";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CustomerNotificationActions } from "@/components/notifications/CustomerNotificationActions";
import {
  useCustomerNotifications,
  useMarkCustomerNotificationRead,
} from "@/hooks/useNotifications";
import { useAuth } from "@/hooks/useAuth";
import { canEditCustomerModule } from "@/lib/permissions";
import type { NotificationEvent } from "@/types/notifications";

export function Notifications() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const selectedNotification = searchParams.get("notification");
  const detail = useQuery({ queryKey: ["customer-notifications", user?.user.organization_id, "detail", selectedNotification],
    queryFn: () => notificationService.getNotification(selectedNotification!), enabled: Boolean(selectedNotification) });
  const notificationsQuery = useCustomerNotifications({ limit: 200 });
  const markRead = useMarkCustomerNotificationRead();
  const notifications = selectedNotification ? (detail.data ? [detail.data] : []) : notificationsQuery.data?.notifications ?? [];
  const unreadCount = notificationsQuery.data?.unread_count ?? notifications.filter((item) => !item.read_by_customer).length;
  const canUpdateNotifications = canEditCustomerModule(
    user?.user,
    "customer_notifications",
    user?.roles
  );

  return (
    <div className="w-full max-w-5xl space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">Notifications</h2>
          <p className="mt-1 text-muted-foreground">
            Calibration updates for your organization.
          </p>
        </div>
        <Badge variant="primary">{unreadCount} unread</Badge>
      </div>

      {(notificationsQuery.isError || detail.isError) && <p role="alert">Unable to load notifications.</p>}
      {(notificationsQuery.isLoading || (selectedNotification && detail.isLoading)) ? (
        <Card>
          <CardContent className="py-14 text-center text-muted-foreground">
            Loading notifications...
          </CardContent>
        </Card>
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="py-14 text-center text-muted-foreground">
            No notifications.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <NotificationCard
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
      <PlanningRequests />
    </div>
  );
}

function NotificationCard({
  notification,
  canMarkRead,
  onMarkRead,
}: {
  notification: NotificationEvent;
  canMarkRead: boolean;
  onMarkRead: () => void;
}) {
  return (
    <Card className={notification.read_by_customer ? "border-border/70" : "border-primary/40"}>
      <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
              notification.read_by_customer ? "bg-muted" : "bg-primary/10 text-primary"
            }`}
          >
            <Bell className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <CardTitle className="text-base leading-6">
              {notification.title}
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {notification.message}
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
              <Badge variant="outline">{notification.gauge_count} gauges</Badge>
              <Badge variant="outline">{notification.delivery_status}</Badge>
              <span className="py-0.5">{formatDateTime(notification.sent_at || notification.created_at)}</span>
            </div>
          </div>
        </div>
        {!notification.read_by_customer && canMarkRead ? (
          <Button variant="outline" size="sm" onClick={onMarkRead}>
            <CheckCheck className="h-4 w-4" />
            Mark read
          </Button>
        ) : null}
      </CardHeader>
      <CardContent>
        {notification.snapshots?.length ? <details className="mb-3 text-sm"><summary className="cursor-pointer">View due gauges ({notification.snapshots.length})</summary>
          <ul className="mt-2 space-y-2">{notification.snapshots.map(s => <li key={s.cycle_key}>
            {s.laboratory_name} · {s.gauge_name} · {s.identification_number ?? "—"} · Due {s.due_date} · Last calibrated {s.last_calibration_date}
            <p className="text-xs text-muted-foreground">Serial: {s.manf_serial_number || "—"} · {formatSpecificationForPrint(s.specifications, s.unit || "mm")} · Certificate: {s.last_certificate_no || "—"}</p>
          </li>)}</ul></details> : null}
        <CustomerNotificationActions notification={notification} />
      </CardContent>
    </Card>
  );
}

function formatDateTime(value?: string | null) {
  if (!value) return "Now";

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
