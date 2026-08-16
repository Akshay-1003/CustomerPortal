import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { authService } from "@/services/auth.service";
import { notificationService } from "@/services/notification.service";
import type { CustomerNotificationResponse } from "@/types/notifications";

const notificationKeys = {
  all: ["customer-notifications"] as const,
  list: (organizationId: string | null, filters?: Record<string, unknown>) =>
    [...notificationKeys.all, organizationId, { filters }] as const,
};

export function useCustomerNotifications(options?: {
  unreadOnly?: boolean;
  limit?: number;
}) {
  const organizationId = authService.getOrganizationId();

  return useQuery({
    queryKey: notificationKeys.list(organizationId, options),
    queryFn: () =>
      notificationService.getCustomerNotifications({
        organizationId: organizationId!,
        unreadOnly: options?.unreadOnly,
        limit: options?.limit,
      }),
    enabled: Boolean(organizationId),
    refetchInterval: 60_000,
  });
}

export function useMarkCustomerNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      notificationId,
      read,
    }: {
      notificationId: string;
      read?: boolean;
    }) => notificationService.markCustomerNotificationRead(notificationId, read ?? true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useRespondToNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      notificationId,
      response,
    }: {
      notificationId: string;
      response: CustomerNotificationResponse;
    }) => notificationService.respondToNotification(notificationId, response),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      toast.success(
        variables.response === "yes_plan_calibration"
          ? "Calibration request sent"
          : "Response sent"
      );
    },
    onError: () => {
      toast.error("Failed to send response");
    },
  });
}

