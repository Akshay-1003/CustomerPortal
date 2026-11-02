import { beforeEach, afterEach, describe, expect, it, vi } from "vitest"
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter } from "react-router-dom"
import { apiService } from "@/services/api.service"
import { authService } from "@/services/auth.service"
import { gaugeService } from "@/services/gauge.service"
import { notificationService } from "@/services/notification.service"
import { calibrationPlanningService } from "@/services/calibrationPlanning.service"
import { dashboardService } from "@/services/dashboard.service"
import { mastersService } from "@/services/masters.service"
import { createDemoState, loadDemoState, saveDemoState, CUSTOMER_ID, LABS, snapshot, makeNotification, type DemoState } from "@/demo/data"
import { DemoControls, DemoTransactions } from "@/components/DemoControls"
import App from "@/App"
import { AuthProvider } from "@/contexts/AuthContext"
import { ThemeProvider } from "@/components/ThemeProvider"
import { acceptanceService } from "@/services/gaugeAcceptance.service"

beforeEach(() => {
  sessionStorage.clear()
  sessionStorage.setItem("customerportal.demo-session", "active")
  saveDemoState(createDemoState(new Date(2026, 5, 15, 12)))
  vi.spyOn(XMLHttpRequest.prototype, "open").mockImplementation(() => { throw new Error("Live network is forbidden in demo tests") })
})
afterEach(() => { cleanup(); apiService.clearLocalAuthState(false); sessionStorage.clear(); vi.restoreAllMocks() })

