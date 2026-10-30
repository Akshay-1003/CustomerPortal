import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CustomerNotificationActions } from "@/components/notifications/CustomerNotificationActions";
import { PlanningRequests } from "@/components/notifications/PlanningRequests";
import { ReminderPreferences } from "@/components/notifications/ReminderPreferences";
import { notificationService } from "@/services/notification.service";
import type { NotificationEvent, ReminderPreferences as Preferences } from "@/types/notifications";

const state = vi.hoisted(() => ({ canEdit: true, mutate: vi.fn() }));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: { user: { organization_id: "customer", role: "org_admin" }, roles: ["org_admin"] } }) }));
vi.mock("@/lib/permissions", () => ({ canEditCustomerModule: () => state.canEdit }));
vi.mock("@/hooks/useNotifications", () => ({ useRespondToNotification: () => ({ mutate: state.mutate, isPending: false }) }));
vi.mock("@/services/notification.service", () => ({ notificationService: { getRequests: vi.fn(), getRequest: vi.fn(), cancelRequest: vi.fn(), getPreferences: vi.fn(), savePreferences: vi.fn() } }));

const notification: NotificationEvent = {
  id: "notification", organization_id: "customer", organization_name: "Customer One", title: "Due gauges", message: "Review gauges",
  gauge_count: 3, reminder_type: "7_days", channel: "Portal", delivery_status: "sent", response_status: "pending",
  read_by_customer: false, read_by_internal: true, requires_customer_response: true, pending_calibration_request: false, priority: "normal",
};

afterEach(() => { cleanup(); vi.clearAllMocks(); state.canEdit = true; });

describe("Customer reminders", () => {
  it("displays accepted/skipped results and the request tracking link", () => {
    render(<MemoryRouter><CustomerNotificationActions notification={{ ...notification, response_status: "yes_plan_calibration",
      planning_request_id: "request", accepted_count: 2, skipped_count: 1 }} /></MemoryRouter>);
    expect(screen.getByText("2 accepted; 1 skipped.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Track request" })).toHaveAttribute("href", "/notifications?request=request#calibration-requests");
  });

  it("submits the current notification without selecting unrelated gauges", () => {
    render(<MemoryRouter><CustomerNotificationActions notification={notification} /></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: "Yes, Plan Calibration" }));
    expect(state.mutate).toHaveBeenCalledWith({ notificationId: "notification", response: "yes_plan_calibration" }, expect.any(Object));
  });

  it("does not expose response actions to a read-only user", () => {
    state.canEdit = false;
    render(<MemoryRouter><CustomerNotificationActions notification={notification} /></MemoryRouter>);
    expect(screen.queryByRole("button", { name: "Yes, Plan Calibration" })).not.toBeInTheDocument();
  });

  it("shows the planned date and cancels using the current request version", async () => {
    vi.mocked(notificationService.getRequests).mockResolvedValue({ total_count: 1, requests: [{
      id: "request", organization_id: "customer", organization_name: "Customer One", laboratory_id: "lab",
      status: "scheduled", version: 2, planned_date: "2026-11-01", accepted_count: 1, created_at: "2026-10-30", history: [], items: [],
    }] });
    vi.mocked(notificationService.cancelRequest).mockResolvedValue({ id: "request", organization_id: "customer", organization_name: "Customer One", laboratory_id: "lab",
      status: "cancelled", version: 3, accepted_count: 1, created_at: "2026-10-30", history: [], items: [] });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<MemoryRouter><QueryClientProvider client={client}><PlanningRequests /></QueryClientProvider></MemoryRouter>);
    expect(await screen.findByText("Planned date: 2026-11-01")).toBeInTheDocument();
    fireEvent.change(screen.getByRole("textbox", { name: "Cancellation reason" }), { target: { value: "Reschedule later" } });
    fireEvent.click(screen.getByRole("button", { name: "Cancel request" }));
    await waitFor(() => expect(notificationService.cancelRequest).toHaveBeenCalledWith("request", 2, "Reschedule later"));
  });

  it("saves customer email opt-outs rather than only changing the local switch", async () => {
    const preferences: Preferences = { organization_id: "customer", laboratory_id: "lab", laboratory_name: "Test laboratory",
      in_app_enabled: true, email_reminders_enabled: true, whatsapp_reminders_enabled: false,
      reminder_timing: { seven_days_before: true }, recipient_emails: ["quality@example.com"], whatsapp_numbers: [],
      whatsapp_consents: {}, customer_opt_outs: [], timezone: "Asia/Kolkata", delivery_time: "09:00" };
    vi.mocked(notificationService.getPreferences).mockResolvedValue([preferences]);
    vi.mocked(notificationService.savePreferences).mockResolvedValue({ ...preferences, email_reminders_enabled: false, customer_opt_outs: ["Email"] });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={client}><ReminderPreferences /></QueryClientProvider>);
    fireEvent.click(await screen.findByRole("switch", { name: "Email" }));
    fireEvent.click(screen.getByRole("button", { name: "Save preferences" }));
    await waitFor(() => expect(notificationService.savePreferences).toHaveBeenCalledWith(expect.objectContaining({
      email_reminders_enabled: false, customer_opt_outs: ["Email"],
    })));
  });
});
