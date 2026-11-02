import { addDays, addMonths, format, subMonths } from "date-fns"
import type { Gauge, GaugeHistory, Organization, User } from "@/types/api"
import type { NotificationEvent, ReminderPreferences, ReminderType } from "@/types/notifications"
import type { PlanningRequest, ReminderSnapshot, RequestStatus } from "@/types/planningRequests"
import type { CalibrationPlanningDetail } from "@/types/calibrationPlanning"
import { DEMO_DATA_KEY } from "./session"
import { EMPTY_ACCEPTANCE_FIELDS, type AcceptanceRow, type AcceptanceDecision } from "@/types/gaugeAcceptance"

export const CUSTOMER_ID = "demo-customer"
export const LABS = ["demo-lab-pune", "demo-lab-kolhapur"]
export const LAB_NAMES = ["Demo Metrology · Pune", "Demo Metrology · Kolhapur"]
export const day = (value: Date) => format(value, "yyyy-MM-dd")
export const organization: Organization = { id: CUSTOMER_ID, name: "Demo Precision Industries", code: "DEMO",
  address: { address_line_1: "Sample Industrial Estate", city: "Pune", state: "Maharashtra", country: "India", zip_code: "411001" },
  contacts: [{ name: "Demo Customer", email: "customer@example.invalid" }] }
export const demoUser: User = { id: "demo-user", username: "demo.customer", email: "customer@example.invalid",
  first_name: "Demo", last_name: "Customer", organization_id: CUSTOMER_ID, lab_id: LABS[0], role: "org_admin",
  password: "", phone: "", department: "Quality Assurance" }

export type DemoTransaction = { id: string; gauge_ids: string[]; date: string; received_date?: string; number: number }
export type DemoDelivery = { id: string; notification_id: string; laboratory_id: string; status: "sent" | "delivered" | "read" | "failed" | "suppressed"; reason?: string }
export type DemoState = { version: 1; anchor: string; gauges: Gauge[]; histories: Record<string, GaugeHistory[]>;
  notifications: NotificationEvent[]; requests: PlanningRequest[]; preferences: ReminderPreferences[];
  transactions: DemoTransaction[]; deliveries: DemoDelivery[]; formatNumber: string;
  acceptances: AcceptanceRow[]; acceptanceBatches: Record<string, string> }

export function snapshot(gauge: Gauge): ReminderSnapshot {
  const labIndex = Number(gauge.id.replace(/\D/g, "")) % 2
  return { gauge_id: gauge.id, cycle_key: `${gauge.id}:${gauge.next_calibration_date}`, gauge_name: gauge.master_gauge_name,
    identification_number: gauge.identification_number, manf_serial_number: gauge.manf_serial_number,
    due_date: gauge.next_calibration_date!, last_calibration_date: gauge.certificate_issue_date!,
    last_certificate_no: `DEMO-CAL-${gauge.identification_number}`, calibration_frequency: gauge.calibration_frequency,
    calibration_frequency_unit: gauge.calibration_frequency_unit, laboratory_id: LABS[labIndex],
    laboratory_name: LAB_NAMES[labIndex], specifications: gauge.specifications, unit: gauge.unit }
}

export function makeNotification(items: ReminderSnapshot[], milestone: ReminderType, id: string, at = new Date()): NotificationEvent {
  return { id, organization_id: CUSTOMER_ID, organization_name: organization.name, laboratory_id: items[0]?.laboratory_id,
    title: `${items[0]?.laboratory_name ?? "Demo laboratory"}: ${milestone.replaceAll("_", " ")} reminder`,
    message: `${items.length} gauges require calibration planning. This is a simulated reminder.`, gauge_count: items.length,
    reminder_type: milestone, channel: "Portal", delivery_status: "sent", response_status: "pending",
    read_by_customer: false, read_by_internal: true, requires_customer_response: true,
    pending_calibration_request: false, priority: milestone === "overdue" ? "high" : "normal",
    sent_at: at.toISOString(), created_at: at.toISOString(), snapshots: structuredClone(items), action_url: `/notifications?notification=${id}` }
}