describe("isolated customer showcase", () => {
  it("restores a demo administrator without a backend account or network requests", async () => {
    const context = await authService.restoreSession()
    expect(context.organization_id).toBe(CUSTOMER_ID)
    expect(context.user.role).toBe("org_admin")
    expect(apiService.getAuthToken()).toMatch(/\.demo$/)
    expect(XMLHttpRequest.prototype.open).not.toHaveBeenCalled()
  })

  it("has 50 searchable gauges and consistent data in every month", async () => {
    const page = await gaugeService.getGaugesByOrganization(CUSTOMER_ID, 2, 10)
    expect(page.total).toBe(50)
    expect(page.data).toHaveLength(10)
    expect((await gaugeService.getGaugesByOrganization(CUSTOMER_ID, 1, 50, "QA-025")).data).toHaveLength(1)
    const overview = await calibrationPlanningService.getOverview(2026)
    expect(overview.months).toHaveLength(12)
    expect(overview.months.every(m => m.planned > 0)).toBe(true)
    expect(overview.months.reduce((sum, m) => sum + m.planned, 0)).toBe(overview.summary.total_planned)
    expect(overview.months.every(m => m.weekly_plan?.reduce((a, b) => a + b, 0) === m.planned)).toBe(true)
    const monthly = await dashboardService.getMonthlyCalibration({ year: 2026 })
    const daily = await dashboardService.getDailyCalibration({ year: 2026, month: 6 })
    expect(Object.values(daily).reduce((a, b) => a + b.planned, 0)).toBe(monthly.June.planned)
    const history = await gaugeService.getGaugeHistory(page.data[0].id)
    expect(history).toHaveLength(3)
    expect(history[0].certificate_url).toMatch(/^data:application\/pdf/)
    expect(XMLHttpRequest.prototype.open).not.toHaveBeenCalled()
  })

  it("groups live reminders by laboratory and prevents repeat milestone messages", async () => {
    const first = await apiService.post<{ created: number }>("/demo/reminder", { milestone: "overdue" })
    expect(first.created).toBe(2)
    const again = await apiService.post<{ created: number }>("/demo/reminder", { milestone: "overdue" })
    expect(again.created).toBe(0)
    const live = loadDemoState().notifications.filter(n => n.id.startsWith("demo-live"))
    expect(new Set(live.map(n => n.laboratory_id)).size).toBe(2)
    for (const batch of live) expect(batch.snapshots?.every(s => s.laboratory_id === batch.laboratory_id)).toBe(true)
  })

  it("supports read, plan, idempotent repeated submission, cancellation, and laboratory progress", async () => {
    const id = "demo-notification-2"
    await notificationService.markCustomerNotificationRead(id)
    expect((await notificationService.getNotification(id)).read_by_customer).toBe(true)
    const first = await notificationService.respondToNotification(id, "yes_plan_calibration")
    const repeated = await notificationService.respondToNotification(id, "yes_plan_calibration")
    expect(repeated.planning_request_id).toBe(first.planning_request_id)
    expect((await notificationService.getRequests()).total_count).toBe(7)
    const planned = await notificationService.getRequest(first.planning_request_id!)
    const cancelled = await notificationService.cancelRequest(planned.id, planned.version, "Demo reschedule")
    expect(cancelled.status).toBe("cancelled")
    await expect(notificationService.cancelRequest(planned.id, planned.version, "Again")).rejects.toThrow()
    for (const status of ["acknowledged", "scheduled", "in_progress", "completed"]) {
      const updated = await apiService.post<{ status: string }>("/demo/advance-request", { id: "demo-request-0" })
      expect(updated.status).toBe(status)
    }
    expect(loadDemoState().notifications[0].requires_customer_response).toBe(false)
  })

  it("keeps Not Now scoped to its notification and honors opt-outs and WhatsApp consent", async () => {
    await notificationService.respondToNotification("demo-notification-0", "not_now")
    expect((await notificationService.getNotification("demo-notification-1")).response_status).toBe("pending")
    const preferences = await notificationService.getPreferences()
    await notificationService.savePreferences({ ...preferences[0], whatsapp_consents: {} })
    await notificationService.savePreferences({ ...preferences[1], in_app_enabled: false, customer_opt_outs: ["Portal", "WhatsApp"] })
    await apiService.post("/demo/reminder", { milestone: "overdue" })
    const state = loadDemoState()
    expect(state.notifications.some(n => n.id.startsWith(`demo-live-${LABS[1]}`))).toBe(false)
    expect(state.deliveries.filter(d => d.notification_id.startsWith("demo-live")).every(d => d.status === "suppressed")).toBe(true)
  })

  it("resumes future weekly reminders after Not Now or cancellation and starts a new cycle after completion", async () => {
    await notificationService.respondToNotification("demo-notification-4", "not_now")
    const response = await notificationService.respondToNotification("demo-notification-2", "yes_plan_calibration")
    const record = await notificationService.getRequest(response.planning_request_id!)
    await notificationService.cancelRequest(record.id, record.version, "Try next week")
    const oldCycle = snapshot(loadDemoState().gauges[40]).cycle_key
    for (let i = 0; i < 4; i++) await apiService.post("/demo/advance-request", { id: "demo-request-0" })
    expect(snapshot(loadDemoState().gauges[40]).cycle_key).not.toBe(oldCycle)
    await apiService.post("/demo/advance-week", {})
    await apiService.post("/demo/advance-week", {})
    const state = loadDemoState()
    expect(state.anchor).toBe("2026-06-29")
    const liveItems = state.notifications.filter(n => n.id.startsWith("demo-live")).flatMap(n => n.snapshots ?? [])
    expect(liveItems.some(s => s.gauge_id === "demo-gauge-1")).toBe(true)
    expect(liveItems.some(s => s.gauge_id === "demo-gauge-5")).toBe(true)
    expect(liveItems.some(s => s.cycle_key === oldCycle)).toBe(false)
  })

  it("simulates sent, delivered, read and failed WhatsApp outcomes without messaging", async () => {
    for (const status of ["delivered", "read", "failed"]) {
      await apiService.post("/demo/delivery-status", { id: "demo-delivery-0", status })
      expect(loadDemoState().deliveries[0].status).toBe(status)
    }
    expect(XMLHttpRequest.prototype.open).not.toHaveBeenCalled()
  })

  it("dispatches and receives gauges, updates history/due dates, and rejects stale reminders", async () => {
    const gauge = loadDemoState().gauges[18]
    const dispatch = await apiService.post<{ id: string }>("/demo/dispatch", { gauge_id: gauge.id })
    await expect(apiService.post("/demo/dispatch", { gauge_id: gauge.id })).rejects.toThrow("already sent")
    const state = loadDemoState()
    state.notifications.unshift(makeNotification([snapshot(gauge)], "7_days", "stale-notification"))
    saveDemoState(state)
    await apiService.post("/demo/receive", { id: dispatch.id })
    const updated = await gaugeService.getGaugeById(gauge.id)
    expect(updated.status).toBe("calibration_completed")
    expect(updated.pending_acceptance).toBe(true)
    const returned = loadDemoState().acceptances.find(r => r.gauge_id === gauge.id)!
    await acceptanceService.review(returned, { decision: "accept", remark_note: "", fields: {}, correction_reason: "", idempotency_key: "demo-accept-return" })
    expect((await gaugeService.getGaugeById(gauge.id)).next_calibration_date).not.toBe(gauge.next_calibration_date)
    expect((await gaugeService.getGaugeHistory(gauge.id))[0].notes).toContain("Received")
    await expect(notificationService.respondToNotification("stale-notification", "yes_plan_calibration")).rejects.toThrow("No eligible")
    await expect(apiService.post("/demo/receive", { id: dispatch.id })).rejects.toThrow()
    expect((await apiService.get<unknown[]>("/outwards")).length).toBe(13)
  })

  it("persists settings and gauge CRUD within the demo and fails closed for unsupported APIs", async () => {
    await authService.restoreSession()
    await mastersService.upsertHistoryCardFormatNumber("DEMO/UPDATED")
    expect(await mastersService.getHistoryCardFormatNumber()).toBe("DEMO/UPDATED")
    const state = loadDemoState()
    const created = await apiService.post<DemoState["gauges"][number]>("/gauge", { ...state.gauges[0], identification_number: "NEW-DEMO" })
    expect(created.id).not.toBe(state.gauges[0].id)
    await apiService.put(`/gauge/${created.id}`, { identification_number: "EDITED-DEMO" })
    expect((await gaugeService.getGaugeById(created.id)).identification_number).toBe("EDITED-DEMO")
    await apiService.delete(`/gauge/${created.id}`)
    expect(loadDemoState().gauges).toHaveLength(50)
    await expect(apiService.post("/never-send-to-real-backend", {})).rejects.toThrow("unavailable in the demo")
    expect(XMLHttpRequest.prototype.open).not.toHaveBeenCalled()
  })

  it("leaves normal API requests untouched outside demo mode and blocks leaked demo tokens", async () => {
    sessionStorage.removeItem("customerportal.demo-session")
    const adapter = vi.fn(async config => ({ data: { live: true }, status: 200, statusText: "OK", headers: {}, config }))
    expect(await apiService.get("/example", { adapter })).toEqual({ live: true })
    expect(adapter).toHaveBeenCalledOnce()
    apiService.setAuthToken("local.demo", false)
    await expect(apiService.get("/example", { adapter })).rejects.toThrow("cannot access the live API")
    expect(adapter).toHaveBeenCalledOnce()
  })

  it("exposes showcase controls and changes transaction data through the existing API boundary", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(<QueryClientProvider client={client}><MemoryRouter><DemoControls /><DemoTransactions direction="received" /></MemoryRouter></QueryClientProvider>)
    await waitFor(() => expect(screen.getByRole("button", { name: "Simulate receipt" })).toBeEnabled())
    fireEvent.click(screen.getByRole("button", { name: "Simulate receipt" }))
    await waitFor(() => expect(loadDemoState().transactions.filter(t => t.received_date)).toHaveLength(13))
    fireEvent.click(screen.getByRole("button", { name: "Simulate reminder" }))
    await waitFor(() => expect(loadDemoState().notifications.length).toBeGreaterThan(5))
    expect(screen.getByText("Demo workspace")).toBeInTheDocument()
    client.clear()
  })

  it("opens the real authenticated customer notification page using only demo services", async () => {
    Object.defineProperty(window, "matchMedia", { configurable: true, writable: true, value: vi.fn(() => ({
      matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn(),
    })) })
    window.history.replaceState({}, "", "/notifications")
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const view = render(<QueryClientProvider client={client}><AuthProvider><ThemeProvider defaultTheme="light"><App /></ThemeProvider></AuthProvider></QueryClientProvider>)
    expect(await screen.findByRole("heading", { name: "Notifications" })).toBeInTheDocument()
    expect(await screen.findByRole("heading", { name: "Your calibration requests" })).toBeInTheDocument()
    fireEvent.click(screen.getAllByRole("button", { name: "Yes, Plan Calibration" })[0])
    await waitFor(() => expect(loadDemoState().requests).toHaveLength(7))
    expect(XMLHttpRequest.prototype.open).not.toHaveBeenCalled()
    view.unmount()
    client.clear()
  })
})
