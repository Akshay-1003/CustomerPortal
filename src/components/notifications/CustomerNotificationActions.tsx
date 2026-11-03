import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRespondToNotification } from "@/hooks/useNotifications";
import { useAuth } from "@/hooks/useAuth";
import { canEditCustomerModule } from "@/lib/permissions";
import type { NotificationEvent } from "@/types/notifications";

export function CustomerNotificationActions({
  notification,
  onActionComplete,
}: {
  notification: NotificationEvent;
  onActionComplete?: () => void;
}) {
  const { user } = useAuth();
  const respondToNotification = useRespondToNotification();
  const canSubmitResponse = canEditCustomerModule(
    user?.user,
    "customer_notifications",
    user?.roles
  );
  const canRespond =
    notification.requires_customer_response &&
    canSubmitResponse &&
    (notification.response_status === "pending" || notification.response_status === "none");
  const actionUrl = notification.action_url || "/reports/calibration-due-report";

  if (!canRespond) {
    if (notification.response_status === "yes_plan_calibration") {
      return <div className="space-y-2"><Badge variant="primary">Calibration request submitted</Badge>
        <p className="text-xs">{notification.accepted_count ?? notification.gauge_count} accepted; {notification.skipped_count ?? 0} skipped.</p>
        <Link className="text-sm text-primary underline" to={`/notifications?request=${notification.planning_request_id ?? ""}#calibration-requests`}>Track request</Link></div>;
    }

    if (notification.response_status === "not_now") {
      return <Badge variant="secondary">Not Now</Badge>;
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button asChild variant="outline" size="sm">
        <Link to={actionUrl} onClick={onActionComplete}>
            {notification.planning_request_id ? "Track request" : notification.event_type && notification.event_type !== "calibration.reminder" ? "View details" : "View Due Gauges"}
        </Link>
      </Button>
      {canRespond ? (
        <>
          <Button
            size="sm"
            disabled={respondToNotification.isPending}
            onClick={() =>
              respondToNotification.mutate(
                {
                  notificationId: notification.id,
                  response: "yes_plan_calibration",
                },
                { onSuccess: onActionComplete }
              )
            }
          >
            Yes, Plan Calibration
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={respondToNotification.isPending}
            onClick={() =>
              respondToNotification.mutate(
                {
                  notificationId: notification.id,
                  response: "not_now",
                },
                { onSuccess: onActionComplete }
              )
            }
          >
            Not Now
          </Button>
        </>
      ) : null}
    </div>
  );
}