export function createDemoState(now = new Date()): DemoState {
  const names = ["Digital Caliper", "External Micrometer", "Plunger Dial", "Height Gauge", "Bore Gauge", "Paddle Plug Gauge", "Pressure Gauge", "Dial Snap Gauge"]
  const gauges: Gauge[] = Array.from({ length: 50 }, (_, i) => {
    const special = [-21, -14, -7, 0, 7, 15, 30, 7, 15, 30]
    const due = i < special.length ? addDays(now, special[i]) : new Date(now.getFullYear(), i % 12, 5 + (i % 20))
    const last = subMonths(due, 12)
    return { id: `demo-gauge-${i + 1}`, archived: i === 49, deleted_at: null, created_at: last.toISOString(), updated_at: now.toISOString(),
      client_org_id: CUSTOMER_ID, master_gauge_id: `demo-master-${i % names.length}`, scope_master_id: "demo-scope",
      certificate_type_id: "demo-cert-type", gauge_class: "Class I", identification_number: `QA-${String(i + 1).padStart(3, "0")}`,
      calibration_frequency: 12, calibration_frequency_unit: "months", make: ["Mitutoyo", "Baker", "Insize"][i % 3],
      manf_serial_number: `DEMO-SN-${1000 + i}`, least_count: "0.01", unit: i % names.length === 6 ? "bar" : "mm",
      calibration_location_type: "permanent_facility", calibration_location: "Quality laboratory", calibration_done_under: "NABL",
      gauge_condition: i === 48 ? "Damaged" : "Good", specifications: { range: { min: 0, max: i % names.length === 3 ? 600 : 150 }, least_count: "0.01" },
      master_gauge: names[i % names.length], master_gauge_name: names[i % names.length], certificate_type: "NABL",
      client_organization: organization.name, client_org_name: organization.name,
      status: i >= 10 && i % 3 === 0 && day(due) <= day(now) ? "calibration_completed" : day(due) < day(now) ? "calibration_expired" : "calibration_due",
      certificate_issue_date: day(last), next_calibration_date: day(due), reference_standard: "Demo traceable reference standard", part_name: "Inspection" }
  })
  const histories = Object.fromEntries(gauges.map((g, i) => [g.id, Array.from({ length: 3 }, (_, cycle): GaugeHistory => {
    const date = subMonths(new Date(`${g.certificate_issue_date}T12:00:00`), cycle * 12)
    return { id: `demo-history-${i}-${cycle}`, gauge_id: g.id, action: cycle === 1 && i % 7 === 0 ? "Repair" : "Calibration",
      performed_by: snapshot(g).laboratory_name!, date: day(date), certificate_issue_date: day(date), next_calibration_date: day(addMonths(date, 12)),
      result: cycle === 1 && i % 7 === 0 ? "Fail" : "Pass", notes: "Demonstration record. Not a valid calibration certificate.",
      certificate: `DEMO/${date.getFullYear()}/${i + 1}`, inward_gauge_lab_id: `DEMO-LAB-${i + 1}`,
      gauge_condition: "Good", status: "completed", through: i % 2 ? "Direct" : "Veeresha SPM" }
  })]))
  const preferences: ReminderPreferences[] = LABS.map((id, i) => ({ organization_id: CUSTOMER_ID, laboratory_id: id,
    laboratory_name: LAB_NAMES[i], in_app_enabled: true, email_reminders_enabled: false, whatsapp_reminders_enabled: true,
    reminder_timing: { "30_days": true, "15_days": true, "7_days": true, due_date: true, overdue: true },
    recipient_emails: [], whatsapp_numbers: ["+12025550123"], whatsapp_consents: { "+12025550123": true },
    customer_opt_outs: [], timezone: "Asia/Kolkata", delivery_time: "09:00" }))
  const requests: PlanningRequest[] = (["submitted", "acknowledged", "scheduled", "in_progress", "completed", "cancelled"] as RequestStatus[]).map((status, i) => ({
    id: `demo-request-${i}`, organization_id: CUSTOMER_ID, organization_name: organization.name, laboratory_id: LABS[i % 2],
    status, version: 1, accepted_count: 1, items: [{ snapshot: snapshot(gauges[40 + i]) }],
    planned_date: day(addDays(now, i + 1)), note: "Sample laboratory update for this workflow stage.",
    created_at: addDays(now, -i).toISOString(), history: [{ status, at: now.toISOString(), note: "Demo workflow example" }] }))
  const notifications = (["30_days", "15_days", "7_days", "due_date", "overdue"] as ReminderType[]).map((milestone, i) =>
    makeNotification([snapshot(gauges[[6, 5, 4, 3, 0][i]])], milestone, `demo-notification-${i}`, addDays(now, -i)))
  const transactions = Array.from({ length: 24 }, (_, i): DemoTransaction => {
    const sent = new Date(now.getFullYear(), now.getMonth() - i % 12, Math.min(now.getDate(), 2 + i % 18))
    const returned = addDays(sent, 5)
    return { id: `demo-transaction-${i}`, number: 1001 + i, date: day(sent),
      received_date: i % 2 === 0 ? day(returned > now ? now : returned) : undefined,
      gauge_ids: i % 2 ? [gauges[20 + Math.floor(i / 2)].id] : [gauges[32 + Math.floor(i / 2)].id] }
  })
  for (const transaction of transactions.filter(t => !t.received_date)) {
    for (const id of transaction.gauge_ids) gauges.find(g => g.id === id)!.status = "inward_pending"
  }
  const deliveries: DemoDelivery[] = notifications.map((n, i) => ({ id: `demo-delivery-${i}`, notification_id: n.id,
    laboratory_id: n.laboratory_id!, status: (["sent", "delivered", "read", "failed", "suppressed"] as const)[i],
    reason: i === 3 ? "Simulated provider failure" : i === 4 ? "Simulated missing consent" : undefined }))
  const state: DemoState = { version: 1, anchor: day(now), gauges, histories, notifications, requests, preferences, transactions, deliveries, formatNumber: "DEMO/HC/01", acceptances: [], acceptanceBatches: {} }
  for (const [i, transaction] of transactions.filter(t => t.received_date).entries()) {
    const row = createAcceptanceSource(state, transaction, transaction.gauge_ids[0])
    if (i < 7) {
      const decision: AcceptanceDecision = i < 4 ? (i === 1 ? "conditional_accept" : "accept") : (["not_ok", "damaged", "repair"] as const)[i - 4]
      row.decision = decision; row.status = i < 4 ? "accepted" : "rejected"; row.version = 1
      const values = { ...EMPTY_ACCEPTANCE_FIELDS, history_card_number: `DEMO-HC-${i + 1}`, gauge_location: "Inspection bay", part_name: "Housing", acceptance_criteria: "Suitable for intended inspection", maintenance_details: "Customer inspected on receipt",
        decision, remark_note: decision === "accept" ? "Verified" : "Demo exception noted", status: row.status, version: 1,
        certificate_id: row.certificate_id, certificate_revision: 1, gauge_id: row.gauge_id, updated_at: now.toISOString(), reviewed_by: "demo-user" }
      row.review = { ...values, history: [{ ...values, correction_reason: "" }] }
      row.prefill = values
      histories[row.gauge_id][0].customer_acceptance = row.review
    }
    state.acceptances.push(row)
  }
  return state
}

