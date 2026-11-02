import { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from "axios"
import { jsPDF } from "jspdf"
import { addDays, addMonths } from "date-fns"
import type { Gauge, GaugeHistory } from "@/types/api"
import type { CalibrationPlanningDetail } from "@/types/calibrationPlanning"
import type { ReminderType, ReminderPreferences } from "@/types/notifications"
import type { PlanningRequest, RequestStatus } from "@/types/planningRequests"
import { CUSTOMER_ID, LABS, demoUser, organization, day, loadDemoState, saveDemoState, snapshot, makeNotification, planningRows, createAcceptanceSource, demoVisibleGauge, type DemoState } from "./data"
import { demoAcceptance, replaceDemoCertificate } from "./acceptance"

function requireRecord<T>(value: T | undefined): T {
  if (!value) throw new Error("Demo record not found")
  return value
}
function counts(rows: CalibrationPlanningDetail[]) {
  return { total_planned: rows.length, completed: rows.filter(r => r.status === "completed").length,
    due_soon: rows.filter(r => r.status === "due_soon").length, upcoming: rows.filter(r => r.status === "upcoming").length,
    overdue: rows.filter(r => r.status === "overdue").length }
}
function token() {
  const encode = (value: object) => btoa(JSON.stringify(value)).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "")
  // Deliberately unsigned and accepted only by the browser demo adapter.
  return `${encode({ alg: "none", typ: "JWT" })}.${encode({ sub: demoUser.id, organization_id: CUSTOMER_ID,
    portal: "customer", roles: ["org_admin"], jti: "local-demo", exp: Math.floor(Date.now() / 1000) + 86400 })}.demo`
}
function certificate(gauge: Gauge, history: GaugeHistory) {
  const pdf = new jsPDF()
  pdf.setFontSize(20)
  pdf.text("DEMONSTRATION CERTIFICATE", 15, 25)
  pdf.setFontSize(12)
  pdf.text(["Sample data only - not valid for calibration or compliance.", "", organization.name,
    gauge.master_gauge_name, `Identification: ${gauge.identification_number}`, `Serial: ${gauge.manf_serial_number}`,
    `Certificate: ${history.certificate}`, `Calibration date: ${history.certificate_issue_date}`,
    `Next due: ${history.next_calibration_date}`, `Result: ${history.result.toUpperCase()} (simulated)`], 15, 45)
  return pdf.output("datauristring")
}
function notification(state: DemoState, id: string) { return requireRecord(state.notifications.find(n => n.id === id)) }
function request(state: DemoState, id: string) { return requireRecord(state.requests.find(r => r.id === id)) }
function completeCalibration(state: DemoState, gaugeId: string) {
  const gauge = requireRecord(state.gauges.find(g => g.id === gaugeId))
  if (gauge.status === "calibration_completed" && gauge.certificate_issue_date === state.anchor) return
  gauge.status = "calibration_completed"
  gauge.certificate_issue_date = state.anchor
  gauge.next_calibration_date = day(addMonths(new Date(`${state.anchor}T12:00:00`), gauge.calibration_frequency))
  state.histories[gauge.id] ??= []
  state.histories[gauge.id].unshift({ id: crypto.randomUUID(), gauge_id: gauge.id, date: state.anchor,
    action: "Calibration", performed_by: "Demo laboratory", result: "Pass", notes: "Received simulated calibration results",
    certificate: `DEMO-RETURN-${gauge.identification_number}-${state.anchor}`, certificate_issue_date: state.anchor,
    next_calibration_date: gauge.next_calibration_date })
}
function sendMilestone(state: DemoState, milestone: ReminderType) {
  let created = 0
  for (const lab of LABS) {
    const preference = requireRecord(state.preferences.find(p => p.laboratory_id === lab))
    if (!preference.reminder_timing[milestone]) continue
    const offsets = { "30_days": 30, "15_days": 15, "7_days": 7, due_date: 0, overdue: -7 }
    const expectedDue = day(addDays(new Date(`${state.anchor}T12:00:00`), offsets[milestone]))
    const items = state.gauges.filter(g => !g.archived && g.gauge_condition !== "Damaged" && g.status !== "inward_pending" && snapshot(g).laboratory_id === lab
      && (milestone === "overdue" ? g.next_calibration_date! < state.anchor : g.next_calibration_date === expectedDue)
      && !state.requests.some(r => !["completed", "cancelled"].includes(r.status) && r.items.some(i => i.snapshot.cycle_key === snapshot(g).cycle_key)))
      .map(snapshot)
    const id = `demo-live-${lab}-${milestone}-${state.anchor}`
    if (items.length && !state.notifications.some(n => n.id === id) && !state.deliveries.some(d => d.notification_id === id)) {
      if (preference.in_app_enabled && !preference.customer_opt_outs.includes("Portal")) state.notifications.unshift(makeNotification(items, milestone, id))
      const optedOut = !preference.whatsapp_reminders_enabled || preference.customer_opt_outs.includes("WhatsApp")
      const consent = preference.whatsapp_numbers.some(n => preference.whatsapp_consents[n])
      state.deliveries.unshift({ id: `whatsapp-${id}`, notification_id: id, laboratory_id: lab,
        status: optedOut || !consent ? "suppressed" : "sent", reason: optedOut ? "Customer opted out" : !consent ? "WhatsApp consent missing" : undefined })
      created++
    }
  }
  return { created }
}

