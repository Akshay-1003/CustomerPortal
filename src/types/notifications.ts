export type NotificationChannel = "Portal" | "Email" | "WhatsApp";
export type ReminderType = "30_days" | "15_days" | "7_days" | "due_date" | "overdue";
export type DeliveryStatus = "upcoming" | "sent" | "failed" | "responded";
export type CustomerResponseStatus =
  | "pending"
  | "yes_plan_calibration"
  | "not_now"
  | "none";

export interface NotificationEvent {
  laboratory_id?: string;
  planning_request_id?: string | null;
  snapshots?: import("./planningRequests").ReminderSnapshot[];
  accepted_count?: number;
  skipped_count?: number;
  skipped?: Array<{ gauge_id: string; reason: string }>;
  id: string;
  organization_id: string;
  organization_name: string;
  title: string;
  message: string;
  gauge_count: number;
  reminder_type: ReminderType | null;
  channel: NotificationChannel;
  delivery_status: DeliveryStatus;
  response_status: CustomerResponseStatus;
  response_label?: string | null;
  response_at?: string | null;
  response_note?: string | null;
  scheduled_at?: string | null;
  sent_at?: string | null;
  read_by_customer: boolean;
  read_by_internal: boolean;
  action_url?: string | null;
  related_entity_type?: string | null;
  related_entity_id?: string | null;
  requires_customer_response: boolean;
  pending_calibration_request: boolean;
  priority: "low" | "normal" | "high";
  created_at?: string | null;
  updated_at?: string | null;
}

export interface NotificationListResponse {
  unread_count?: number;
  notifications: NotificationEvent[];
  total_count: number;
}

export type CustomerNotificationResponse = "yes_plan_calibration" | "not_now";

export interface ReminderPreferences {
  laboratory_name?: string | null;
  organization_id: string;
  laboratory_id: string;
  in_app_enabled: boolean;
  email_reminders_enabled: boolean;
  whatsapp_reminders_enabled: boolean;
  reminder_timing: Record<string, boolean>;
  recipient_emails: string[];
  whatsapp_numbers: string[];
  whatsapp_consents: Record<string, boolean>;
  customer_opt_outs: string[];
  timezone: string;
  delivery_time: string;
}

