import { apiService } from "@/services/api.service";
import type {
  CustomerNotificationResponse,
  NotificationEvent,
  NotificationListResponse,
} from "@/types/notifications";

export const notificationService = {
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
      { response }
    );
  },
};
