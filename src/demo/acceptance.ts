import type { InternalAxiosRequestConfig } from "axios"
import { type DemoState, CUSTOMER_ID } from "./data"
import { ACCEPTANCE_DECISIONS, type AcceptanceRow, type AcceptanceSource, type ReviewValues, type ReviewResult } from "@/types/gaugeAcceptance"

const path = "/customer/gauge-acceptances"
function review(state: DemoState, row: AcceptanceRow, source: AcceptanceSource, values: ReviewValues): ReviewResult {
  if (!row || row.organization_id !== CUSTOMER_ID) return { outward_gauge_id: source.outward_gauge_id, outcome: "failed", code: 404, reason: "Returned gauge not found" }
  if (source.certificate_id !== row.certificate_id || source.certificate_revision !== row.certificate_revision) return { outward_gauge_id: row.outward_gauge_id, outcome: "failed", code: 409, reason: "Certificate changed; refresh and review" }
  const auditKey = `review:${row.outward_gauge_id}:${values.idempotency_key}`
  const hash = JSON.stringify({ source, values })
  if (state.acceptanceBatches[auditKey]) {
    if (state.acceptanceBatches[auditKey] !== hash) throw new Error("Idempotency key already used for different values")
    return { outward_gauge_id: row.outward_gauge_id, outcome: "replayed", review: row.review! }
  }
  if (source.version !== row.version) return { outward_gauge_id: row.outward_gauge_id, outcome: "failed", code: 409, reason: "Review changed; refresh before saving" }
  if (!(values.decision in ACCEPTANCE_DECISIONS) || (values.decision !== "accept" && !values.remark_note.trim())) throw new Error("A decision and exception remark are required")
  if (row.version && !values.correction_reason.trim()) throw new Error("A correction reason is required")
  row.decision = values.decision; row.status = ["accept", "conditional_accept"].includes(values.decision) ? "accepted" : "rejected"; row.version++
  const details = { ...row.prefill, ...values.fields }
  const current = { ...details, decision: row.decision, remark_note: values.remark_note, status: row.status, version: row.version,
    certificate_id: row.certificate_id, certificate_revision: row.certificate_revision, gauge_id: row.gauge_id,
    updated_at: new Date().toISOString(), reviewed_by: "demo-user" }
  row.review = { ...current, history: [...(row.review?.history ?? []), { ...current, correction_reason: values.correction_reason }] }
  row.prefill = details
  state.acceptanceBatches[auditKey] = hash
  state.histories[row.gauge_id][0].customer_acceptance = structuredClone(row.review)
  return { outward_gauge_id: row.outward_gauge_id, outcome: "saved", review: row.review }
}

export function demoAcceptance(config: InternalAxiosRequestConfig, state: DemoState): unknown {
  const url = new URL(config.url!, "https://demo.invalid")
  const params = new URLSearchParams(url.search)
  for (const [k, v] of Object.entries(config.params ?? {})) if (v !== undefined) params.set(k, String(v))
  const body = typeof config.data === "string" ? JSON.parse(config.data) : config.data
  if (url.pathname === path) {
    const search = (params.get("search") ?? "").toLowerCase()
    let rows = state.acceptances.filter(r => !search || `${r.gauge_name} ${r.identification_number} ${r.manf_serial_number} ${r.inward_no} ${r.outward_no} ${r.review?.remark_note ?? ""}`.toLowerCase().includes(search))
    if (params.get("decision")) rows = rows.filter(r => r.decision === params.get("decision"))
    if (params.get("through_group")) rows = rows.filter(r => (r.through === "Veeresha SPM") === (params.get("through_group") === "veeresha_spm"))
    const counts = { pending: rows.filter(r => r.status === "pending").length, accepted: rows.filter(r => r.status === "accepted").length, rejected: rows.filter(r => r.status === "rejected").length }
    if (params.get("status") !== "all") rows = rows.filter(r => r.status === (params.get("status") ?? "pending"))
    const page = Number(params.get("page") ?? 0), limit = Number(params.get("limit") ?? 25)
    return { data: rows.slice(page * limit, (page + 1) * limit), total: rows.length, page, limit, counts }
  }
  if (url.pathname.endsWith("/bulk-review")) {
    const items: AcceptanceSource[] = body.items
    if (!items.length || items.length > 100 || new Set(items.map(i => i.outward_gauge_id)).size !== items.length) throw new Error("Select 1–100 unique gauges")
    const hash = JSON.stringify(body)
    const key = `batch:${body.idempotency_key}`
    if (state.acceptanceBatches[key] && state.acceptanceBatches[key] !== hash) throw new Error("Bulk key already used for different values")
    state.acceptanceBatches[key] = hash
    const results = items.map(item => review(state, state.acceptances.find(r => r.outward_gauge_id === item.outward_gauge_id)!, item,
      { ...body, idempotency_key: `${body.idempotency_key}:${item.outward_gauge_id}` }))
    return { results, saved: results.filter(r => r.outcome === "saved").length, replayed: results.filter(r => r.outcome === "replayed").length, failed: results.filter(r => r.outcome === "failed").length }
  }
  const id = url.pathname.slice(path.length + 1).split("/")[0]
  const row = state.acceptances.find(r => r.outward_gauge_id === id)
  if (!row) throw new Error("Returned gauge not found")
  if (config.method === "put") {
    const result = review(state, row, { ...body, outward_gauge_id: id }, body)
    if (result.outcome === "failed") throw new Error(result.reason)
    return result
  }
  return row
}

export function replaceDemoCertificate(state: DemoState, id: string) {
  const row = state.acceptances.find(r => r.outward_gauge_id === id)
  if (!row) throw new Error("Select a returned gauge")
  const old = state.histories[row.gauge_id][0]
  old.customer_acceptance = row.review ? structuredClone(row.review) : null
  state.histories[row.gauge_id].unshift({ ...old, id: crypto.randomUUID(), certificate: `DEMO-REPLACEMENT-${row.certificate_revision + 1}`, customer_acceptance: null })
  row.certificate_revision++; row.version = 0; row.review = null; row.status = "pending"; row.decision = null
  return row
}