export function createAcceptanceSource(state: DemoState, transaction: DemoTransaction, gaugeId: string): AcceptanceRow {
  const gauge = state.gauges.find(g => g.id === gaugeId)!
  const s = snapshot(gauge)
  const id = `demo-return-${transaction.id}-${gaugeId}`
  if (state.histories[gaugeId]?.[0]) state.histories[gaugeId][0].acceptance_required = true
  return { outward_gauge_id: id, certificate_id: `demo-certificate-${id}`, certificate_revision: 1, version: 0,
    gauge_id: gaugeId, gauge_inward_id: `demo-cycle-${id}`, organization_id: CUSTOMER_ID,
    laboratory_id: s.laboratory_id!, laboratory_name: s.laboratory_name!, inward_no: transaction.number,
    outward_no: transaction.number, inward_gauge_lab_id: `DEMO-${gauge.identification_number}`,
    through: Number(gaugeId.replace(/\D/g, "")) % 2 ? "Direct" : "Veeresha SPM", gauge_name: gauge.master_gauge_name,
    identification_number: gauge.identification_number, manf_serial_number: gauge.manf_serial_number,
    process: "calibration", status: "pending", decision: null, review: null, prefill: { ...EMPTY_ACCEPTANCE_FIELDS }, requires_review: true }
}

export function demoVisibleGauge(state: DemoState, gauge: Gauge): Gauge {
  const row = [...state.acceptances].reverse().find(r => r.gauge_id === gauge.id)
  if (!row) return gauge
  const previous = state.histories[gauge.id]?.find(h => !h.acceptance_required || h.customer_acceptance)
  return { ...gauge, pending_acceptance: !row.review, customer_acceptance: row.review ?? previous?.customer_acceptance,
    ...(!row.review ? { certificate_issue_date: previous?.certificate_issue_date, next_calibration_date: previous?.next_calibration_date } : {}) }
}

export function loadDemoState(): DemoState {
  try {
    const saved = JSON.parse(sessionStorage.getItem(DEMO_DATA_KEY) ?? "null") as DemoState | null
    if (saved?.version === 1 && saved.acceptances) return saved
  } catch { /* A reset recovers invalid browser demo data. */ }
  const state = createDemoState()
  saveDemoState(state)
  return state
}
export function saveDemoState(state: DemoState) { sessionStorage.setItem(DEMO_DATA_KEY, JSON.stringify(state)) }

export function planningRows(state: DemoState, year: number): CalibrationPlanningDetail[] {
  return state.gauges.map(g => demoVisibleGauge(state, g)).filter(g => !g.archived && g.next_calibration_date?.startsWith(String(year))).map(g => {
    const days = Math.round((new Date(`${g.next_calibration_date}T12:00:00`).getTime() - new Date(`${state.anchor}T12:00:00`).getTime()) / 86400000)
    const completed = g.status === "calibration_completed"
    return { id: snapshot(g).cycle_key, gauge_id: g.id, gauge_name: g.master_gauge_name, identification_number: g.identification_number,
      calibration_frequency: g.calibration_frequency, calibration_frequency_unit: g.calibration_frequency_unit,
      frequency_label: "12 months", last_calibration_date: g.certificate_issue_date!, last_certificate_no: `DEMO-CAL-${g.identification_number}`,
      due_date: g.next_calibration_date!, days_remaining: days, completed_date: completed ? g.next_calibration_date : null,
      completion_certificate_no: completed ? `DEMO-NEW-${g.identification_number}` : null,
      status: completed ? "completed" : days < 0 ? "overdue" : days <= 30 ? "due_soon" : "upcoming" }
  })
}
