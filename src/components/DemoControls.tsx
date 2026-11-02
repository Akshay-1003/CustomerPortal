import { useEffect, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { apiService } from "@/services/api.service"
import { endDemoSession, isDemoSession, DEMO_DATA_KEY } from "@/demo/session"
import { loadDemoState } from "@/demo/data"

const selectClass = "h-9 max-w-full rounded-md border bg-background px-2 text-sm"

function useDemoActions() {
  const client = useQueryClient()
  const [busy, setBusy] = useState(false)
  const state = useQuery({ queryKey: ["demo-state"], queryFn: loadDemoState }).data
  useEffect(() => {
    const update = () => { void client.invalidateQueries({ queryKey: ["demo-state"] }) }
    window.addEventListener("customerportal:demo-updated", update)
    return () => window.removeEventListener("customerportal:demo-updated", update)
  }, [client])
  const perform = async (url: string, data: unknown, success: string) => {
    setBusy(true)
    try {
      const result = await apiService.post<{ created?: number }>(url, data)
      await client.invalidateQueries()
      toast.success(result.created === 0 ? "No new eligible reminders. This milestone was already shown or is disabled." : success)
    } catch (error) { toast.error(error instanceof Error ? error.message : "Demo action failed") }
    finally { setBusy(false) }
  }
  return { state, perform, busy }
}

export function DemoControls() {
  return isDemoSession() ? <DemoToolbar /> : null
}

function DemoToolbar() {
  const { state, perform, busy } = useDemoActions()
  const [milestone, setMilestone] = useState("7_days")
  const [requestId, setRequestId] = useState("")
  const [deliveryStatus, setDeliveryStatus] = useState("delivered")
  const requests = state?.requests.filter(r => !["completed", "cancelled"].includes(r.status)) ?? []
  const currentRequest = requests.find(r => r.id === requestId) ?? requests[0]
  return <aside aria-label="Customer demo controls" className="border-b border-amber-300 bg-amber-50 px-4 py-3 text-slate-900">
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <Badge variant="outline">Demo workspace</Badge>
      <Badge variant="outline">{state?.anchor}</Badge>
      <span>50 sample gauges · All 12 months · Changes stay in this tab. Messages and laboratory actions are simulated.</span>
      <Button variant="outline" size="sm" onClick={endDemoSession} className="ml-auto">Exit demo</Button>
    </div>
    <details className="mt-2 text-sm">
      <summary className="cursor-pointer font-medium">Showcase controls</summary>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <select aria-label="Demo reminder milestone" className={selectClass} value={milestone} onChange={e => setMilestone(e.target.value)}>
          <option value="30_days">30 days before</option><option value="15_days">15 days before</option>
          <option value="7_days">7 days before</option><option value="due_date">Due today</option><option value="overdue">Weekly overdue</option>
        </select>
        <Button size="sm" variant="outline" disabled={busy} onClick={() => void perform("/demo/reminder", { milestone }, "New demo reminder added to the notification bell")}>Simulate reminder</Button>
        <Button size="sm" variant="outline" disabled={busy} onClick={() => void perform("/demo/advance-week", {}, "Demo advanced one week; eligible overdue reminders added")}>Advance demo 7 days</Button>
        <Button size="sm" variant="outline" asChild><Link to="/notifications">View notifications and requests</Link></Button>
        <Button size="sm" variant="outline" asChild><Link to="/transactions/gauge-acceptance">Gauge verification demo</Link></Button>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <select aria-label="Demo planning request" className={selectClass} value={currentRequest?.id ?? ""} onChange={e => setRequestId(e.target.value)}>
          {requests.map(r => <option value={r.id} key={r.id}>{r.items[0]?.snapshot.identification_number} · {r.status.replaceAll("_", " ")}</option>)}
          {!requests.length && <option value="">Plan calibration from a reminder first</option>}
        </select>
        <Button size="sm" variant="outline" disabled={busy || !currentRequest} onClick={() => void perform("/demo/advance-request", { id: currentRequest?.id }, "Simulated laboratory update received")}>Simulate next laboratory step</Button>
        <Button size="sm" variant="outline" onClick={() => { sessionStorage.removeItem(DEMO_DATA_KEY); window.location.reload() }}>Reset demo</Button>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span>WhatsApp simulation: <strong>{state?.deliveries[0]?.status ?? "none"}</strong></span>
        <select aria-label="Simulated WhatsApp outcome" className={selectClass} value={deliveryStatus} onChange={e => setDeliveryStatus(e.target.value)}>
          <option value="delivered">Delivered</option><option value="read">Read</option><option value="failed">Failed</option>
        </select>
        <Button size="sm" variant="outline" disabled={busy || !state?.deliveries[0]} onClick={() => void perform("/demo/delivery-status", { id: state?.deliveries[0]?.id, status: deliveryStatus }, "Simulated WhatsApp outcome updated")}>Simulate delivery status</Button>
        <details><summary className="cursor-pointer">Sample channel outcomes</summary><ul className="mt-2">{state?.deliveries.slice(0, 8).map(d => <li key={d.id}>{d.laboratory_id.replace("demo-lab-", "")} · {d.status}{d.reason ? ` · ${d.reason}` : ""}</li>)}</ul></details>
      </div>
      <p className="mt-3 text-xs">Try: reminder → Yes, Plan Calibration → laboratory steps → Sent for calibration → Received from calibration. Settings and consent controls apply to demo reminders.</p>
    </details>
  </aside>
}

export function DemoTransactions({ direction }: { direction: "sent" | "received" }) {
  return isDemoSession() ? <TransactionActions direction={direction} /> : null
}

function TransactionActions({ direction }: { direction: "sent" | "received" }) {
  const { state, perform, busy } = useDemoActions()
  const [selectedId, setSelectedId] = useState("")
  if (!state) return null
  const pending = state.transactions.filter(t => !t.received_date)
  const available = state.gauges.filter(g => !g.archived && g.gauge_condition !== "Damaged" && !pending.some(t => t.gauge_ids.includes(g.id)))
  const options = direction === "sent" ? available.map(g => ({ id: g.id, label: `${g.identification_number} · ${g.master_gauge_name}` }))
    : pending.map(t => ({ id: t.id, label: `Dispatch ${t.number} · ${t.gauge_ids.length} gauges · ${t.date}` }))
  const selected = options.find(o => o.id === selectedId)?.id ?? options[0]?.id ?? ""
  return <section aria-label="Demo transaction actions" className="space-y-3 rounded-lg border bg-card p-4">
    <div className="flex flex-wrap gap-2 text-sm">
      <Badge variant="outline">{state.transactions.length} dispatches</Badge>
      <Badge variant="outline">{pending.length} awaiting return</Badge>
      <Badge variant="outline">{state.transactions.filter(t => t.received_date).length} received</Badge>
    </div>
    <p className="text-sm text-muted-foreground">{direction === "sent" ? "Simulate sending a gauge to the laboratory. It becomes available on Received from calibration." : "Simulate receiving a dispatch after calibration. History, certificates, and the next due date update together."}</p>
    <div className="flex flex-wrap gap-2">
      <select aria-label={direction === "sent" ? "Gauge to send" : "Dispatch to receive"} className={selectClass} value={selected} onChange={e => setSelectedId(e.target.value)}>
        {options.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
        {!options.length && <option value="">No eligible records</option>}
      </select>
      <Button disabled={busy || !selected} onClick={() => void perform(direction === "sent" ? "/demo/dispatch" : "/demo/receive",
        direction === "sent" ? { gauge_id: selected } : { id: selected }, direction === "sent" ? "Demo gauge sent for calibration" : "Demo gauges received; calibration history updated")}>
        {direction === "sent" ? "Simulate dispatch" : "Simulate receipt"}
      </Button>
    </div>
  </section>
}
