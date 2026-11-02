import { useEffect, useRef, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Info } from "lucide-react"
import { toast } from "sonner"
import { isDemoSession } from "@/demo/session"
import { apiService } from "@/services/api.service"
import { acceptanceService } from "@/services/gaugeAcceptance.service"
import { useAuth } from "@/hooks/useAuth"
import { useDebouncedValue } from "@/hooks/useDebounce"
import { useThroughFilter } from "@/hooks/useThroughFilter"
import { canEditCustomerModule } from "@/lib/permissions"
import { ThroughGroupFilter } from "@/components/filters/ThroughGroupFilter"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "@/components/ui/table"
import { ACCEPTANCE_DECISIONS, ACCEPTANCE_FIELDS, EMPTY_ACCEPTANCE_FIELDS, type AcceptanceRow, type AcceptanceStatus,
  type AcceptanceDecision, type AcceptanceField, type AcceptanceFields, type ReviewResult, type AcceptanceSource } from "@/types/gaugeAcceptance"

const STATUS_LABELS = { pending: "Pending Acceptance", accepted: "Accepted", rejected: "Rejected" }
const ROW_STATUS_LABELS = { pending: "Pending", accepted: "Accepted", rejected: "Rejected" }
const STATUS_COLORS = {
  pending: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200",
  accepted: "border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200",
  rejected: "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200",
}
const HELP: Record<AcceptanceField, string> = {
  maintenance_details: "Record maintenance, repair follow-up, or other customer handling details.",
  history_card_number: "Your internal history-card reference. This is separate from the report format number.",
  acceptance_criteria: "Record your organization's criteria for using this gauge. Laboratory technical limits remain unchanged.",
  gauge_location: "Where this gauge is stored or used at your site, rather than the calibration laboratory location.",
  part_name: "The component or part inspected using this gauge.",
}
function source(row: AcceptanceRow): AcceptanceSource {
  return { outward_gauge_id: row.outward_gauge_id, certificate_id: row.certificate_id, certificate_revision: row.certificate_revision, version: row.version }
}
function Help({ text }: { text: string }) {
  return <Tooltip><TooltipTrigger asChild><button type="button" aria-label={text} className="ml-1 inline-flex align-middle text-muted-foreground"><Info className="size-4" /></button></TooltipTrigger><TooltipContent className="max-w-xs">{text}</TooltipContent></Tooltip>
}
function message(error: unknown) {
  const detail = (error as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail
  return typeof detail === "string" ? detail : "Unable to save. Refresh and check the current review."
}

export default function GaugeAcceptance() {
  const { user } = useAuth()
  const canEdit = canEditCustomerModule(user?.user, "customer_transactions", user?.roles)
  const client = useQueryClient()
  const through = useThroughFilter()
  const [status, setStatus] = useState<AcceptanceStatus>("pending")
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebouncedValue(search, 250)
  const [decisionFilter, setDecisionFilter] = useState("")
  const [page, setPage] = useState(0)
  const [limit, setLimit] = useState(25)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [modal, setModal] = useState<{ rows: AcceptanceRow[]; bulk: boolean; mode: "view" | "edit"; category?: "accept" | "reject" } | null>(null)
  const [decision, setDecision] = useState<AcceptanceDecision>("accept")
  const [remark, setRemark] = useState("")
  const [fields, setFields] = useState<AcceptanceFields>({ ...EMPTY_ACCEPTANCE_FIELDS })
  const [enabledFields, setEnabledFields] = useState<Set<AcceptanceField>>(new Set())
  const [correction, setCorrection] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [results, setResults] = useState<ReviewResult[]>([])
  const [preview, setPreview] = useState<AcceptanceRow | null>(null)
  const [frameLoaded, setFrameLoaded] = useState(false)
  const submission = useRef({ hash: "", key: "" })
  useEffect(() => { setSelected(new Set()); setPage(0) }, [status, debouncedSearch, decisionFilter, through.apiGroup, limit])
  const query = useQuery({ queryKey: ["gauge-acceptances", user?.organization_id, status, debouncedSearch, decisionFilter, through.apiGroup, page, limit],
    queryFn: () => acceptanceService.list({ status, search: debouncedSearch, decision: decisionFilter || undefined, through_group: through.apiGroup, page, limit }) })
  const rows = query.data?.data ?? []
  const previewQuery = useQuery({ queryKey: ["gauge-acceptance-certificate", user?.organization_id, preview?.outward_gauge_id, preview?.certificate_id, preview?.certificate_revision],
    queryFn: () => acceptanceService.certificate(source(preview!)), enabled: Boolean(preview), staleTime: 0, retry: false })
  const columnCount = canEdit ? 9 : 8
  const selectedRows = rows.filter(r => selected.has(r.outward_gauge_id))
  const allSelected = rows.length > 0 && rows.every(r => selected.has(r.outward_gauge_id))
  const refresh = () => client.invalidateQueries({ predicate: q => !["customer-reminder-preferences"].includes(String(q.queryKey[0])) })
  const open = async (chosen: AcceptanceRow[], bulk: boolean, category?: "accept" | "reject") => {
    setError(""); setBusy(true)
    try {
      const fresh = bulk ? chosen : [await acceptanceService.detail(chosen[0].outward_gauge_id)]
      setModal({ rows: fresh, bulk, mode: !bulk && fresh[0].version ? "view" : "edit", category })
      setDecision(category === "reject" ? "not_ok" : !bulk ? fresh[0].decision ?? "accept" : "accept")
      setRemark(!bulk ? fresh[0].review?.remark_note ?? "" : "")
      setFields(!bulk ? { ...EMPTY_ACCEPTANCE_FIELDS, ...fresh[0].prefill } : { ...EMPTY_ACCEPTANCE_FIELDS })
      setEnabledFields(new Set()); setCorrection(""); submission.current = { hash: "", key: "" }
    } catch (e) { toast.error(message(e)) } finally { setBusy(false) }
  }
  const save = async () => {
    if (!modal) return
    if (decision !== "accept" && !remark.trim()) { setError("Enter a remark for this decision."); return }
    if (modal.rows.some(r => r.version > 0) && !correction.trim()) { setError("Enter a correction reason for previously reviewed gauges."); return }
    const patch = modal.bulk ? Object.fromEntries(Object.entries(fields).filter(([key]) => enabledFields.has(key as AcceptanceField))) : fields
    const items = modal.rows.map(source)
    const values = { decision, remark_note: remark.trim(), fields: patch, correction_reason: correction.trim() }
    const hash = JSON.stringify({ items, values })
    if (submission.current.hash !== hash) submission.current = { hash, key: crypto.randomUUID() }
    setBusy(true); setError("")
    try {
      const body = { ...values, idempotency_key: submission.current.key }
      const outcomes = modal.bulk ? (await acceptanceService.bulk(items, body)).results : [await acceptanceService.review(items[0], body)]
      setResults(outcomes.map(r => ({ ...r, gauge_label: modal.rows.find(row => row.outward_gauge_id === r.outward_gauge_id)?.identification_number })))
      setSelected(new Set(outcomes.filter(r => r.outcome === "failed").map(r => r.outward_gauge_id)))
      setModal(null)
      await refresh()
      toast.success(`${outcomes.filter(r => r.outcome !== "failed").length} reviewed; ${outcomes.filter(r => r.outcome === "failed").length} failed`)
    } catch (e) { setError(message(e)) } finally { setBusy(false) }
  }
  const editing = modal?.mode === "edit"
  const allowed = Object.entries(ACCEPTANCE_DECISIONS).filter(([key]) => !modal?.bulk || (modal.category === "accept") === ["accept", "conditional_accept"].includes(key))
  return <TooltipProvider><div className="space-y-5">
    <div><h1 className="text-2xl font-semibold">Gauge Verification &amp; Acceptance</h1><p className="mt-1 text-sm text-muted-foreground">Review gauges returned by your calibration laboratory. Every submitted decision releases that calibration version to your portal.</p></div>
    <div className="flex flex-wrap gap-2">{(Object.entries(STATUS_LABELS) as [AcceptanceStatus, string][]).map(([key, label]) => <Button key={key} variant={status === key ? "default" : "outline"} onClick={() => setStatus(key)}>{label} · {query.data?.counts[key] ?? 0}</Button>)}</div>
    <div className="flex flex-wrap gap-2"><Input className="min-w-56 flex-1" aria-label="Search returned gauges" placeholder="Search gauge, identification, serial, remark…" value={search} onChange={e => setSearch(e.target.value)} />
      <Select value={decisionFilter || "all"} onValueChange={value => setDecisionFilter(value === "all" ? "" : value)}><SelectTrigger aria-label="Filter review decision" className="h-10 w-full sm:w-56"><SelectValue placeholder="All decisions" /></SelectTrigger>
        <SelectContent><SelectItem value="all">All decisions</SelectItem>{Object.entries(ACCEPTANCE_DECISIONS).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent>
      </Select>
      {through.enabled && <ThroughGroupFilter value={through.group} onChange={through.setGroup} />}<Button variant="outline" disabled={query.isFetching} onClick={() => void query.refetch()}>Refresh</Button>
    </div>
    {canEdit && <div className="flex flex-wrap items-center gap-2 text-sm"><span>{selected.size} selected</span>
      <Button disabled={!selectedRows.length || busy} onClick={() => void open(selectedRows, true, "accept")}>Bulk Accept</Button>
      <Button variant="outline" disabled={!selectedRows.length || busy} onClick={() => void open(selectedRows, true, "reject")}>Bulk Reject</Button>
      <Button variant="ghost" disabled={!selected.size} onClick={() => setSelected(new Set())}>Clear selection</Button></div>}
    {isDemoSession() && canEdit && <Button variant="outline" disabled={selectedRows.length !== 1 || busy} onClick={async () => { await apiService.post("/demo/replace-acceptance-certificate", { id: selectedRows[0].outward_gauge_id }); setSelected(new Set()); await refresh() }}>Demo: replace selected certificate</Button>}
    {query.isError && <p role="alert">Unable to load returned gauges. Try Refresh.</p>}
    <div className="overflow-x-auto rounded-md border"><Table><TableHeader><TableRow>
      {canEdit && <TableHead><Checkbox aria-label="Select current page" checked={allSelected ? true : selectedRows.length ? "indeterminate" : false} onCheckedChange={checked => setSelected(checked ? new Set(rows.map(r => r.outward_gauge_id)) : new Set())} /></TableHead>}
      {["Sr No", "Lab ID", "Gauge", "Identification", "Serial", "Process", "Status", "Action"].map(label => <TableHead key={label} className={label === "Sr No" || label === "Lab ID" || label === "Status" ? "w-px whitespace-nowrap" : undefined}>{label}</TableHead>)}
    </TableRow></TableHeader><TableBody>{query.isLoading ? <TableRow><TableCell colSpan={columnCount}>Loading returned gauges…</TableCell></TableRow> : rows.map((r, i) => <TableRow key={r.outward_gauge_id}>
      {canEdit && <TableCell><Checkbox aria-label={`Select ${r.identification_number}`} checked={selected.has(r.outward_gauge_id)} onCheckedChange={checked => setSelected(previous => { const next = new Set(previous); if (checked) next.add(r.outward_gauge_id); else next.delete(r.outward_gauge_id); return next })} /></TableCell>}
      <TableCell className="whitespace-nowrap">{page * limit + i + 1}</TableCell><TableCell className="whitespace-nowrap">{r.inward_gauge_lab_id ? <Button type="button" variant="ghost" size="sm" className="h-auto rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200 dark:hover:bg-blue-900" aria-label={`Preview certificate for Lab ID ${r.inward_gauge_lab_id}`} onClick={() => { setFrameLoaded(false); setPreview(r) }}>{r.inward_gauge_lab_id}</Button> : "—"}</TableCell>
      <TableCell>{r.gauge_name}</TableCell><TableCell>{r.identification_number || "—"}</TableCell><TableCell>{r.manf_serial_number || "—"}</TableCell><TableCell>{r.process}</TableCell>
      <TableCell><Badge variant="outline" className={`whitespace-nowrap rounded-full ${STATUS_COLORS[r.status]}`}>{ROW_STATUS_LABELS[r.status]}</Badge></TableCell>
      <TableCell><Button size="sm" variant="outline" disabled={busy || (!canEdit && !r.version)} onClick={() => void open([r], false)}>{r.version ? "View" : "Review"}</Button></TableCell>
    </TableRow>)}{!query.isLoading && !rows.length && <TableRow><TableCell colSpan={columnCount}>No matching returned gauges.</TableCell></TableRow>}</TableBody></Table></div>
    <div className="flex flex-wrap items-center justify-between gap-2 text-sm"><span>{query.data?.total ?? 0} records · Page {page + 1}</span><div className="flex gap-2">
      <Select value={String(limit)} onValueChange={value => setLimit(Number(value))}><SelectTrigger aria-label="Rows per page" className="h-10 w-20"><SelectValue /></SelectTrigger><SelectContent>{[10, 25, 50, 100].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent></Select>
      <Button variant="outline" disabled={!page} onClick={() => { setPage(page - 1); setSelected(new Set()) }}>Previous</Button><Button variant="outline" disabled={(page + 1) * limit >= (query.data?.total ?? 0)} onClick={() => { setPage(page + 1); setSelected(new Set()) }}>Next</Button>
    </div></div>
    {results.length > 0 && <section aria-label="Review results" className="rounded-md border p-4 text-sm"><h2 className="font-semibold">Review results</h2><ul className="mt-2 space-y-1">{results.map(r => <li key={r.outward_gauge_id}>{r.gauge_label || r.outward_gauge_id} · {r.outcome}{r.reason ? ` · ${r.reason}` : ""}</li>)}</ul></section>}
    <Dialog open={Boolean(modal)} onOpenChange={open => { if (!open && !busy) setModal(null) }}><DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto"><DialogHeader>
      <DialogTitle>{modal?.bulk ? `Bulk ${modal.category === "accept" ? "accept" : "reject"} · ${modal.rows.length} gauges` : editing ? "Review returned gauge" : "View gauge review"}</DialogTitle>
      <DialogDescription>Record your organization's verification. Any submitted decision, including rejection, releases the calibration data. Laboratory results are not changed.</DialogDescription>
    </DialogHeader>
      <ul className="max-h-36 overflow-y-auto rounded-md bg-muted p-3 text-sm">{modal?.rows.map(r => <li key={r.outward_gauge_id}>{r.gauge_name} · {r.identification_number} · {r.laboratory_name} · {STATUS_LABELS[r.status]}</li>)}</ul>
      {modal?.bulk && <p className="text-sm">{modal.rows.filter(r => !r.version).length} pending · {modal.rows.filter(r => r.version).length} corrections. Optional fields change only when enabled below.</p>}
      {modal?.bulk && <p className="text-sm text-muted-foreground">Enabled fields with a blank value clear that field on every selected gauge.</p>}
      <form className="space-y-4" onSubmit={e => { e.preventDefault(); void save() }}>
        <div className="space-y-1 text-sm"><span>Decision <Help text="Choose the customer's verification outcome. A rejection does not alter the laboratory's calibration result." /></span><Select disabled={!editing || busy} value={decision} onValueChange={value => setDecision(value as AcceptanceDecision)}><SelectTrigger aria-label="Review decision" className="h-10"><SelectValue /></SelectTrigger><SelectContent>{allowed.map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent></Select></div>
        <label className="block space-y-1 text-sm"><span>Remark note {decision !== "accept" && "*"}<Help text="Explain conditions, discrepancies or rejection. Required for every decision except Accept." /></span><textarea maxLength={4000} className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 disabled:opacity-50" aria-label="Remark note" disabled={!editing || busy} required={decision !== "accept"} value={remark} onChange={e => setRemark(e.target.value)} /></label>
        <div className="grid gap-4 sm:grid-cols-2">{(Object.entries(ACCEPTANCE_FIELDS) as [AcceptanceField, string][]).map(([key, label]) => <div key={key} className="space-y-1 text-sm">
          <label htmlFor={`acceptance-${key}`}>{label}<Help text={HELP[key]} /></label>
          {modal?.bulk && <label className="flex items-center gap-2 text-xs"><Checkbox checked={enabledFields.has(key)} disabled={busy} onCheckedChange={checked => setEnabledFields(prev => { const next = new Set(prev); if (checked) next.add(key); else next.delete(key); return next })} />Apply to selected gauges</label>}
          <Input maxLength={key === "maintenance_details" || key === "acceptance_criteria" ? 4000 : key === "history_card_number" ? 200 : 300} id={`acceptance-${key}`} disabled={!editing || busy || (modal?.bulk && !enabledFields.has(key))} value={fields[key]} onChange={e => setFields({ ...fields, [key]: e.target.value })} />
        </div>)}</div>
        {editing && modal?.rows.some(r => r.version > 0) && <label className="block space-y-1 text-sm">Correction reason *<textarea maxLength={1000} className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 disabled:opacity-50" aria-label="Correction reason" required value={correction} disabled={busy} onChange={e => setCorrection(e.target.value)} /></label>}
        {!editing && modal?.rows[0].review && <details className="text-sm"><summary className="cursor-pointer font-medium">Review audit history</summary><ul className="mt-2 space-y-2">{modal.rows[0].review.history.map(h => <li key={h.version}>Version {h.version} · {ACCEPTANCE_DECISIONS[h.decision]} · {h.updated_at} · {h.reviewed_by}<p>{h.remark_note} {h.correction_reason}</p><dl>{Object.entries(ACCEPTANCE_FIELDS).map(([key, label]) => <div key={key}><dt className="inline font-medium">{label}: </dt><dd className="inline">{h[key as AcceptanceField] || "—"}</dd></div>)}</dl></li>)}</ul></details>}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={busy} onClick={() => setModal(null)}>Close</Button>
          {!editing && canEdit && <Button type="button" onClick={() => setModal(modal ? { ...modal, mode: "edit" } : null)}>Edit review</Button>}
          {editing && <Button type="submit" disabled={busy}>{busy ? "Saving…" : modal?.bulk ? "Confirm bulk review" : "Save review"}</Button>}
        </div>
      </form>
    </DialogContent></Dialog>
    <Dialog open={Boolean(preview)} onOpenChange={open => { if (!open) setPreview(null) }}><DialogContent className="max-w-5xl"><DialogHeader>
      <DialogTitle>Certificate · Lab ID {preview?.inward_gauge_lab_id}</DialogTitle>
      <DialogDescription>Inspect this returned gauge's certificate. Previewing does not submit or change its review.</DialogDescription>
    </DialogHeader>
      {previewQuery.isError ? <div role="alert" className="space-y-3 text-sm"><p>{message(previewQuery.error)}</p><Button variant="outline" onClick={() => { setPreview(null); void query.refetch() }}>Refresh table</Button></div> : <div className="relative h-[70vh] rounded-md border bg-muted">
        {(previewQuery.isPending || !frameLoaded) && <p role="status" className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-background text-sm text-muted-foreground">Loading certificate…</p>}
        {previewQuery.data && <iframe key={`${preview?.certificate_id}:${preview?.certificate_revision}`} title={`Certificate preview for Lab ID ${preview?.inward_gauge_lab_id}`} src={previewQuery.data.certificate_url} className="relative h-full w-full rounded-md border-0 bg-white" onLoad={() => setFrameLoaded(true)} sandbox="allow-scripts allow-same-origin allow-modals allow-popups allow-downloads" />}
      </div>}
      {previewQuery.data && !previewQuery.isError && <Button asChild variant="outline"><a href={previewQuery.data.certificate_url} target="_blank" rel="noopener noreferrer">Open certificate in new tab</a></Button>}
    </DialogContent></Dialog>
  </div></TooltipProvider>
}
