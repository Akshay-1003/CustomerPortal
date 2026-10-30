import { apiService } from "@/services/api.service";
import type {
  CustomerNotificationResponse,
  NotificationEvent,
  NotificationListResponse,
} from "@/types/notifications";

export const notificationService = {
  getPreferences() {
    return apiService.get<import("@/types/notifications").ReminderPreferences[]>("/customer/notification-settings");
  },
  savePreferences(p: import("@/types/notifications").ReminderPreferences) {
    return apiService.put<import("@/types/notifications").ReminderPreferences>(`/customer/notification-settings/${p.laboratory_id}`, p);
  },
  getNotification(id: string) {
    return apiService.get<NotificationEvent>(`/customer/notifications/${id}`);
  },
  getRequests(page = 0) {
    return apiService.get<{ requests: import("@/types/planningRequests").PlanningRequest[]; total_count: number }>("/customer/calibration-requests", { params: { page } });
  },
  getRequest(id: string) {
    return apiService.get<import("@/types/planningRequests").PlanningRequest>(`/customer/calibration-requests/${id}`);
  },
  cancelRequest(id: string, version: number, reason: string) {
    return apiService.patch<import("@/types/planningRequests").PlanningRequest>(`/customer/calibration-requests/${id}`, { status: "cancelled", version, reason });
  },
  getCustomerNotifications(params: {
    organizationId: string;
    unreadOnly?: boolean;
    limit?: number;
  }) {
    return apiService.get<NotificationListResponse>("/customer/notifications", {
      params: {
        organization_id: params.organizationId,
        unread_only: params.unreadOnly,
        limit: params.limit ?? 100,
      },
    });
  },

  markCustomerNotificationRead(notificationId: string, read = true) {
    return apiService.patch<NotificationEvent>(
      `/customer/notifications/${notificationId}/read`,
      { read }
    );
  },

  respondToNotification(
    notificationId: string,
    response: CustomerNotificationResponse
  ) {
    return apiService.post<NotificationEvent>(
      `/customer/notifications/${notificationId}/response`,
      { response, idempotency_key: `notification:${notificationId}:plan` }
    );
  },
};
