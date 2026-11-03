import type { InternalAxiosRequestConfig } from "axios"
import { type DemoState, type DemoTransaction, organization, snapshot, LABS, LAB_NAMES } from "./data"
import type { CustomerTransaction, CustomerTransactionDetail, CustomerTransactionGauge, TransactionDirection } from "@/types/customerTransactions"

function gauges(state: DemoState, record: DemoTransaction): CustomerTransactionGauge[] {
  return record.gauge_ids.map(id => {
    const gauge = record.gauge_snapshots?.[id] ?? state.gauges.find(g => g.id === id)!
    return { ...gauge, id: `${record.id}:${id}`, gauge_id: id, gauge_inward_id: `${record.id}:${id}`, inward_id: record.id,
      inward_no: record.number, inward_date: record.date, inward_gauge_lab_id: `DEMO-${gauge.identification_number}`,
      status: record.calibration_statuses?.[id] ?? (record.received_date ? "calibration_completed" : "inward_received"),
      process: "calibration", client_org_name: organization.name, client_dc_no: `DEMO-DC-${record.number}`, client_dc_date: record.date,
      outward_id: record.received_date ? record.id : "", outward_no: record.received_date ? record.number : 0,
      certificate_id: "", returned: Boolean(record.received_date), through: snapshot(gauge).laboratory_id?.endsWith("pune") ? "Veeresha SPM" : "Direct" }
  })
}
function header(state: DemoState, record: DemoTransaction, direction: TransactionDirection): CustomerTransaction {
  const items = gauges(state, record)
  const first = record.gauge_snapshots?.[record.gauge_ids[0]] ?? state.gauges.find(g => g.id === record.gauge_ids[0])
  const lab = first ? snapshot(first) : { laboratory_id: LABS[0], laboratory_name: LAB_NAMES[0] }
  const returned = items.filter(g => g.returned).length
  return { id: record.id, direction, number: record.number, date: direction === "sent" ? record.date : record.received_date!,
    laboratory_id: lab.laboratory_id!, laboratory_name: lab.laboratory_name!, client_org_name: organization.name,
    client_dc_no: direction === "sent" ? `DEMO-DC-${record.number}` : "", client_dc_date: direction === "sent" ? record.date : null,
    through: items[0]?.through ?? "", transport_by: direction === "received" ? "Demo courier" : "",
    gauge_count: items.length, returned_count: returned, awaiting_return_count: items.length - returned,
    completed_count: items.filter(g => g.status === "calibration_completed").length,
    in_progress_count: items.filter(g => g.status === "calibration_in_progress").length,
    cancelled_count: items.filter(g => g.status === "cancelled").length }
}

export function demoTransactions(config: InternalAxiosRequestConfig, state: DemoState) {
  const url = new URL(config.url!, "https://demo.invalid")
  const params = new URLSearchParams(url.search)
  for (const [key, value] of Object.entries(config.params ?? {})) if (value !== undefined) params.set(key, String(value))
  const parts = url.pathname.split("/")
  const direction = parts[3] === "inwards" ? "sent" : "received"
  const source = state.transactions.filter(t => direction === "sent" || t.received_date)
  const subdivision = params.get("through_group")
  const matchGroup = (row: CustomerTransaction) => !subdivision || (row.through === "Veeresha SPM") === (subdivision === "veeresha_spm")
  if (parts[4]) {
    const record = source.find(t => t.id === parts[4])
    if (!record) throw new Error("Transaction not found")
    const entry = header(state, record, direction)
    if (!matchGroup(entry)) throw new Error("Transaction not found")
    const items = gauges(state, record)
    const common = { entry, gauges: items }
    const result: CustomerTransactionDetail = direction === "sent"
      ? { ...common, direction: "sent", inward_details: { id: record.id, inward_no: record.number, inward_date: record.date, client_dc_no: `DEMO-DC-${record.number}`, client_dc_date: record.date } }
      : { ...common, direction: "received", outward_details: { id: record.id, outward_no: record.number, outward_date: record.received_date!, transport_by: "Demo courier", client_org: organization.name, address: organization.address ?? null } }
    return result
  }
  const search = (params.get("search") ?? "").trim().toLowerCase()
  const rows = source.map(t => ({ row: header(state, t, direction), items: gauges(state, t) }))
    .filter(({ row, items }) => matchGroup(row) && (!params.get("date_from") || row.date! >= params.get("date_from")!)
      && (!params.get("date_to") || row.date! <= params.get("date_to")!)
      && (!search || `${row.number} ${row.client_dc_no} ${row.laboratory_name} ${row.transport_by} ${items.map(g => `${g.identification_number} ${g.manf_serial_number} ${g.master_gauge_name} ${g.inward_gauge_lab_id}`).join(" ")}`.toLowerCase().includes(search)))
    .map(({ row }) => row).sort((a, b) => b.date!.localeCompare(a.date!) || b.id.localeCompare(a.id))
  const summary = { transaction_count: rows.length, gauge_count: 0, returned_count: 0, awaiting_return_count: 0, completed_count: 0, in_progress_count: 0, cancelled_count: 0 }
  for (const row of rows) for (const key of ["gauge_count", "returned_count", "awaiting_return_count", "completed_count", "in_progress_count", "cancelled_count"] as const) summary[key] += row[key]
  const page = Number(params.get("page") ?? 0), limit = Number(params.get("limit") ?? 10)
  return { data: rows.slice(page * limit, (page + 1) * limit), total: rows.length, summary, page, limit }
}