function dispatch(config: InternalAxiosRequestConfig, state: DemoState): unknown {
  const url = new URL(config.url ?? "", "https://demo.invalid/")
  const path = url.pathname.replace(/\/$/, "")
  const params = new URLSearchParams(url.search)
  for (const [k, v] of Object.entries(config.params ?? {})) if (v !== undefined) params.set(k, String(v))
  const method = config.method?.toUpperCase() ?? "GET"
  const body = typeof config.data === "string" ? JSON.parse(config.data) : config.data ?? {}
  const id = path.split("/").at(-1)!
  if (path.startsWith("/customer/gauge-acceptances/") && path.endsWith("/certificate")) {
    const row = requireRecord(state.acceptances.find(r => r.outward_gauge_id === path.split("/")[3]))
    if (params.get("certificate_id") !== row.certificate_id || Number(params.get("certificate_revision")) !== row.certificate_revision) throw new Error("The certificate changed. Refresh the table and open the current version.")
    const gauge = requireRecord(state.gauges.find(g => g.id === row.gauge_id))
    const history = requireRecord(state.histories[row.gauge_id]?.[0])
    return { certificate_id: row.certificate_id, certificate_revision: row.certificate_revision,
      inward_gauge_lab_id: row.inward_gauge_lab_id, certificate_url: certificate(gauge, history) }
  }
  if (path.startsWith("/customer/gauge-acceptances")) return demoAcceptance(config, state)
  if (path === "/demo/replace-acceptance-certificate") return replaceDemoCertificate(state, body.id)
  if (path === "/auth/customer/refresh") return { access_token: token(), token_type: "bearer" }
  if (path === "/auth/customer/me") return demoUser
  if (path === "/auth/customer/logout") return { success: true }
  if (path === `/organization/${CUSTOMER_ID}`) return organization
  if (path === "/demo/reminder") return sendMilestone(state, body.milestone)
  if (path === "/demo/advance-week") {
    state.anchor = day(addDays(new Date(`${state.anchor}T12:00:00`), 7))
    return sendMilestone(state, "overdue")
  }
  if (path === "/demo/delivery-status") {
    const delivery = requireRecord(state.deliveries.find(d => d.id === body.id))
    if (!["delivered", "read", "failed"].includes(body.status)) throw new Error("Invalid simulated delivery status")
    const preference = requireRecord(state.preferences.find(p => p.laboratory_id === delivery.laboratory_id))
    if (!preference.whatsapp_reminders_enabled || preference.customer_opt_outs.includes("WhatsApp") || !preference.whatsapp_numbers.some(n => preference.whatsapp_consents[n])) throw new Error("WhatsApp disabled or consent missing")
    if (delivery.status === "suppressed") throw new Error("Suppressed deliveries cannot be confirmed")
    delivery.status = body.status
    return delivery
  }
  if (path === "/demo/advance-request") {
    const record = request(state, body.id)
    const next: Partial<Record<RequestStatus, RequestStatus>> = { submitted: "acknowledged", acknowledged: "scheduled", scheduled: "in_progress", in_progress: "completed" }
    record.status = requireRecord(next[record.status])
    record.version++
    record.note = `Demo laboratory: ${record.status.replaceAll("_", " ")}`
    if (record.status === "scheduled") record.planned_date = day(addDays(new Date(`${state.anchor}T12:00:00`), 2))
    if (record.status === "completed") for (const item of record.items) completeCalibration(state, item.snapshot.gauge_id)
    record.history.push({ status: record.status, at: new Date().toISOString(), note: record.note })
    state.notifications.unshift({ ...makeNotification(record.items.map(i => i.snapshot), "7_days", crypto.randomUUID()),
      title: record.note, message: "Simulated laboratory update. No real request was sent.", requires_customer_response: false,
      planning_request_id: record.id, action_url: `/notifications?request=${record.id}` })
    return record
  }
  if (path === "/demo/dispatch") {
    const gauge = requireRecord(state.gauges.find(g => g.id === body.gauge_id && !g.archived && g.gauge_condition !== "Damaged"))
    if (state.transactions.some(t => !t.received_date && t.gauge_ids.includes(gauge.id))) throw new Error("Gauge already sent for calibration")
    const record = { id: crypto.randomUUID(), gauge_ids: [gauge.id], date: state.anchor, number: 1001 + state.transactions.length }
    state.transactions.unshift(record)
    gauge.status = "inward_pending"
    return record
  }
  if (path === "/demo/receive") {
    const record = requireRecord(state.transactions.find(t => t.id === body.id && !t.received_date))
    record.received_date = state.anchor
    for (const gaugeId of record.gauge_ids) completeCalibration(state, gaugeId)
    for (const gaugeId of record.gauge_ids) state.acceptances.push(createAcceptanceSource(state, record, gaugeId))
    return record
  }
  if (path === "/customer/notification-settings") return state.preferences
  if (path.startsWith("/customer/notification-settings/") && method === "PUT") {
    const preference = requireRecord(state.preferences.find(p => p.laboratory_id === id))
    Object.assign(preference, body as ReminderPreferences)
    return preference
  }
  if (path === "/customer/notifications") {
    const all = state.notifications.filter(n => params.get("unread_only") !== "true" || !n.read_by_customer)
    return { notifications: all.slice(0, Number(params.get("limit") ?? 100)), total_count: all.length,
      unread_count: state.notifications.filter(n => !n.read_by_customer).length }
  }
  if (path.startsWith("/customer/notifications/")) {
    const record = notification(state, path.split("/")[3])
    if (id === "read") record.read_by_customer = body.read
    if (id === "response" && record.response_status !== "yes_plan_calibration") {
      if (body.response === "yes_plan_calibration") {
        const eligible = (record.snapshots ?? []).filter(s => state.gauges.some(g => !g.archived && g.gauge_condition !== "Damaged" && g.status !== "inward_pending" && snapshot(g).cycle_key === s.cycle_key)
          && !state.requests.some(r => !["completed", "cancelled"].includes(r.status) && r.items.some(i => i.snapshot.cycle_key === s.cycle_key)))
        if (!eligible.length) throw new Error("No eligible gauges remain. Refresh the demo reminders.")
        const planning: PlanningRequest = { id: crypto.randomUUID(), organization_id: CUSTOMER_ID, organization_name: organization.name,
          laboratory_id: record.laboratory_id!, status: "submitted", version: 1, accepted_count: eligible.length,
          items: eligible.map(s => ({ snapshot: structuredClone(s) })), created_at: new Date().toISOString(),
          history: [{ status: "submitted", at: new Date().toISOString(), note: "Customer requested calibration (demo)" }] }
        state.requests.unshift(planning)
        record.planning_request_id = planning.id
        record.accepted_count = eligible.length
        record.skipped_count = record.gauge_count - eligible.length
      }
      record.response_status = body.response
      record.delivery_status = "responded"
      record.read_by_customer = true
      record.response_at = new Date().toISOString()
    }
    return record
  }
  if (path === "/customer/calibration-requests") {
    const start = Number(params.get("page") ?? 0) * 25
    return { requests: state.requests.slice(start, start + 25), total_count: state.requests.length }
  }
  if (path.startsWith("/customer/calibration-requests/")) {
    const record = request(state, id)
    if (method === "PATCH") {
      if (body.version !== record.version || !["submitted", "acknowledged", "scheduled"].includes(record.status) || !body.reason?.trim()) throw new Error("Cannot cancel this request")
      record.status = "cancelled"; record.version++
      record.history.push({ status: "cancelled", at: new Date().toISOString(), reason: body.reason })
    }
    return record
  }
  if (path.includes("/dashboard/gauges/")) {
    const year = Number(params.get("year") ?? new Date().getFullYear())
    let rows = planningRows(state, year)
    const through = params.get("through_group")
    if (through) rows = rows.filter(r => (Number(r.gauge_id.replace(/\D/g, "")) % 2 === 0) === (through === "veeresha_spm"))
    if (path.endsWith("/details")) {
      if (params.has("month")) rows = rows.filter(r => Number(r.due_date.slice(5, 7)) === Number(params.get("month")))
      if (params.has("status")) rows = rows.filter(r => r.status === params.get("status"))
      const search = params.get("search")?.toLowerCase()
      if (search) rows = rows.filter(r => `${r.gauge_name} ${r.identification_number}`.toLowerCase().includes(search))
      const sort = (params.get("sort_by") ?? "due_date") as "due_date" | "gauge_name" | "identification_number" | "status"
      rows.sort((a, b) => String(a[sort]).localeCompare(String(b[sort])) * (params.get("sort_direction") === "desc" ? -1 : 1))
      const page = Number(params.get("page") ?? 0), limit = Number(params.get("limit") ?? 25)
      return { year, summary: counts(rows), total: rows.length, page, limit, data: rows.slice(page * limit, (page + 1) * limit) }
    }
    if (path.endsWith("calibration-planning")) return { year, summary: counts(rows), months: Array.from({ length: 12 }, (_, i) => {
      const selected = rows.filter(r => Number(r.due_date.slice(5, 7)) === i + 1)
      return { month: i + 1, planned: selected.length, ...counts(selected), weekly_plan: [0, 1, 2, 3].map(w => selected.filter(r => Math.min(3, Math.floor((Number(r.due_date.slice(8)) - 1) / 7)) === w).length) }
    }) }
    const daily = path.endsWith("daily-calibration")
    const month = Number(params.get("month") ?? 1)
    return Object.fromEntries(Array.from({ length: daily ? new Date(year, month, 0).getDate() : 12 }, (_, i) => {
      const key = daily ? `${year}-${String(month).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}` : new Date(year, i, 1).toLocaleString("en-US", { month: "long" })
      const selected = rows.filter(r => daily ? r.due_date === key : Number(r.due_date.slice(5, 7)) === i + 1)
      const count = counts(selected)
      return [key, { planned: selected.length, completed: count.completed, pending: count.upcoming + count.due_soon, overdue: count.overdue }]
    }))
  }
  if (path === "/gauge/master") return { data: [...new Map(state.gauges.map(g => [g.master_gauge_id, { id: g.master_gauge_id, name: g.master_gauge_name, certificate_type_id: "demo-cert-type" }])).values()], total: 8 }
  if (path === "/certificate/types") return [{ id: "demo-cert-type", name: "NABL" }]
  if (path === "/gauge/inwards" || path === "/outwards") return state.transactions.filter(t => path !== "/outwards" || t.received_date).map(t => ({
    id: t.id, inward_no: t.number, outward_no: t.number, client_org_id: CUSTOMER_ID, client_org_name: organization.name, client_org: organization.name,
    inward_date: t.date, received_date: t.received_date, outward_date: t.received_date, client_dc_no: `DEMO-DC-${t.number}`, client_dc_date: t.date,
    transport_by: "Demo courier", through: "Direct", created_at: t.date, updated_at: t.date, address: organization.address, status: t.received_date ? "received" : "sent" }))
  if (path === "/gauge/list/inward_gauges" || /^\/outward\/[^/]+\/gauges$/.test(path)) {
    const record = requireRecord(state.transactions.find(t => t.id === (params.get("inward_id") ?? path.split("/")[2])))
    const gauges = record.gauge_ids.map(gaugeId => ({ ...requireRecord(state.gauges.find(g => g.id === gaugeId)), gauge_id: gaugeId, inward_id: record.id,
      gauge_inward_id: gaugeId, inward_no: record.number, outward_no: record.number, inward_date: record.date,
      client_dc_no: `DEMO-DC-${record.number}`, client_dc_date: record.date, inward_gauge_lab_id: `DEMO-${gaugeId}`, process: "Calibration" }))
    return path.startsWith("/outward/") ? { outward_details: { id: record.id, outward_no: record.number, outward_date: record.received_date, client_org: organization.name, transport_by: "Demo courier", address: organization.address }, outward_gauges: gauges } : gauges
  }
  if (/^\/gauge\/organization\/[^/]+\/gauges$/.test(path)) {
    let gauges = state.gauges.map(g => demoVisibleGauge(state, g))
    const search = params.get("search")?.toLowerCase()
    if (search) gauges = gauges.filter(g => `${g.master_gauge_name} ${g.identification_number} ${g.manf_serial_number}`.toLowerCase().includes(search))
    const page = Number(params.get("page") ?? 1), limit = Number(params.get("limit") ?? 10)
    return { data: gauges.slice((page - 1) * limit, page * limit), total: gauges.length, page, limit }
  }
  if (/^\/gauge\/[^/]+\/history$/.test(path)) {
    const gauge = requireRecord(state.gauges.find(g => g.id === path.split("/")[2]))
    const history = state.histories[gauge.id] ?? []
    return history.filter(h => !h.acceptance_required || h.customer_acceptance).map(h => ({ ...h, certificate_url: certificate(gauge, h) }))
  }
  if (path === "/gauge" && method === "POST") {
    const base = state.gauges[0]
    const master = state.gauges.find(g => g.master_gauge_id === body.master_gauge_id) ?? base
    const gauge: Gauge = { ...base, ...body, id: `demo-gauge-${state.gauges.length + 1}`, archived: false, master_gauge_name: master.master_gauge_name }
    state.gauges.push(gauge); state.histories[gauge.id] = []
    return gauge
  }
  if (/^\/gauge\/[^/]+$/.test(path)) {
    const gauge = requireRecord(state.gauges.find(g => g.id === id))
    if (method === "DELETE") { state.gauges = state.gauges.filter(g => g.id !== id); return {} }
    if (method === "PUT") Object.assign(gauge, body)
    return demoVisibleGauge(state, gauge)
  }
  if (path === "/uploads/certificates") {
    const file = (config.data as FormData).get("file")
    if (!(file instanceof Blob)) throw new Error("Select a demo certificate")
    return { url: URL.createObjectURL(file) }
  }
  if (path.startsWith("/format-numbers")) {
    if (method !== "GET") state.formatNumber = body.formatNumber ?? state.formatNumber
    return { id: "demo-format", formatNumber: state.formatNumber }
  }
  // Never fall through to the network, including features not yet implemented.
  throw new Error(`This operation is unavailable in the demo: ${method} ${path}`)
}

export const demoAdapter: AxiosAdapter = async config => {
  try {
    const state = loadDemoState()
    const data = dispatch(config, state)
    saveDemoState(state)
    if (config.method?.toLowerCase() !== "get") window.dispatchEvent(new Event("customerportal:demo-updated"))
    return { data: structuredClone(data), status: 200, statusText: "OK", headers: {}, config }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Demo operation failed"
    throw new AxiosError(message, "ERR_BAD_REQUEST", config, undefined, { data: { detail: message }, status: 409, statusText: "Conflict", headers: {}, config })
  }
}
