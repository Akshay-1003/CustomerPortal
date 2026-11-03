import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import { customerTransactionsService } from "@/services/customerTransactions.service"
import { useAuth } from "@/hooks/useAuth"
import { useDebouncedValue } from "@/hooks/useDebounce"
import { useThroughFilter } from "@/hooks/useThroughFilter"
import { useCurrentOrganizationPrintInfo } from "@/hooks/useCurrentOrganizationPrintInfo"
import { ThroughGroupFilter } from "@/components/filters/ThroughGroupFilter"
import { formatSpecificationForPrint } from "@/components/reports/helpers/specificationFormatter"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "@/components/ui/table"
import { OutwardChallanPrintPreview } from "./OutwardChallanPrintPreview"
import { InwardOutwardPrintPreview } from "./InwardOutwardPrintPreview"
import type { CustomerTransaction, CustomerTransactionDetail, TransactionDirection } from "@/types/customerTransactions"

function date(value?: string | null) {
  if (!value) return "—"
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? "—" : parsed.toLocaleDateString("en-GB")
}
function progress(entry: CustomerTransaction) {
  if (!entry.gauge_count) return "No gauges added"
  if (entry.returned_count === entry.gauge_count) return "Returned"
  return entry.returned_count ? "Partially returned" : "At laboratory"
}
function statusLabel(value: string) {
  return ({ inward_received: "Inward received", calibration_in_progress: "Calibration in progress", calibration_completed: "Calibration completed", cancelled: "Cancelled" } as Record<string, string>)[value] ?? value.replaceAll("_", " ")
}
function errorMessage(error: unknown) {
  const detail = (error as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail
  return typeof detail === "string" ? detail : "Unable to load transaction details. Please refresh and try again."
}

export function CustomerTransactionsTable({ direction }: { direction: TransactionDirection }) {
  const { user } = useAuth()
  const through = useThroughFilter()
  const printInfo = useCurrentOrganizationPrintInfo()
  const [search, setSearch] = useState("")
  const term = useDebouncedValue(search, 250)
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [page, setPage] = useState(0)
  const [limit, setLimit] = useState(10)
  const [detail, setDetail] = useState<CustomerTransactionDetail | null>(null)
  const [open, setOpen] = useState(false)
  const [print, setPrint] = useState(false)
  const [busy, setBusy] = useState(false)
  const [gaugeSearch, setGaugeSearch] = useState("")
  const [gaugePage, setGaugePage] = useState(0)
  const invalidDates = Boolean(from && to && from > to)
  useEffect(() => { setPage(0) }, [term, from, to, through.apiGroup, limit])
  useEffect(() => { setOpen(false); setPrint(false); setDetail(null) }, [through.apiGroup])
  const query = useQuery({
    queryKey: ["customer-transactions", user?.organization_id, direction, term, from, to, through.apiGroup, page, limit],
    queryFn: () => customerTransactionsService.list(direction, { search: term || undefined, date_from: from || undefined, date_to: to || undefined, through_group: through.apiGroup, page, limit }),
    enabled: Boolean(user?.organization_id) && !invalidDates
  })
  const inspect = async (entry: CustomerTransaction, printing = false) => {
    setBusy(true)
    try {
      const result = await customerTransactionsService.detail(direction, entry.id, through.apiGroup)
      setDetail(result); setGaugeSearch(""); setGaugePage(0)
      if (printing) setPrint(true); else setOpen(true)
    } catch (error) { toast.error(errorMessage(error)) } finally { setBusy(false) }
  }
  const rows = query.data?.data ?? []
  const summary = query.data?.summary
  const filteredGauges = (detail?.gauges ?? []).filter(g => `${g.master_gauge_name} ${g.identification_number} ${g.manf_serial_number} ${g.inward_gauge_lab_id} ${g.make}`.toLowerCase().includes(gaugeSearch.toLowerCase()))
  const metrics = direction === "sent" ? [
    ["Inward entries", summary?.transaction_count], ["Gauge entries sent", summary?.gauge_count],
    ["Returned", summary?.returned_count], ["Awaiting return", summary?.awaiting_return_count],
  ] : [["Outward entries", summary?.transaction_count], ["Gauge entries returned", summary?.gauge_count]]
  return <div className="space-y-4">
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(([label, count], index) => <Card key={String(label)} className={[
      "border-blue-200/70 bg-blue-50/80 dark:border-blue-900 dark:bg-blue-950/30",
      "border-violet-200/70 bg-violet-50/80 dark:border-violet-900 dark:bg-violet-950/30",
      "border-emerald-200/70 bg-emerald-50/80 dark:border-emerald-900 dark:bg-emerald-950/30",
      "border-amber-200/70 bg-amber-50/80 dark:border-amber-900 dark:bg-amber-950/30",
    ][index]}><CardContent className="p-4" aria-busy={query.isFetching}><p className="text-sm text-muted-foreground">{label}</p>{query.isFetching ? <Skeleton role="status" aria-label={`Loading ${label}`} className="mt-2 h-8 w-20" /> : <p className="mt-1 text-2xl font-semibold">{invalidDates || query.isError ? "—" : count ?? 0}</p>}</CardContent></Card>)}</div>
    <p className="text-xs text-muted-foreground">Totals cover all filtered records. Gauge entries count each calibration visit, including repeat visits by the same gauge.</p>
    <div className="flex flex-wrap items-end gap-2"><Input className="min-w-60 flex-1" aria-label="Search transactions" placeholder="Search number, DC, gauge, identification or Lab ID…" value={search} onChange={e => setSearch(e.target.value)} />
      <label className="text-xs text-muted-foreground">From date<Input aria-label="From date" type="date" value={from} onChange={e => setFrom(e.target.value)} /></label>
      <label className="text-xs text-muted-foreground">To date<Input aria-label="To date" type="date" value={to} onChange={e => setTo(e.target.value)} /></label>
      {through.enabled && <ThroughGroupFilter value={through.group} onChange={through.setGroup} />}
      <Button variant="default" disabled={query.isFetching || invalidDates} onClick={() => void query.refetch()}>Refresh</Button>
      <Button variant="default" onClick={() => { setSearch(""); setFrom(""); setTo(""); setPage(0); through.setGroup("all") }}>Reset</Button>
    </div>
    {invalidDates && <p role="alert" className="text-sm text-destructive">From date must not be after to date.</p>}
    {query.isError && !invalidDates && <p role="alert" className="text-sm text-destructive">Unable to load transactions. Please try Refresh.</p>}
    <div className="overflow-x-auto rounded-md border bg-background shadow-sm"><Table><TableHeader className="bg-muted/80"><TableRow>
      {["Sr No", direction === "sent" ? "Inward No" : "Outward No", direction === "sent" ? "Inward date" : "Outward date", direction === "sent" ? "Customer DC No" : "Transport by", "Gauges", "Status", "Actions"].map(label => <TableHead key={label}>{label}</TableHead>)}
    </TableRow></TableHeader><TableBody>{query.isLoading ? <TableRow><TableCell colSpan={7}>Loading transactions…</TableCell></TableRow> : !invalidDates && rows.map((entry, i) => <TableRow key={entry.id} className="even:bg-muted/30 hover:bg-muted/60">
      <TableCell>{page * limit + i + 1}</TableCell><TableCell><Badge variant="primary">{entry.number ?? "—"}</Badge></TableCell>
      <TableCell className="whitespace-nowrap">{date(entry.date)}</TableCell><TableCell>{(direction === "sent" ? entry.client_dc_no : entry.transport_by) || "—"}</TableCell>
      <TableCell><Badge variant="outline">{entry.gauge_count}</Badge></TableCell>
      <TableCell><Badge variant="outline">{direction === "sent" ? progress(entry) : entry.gauge_count ? "Returned" : "No gauges added"}</Badge></TableCell>
      <TableCell><div className="flex gap-2"><Button size="sm" variant="default" disabled={busy} onClick={() => void inspect(entry)}>View gauges</Button><Button size="sm" variant="default" disabled={busy} onClick={() => void inspect(entry, true)}>Print</Button></div></TableCell>
    </TableRow>)}{!query.isLoading && !rows.length && !invalidDates && <TableRow><TableCell colSpan={7}>No matching {direction === "sent" ? "inward" : "outward"} entries.</TableCell></TableRow>}</TableBody></Table></div>
    <div className="flex flex-wrap items-center justify-between gap-2 text-sm"><span>{invalidDates ? 0 : query.data?.total ?? 0} entries · Page {page + 1}</span><div className="flex gap-2">
      <Select value={String(limit)} onValueChange={value => setLimit(Number(value))}><SelectTrigger aria-label="Rows per page" className="w-20"><SelectValue /></SelectTrigger><SelectContent>{[10, 25, 50, 100].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent></Select>
      <Button variant="default" disabled={!page || invalidDates} onClick={() => setPage(page - 1)}>Previous</Button><Button variant="default" disabled={invalidDates || (page + 1) * limit >= (query.data?.total ?? 0)} onClick={() => setPage(page + 1)}>Next</Button>
    </div></div>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[90vh] max-w-6xl overflow-y-auto"><DialogHeader>
      <DialogTitle>{direction === "sent" ? "Sent for Calibration · Inward" : "Received from Calibration · Outward"} {detail?.entry.number}</DialogTitle>
      <DialogDescription>{date(detail?.entry.date)} · {detail?.gauges.length ?? 0} gauge entries</DialogDescription>
    </DialogHeader>
      <div className="flex flex-wrap gap-3 text-sm">{direction === "received" ? <span>Transport: {detail?.entry.transport_by || "—"}</span> : <><span>Customer DC: {detail?.entry.client_dc_no || "—"}</span><span>DC date: {date(detail?.entry.client_dc_date)}</span><span>Laboratory received: {date(detail?.entry.received_date)}</span><span>Committed date: {date(detail?.entry.commit_date)}</span></>}
      </div>
      <Input aria-label="Search transaction gauges" placeholder="Find a gauge, identification, serial or Lab ID…" value={gaugeSearch} onChange={e => { setGaugeSearch(e.target.value); setGaugePage(0) }} />
      <div className="overflow-x-auto rounded-md border bg-background shadow-sm"><Table><TableHeader className="bg-muted/80"><TableRow>{["Sr No", "Lab ID", ...(direction === "received" ? ["Source inward / DC"] : []), "Gauge", "Identification", "Serial", "Make", "Specification", "Frequency", "Process", "Calibration status", "Return status"].map(label => <TableHead key={label}>{label}</TableHead>)}</TableRow></TableHeader>
        <TableBody>{filteredGauges.slice(gaugePage * 25, (gaugePage + 1) * 25).map((g, i) => <TableRow key={g.gauge_inward_id} className="even:bg-muted/30 hover:bg-muted/60">
          <TableCell>{gaugePage * 25 + i + 1}</TableCell><TableCell className="whitespace-nowrap"><Badge variant="primary">{g.inward_gauge_lab_id || "—"}</Badge></TableCell>
          {direction === "received" && <TableCell><Badge variant="outline">{g.inward_no}</Badge><p className="mt-1 text-xs text-muted-foreground">{g.client_dc_no || "—"}</p></TableCell>}
          <TableCell>{g.master_gauge_name}</TableCell><TableCell>{g.identification_number || "—"}</TableCell><TableCell>{g.manf_serial_number || "—"}</TableCell><TableCell>{g.make || "—"}</TableCell>
          <TableCell>{formatSpecificationForPrint(g.specifications, g.unit)}</TableCell><TableCell>{g.calibration_frequency ? `${g.calibration_frequency} ${g.calibration_frequency_unit}` : "—"}</TableCell><TableCell>{g.process.replaceAll("_", " ")}</TableCell><TableCell>{statusLabel(g.status)}</TableCell>
          <TableCell><Badge variant="outline">{g.returned ? "Returned" : "Awaiting return"}</Badge>{g.returned && <p className="mt-1 text-xs">Outward {g.outward_no}</p>}</TableCell>
        </TableRow>)}{!filteredGauges.length && <TableRow><TableCell colSpan={direction === "received" ? 12 : 11}>No matching gauges.</TableCell></TableRow>}</TableBody></Table>
      </div>
      <div className="flex flex-wrap justify-between gap-2"><span className="text-sm">{filteredGauges.length} matching gauges</span><div className="flex gap-2"><Button variant="default" disabled={!gaugePage} onClick={() => setGaugePage(gaugePage - 1)}>Previous gauges</Button><Button variant="default" disabled={(gaugePage + 1) * 25 >= filteredGauges.length} onClick={() => setGaugePage(gaugePage + 1)}>Next gauges</Button></div></div>
      {direction === "received" && <p className="text-sm text-muted-foreground">These are laboratory dispatch records. Customer verification remains a separate step.</p>}
      <div className="flex flex-wrap justify-end gap-2">{direction === "received" && <Button asChild variant="default"><Link to="/transactions/gauge-acceptance">Gauge Verification &amp; Acceptance</Link></Button>}
        <Button variant="default" onClick={() => { setOpen(false); setPrint(true) }}>Print all transaction gauges</Button><Button variant="default" onClick={() => setOpen(false)}>Close</Button></div>
    </DialogContent></Dialog>
    {detail?.direction === "sent" && <OutwardChallanPrintPreview open={print} onOpenChange={setPrint} companyName={printInfo.organization?.name || detail.entry.client_org_name} companyAddress={printInfo.organizationAddress} inward={detail.inward_details} gauges={detail.gauges} />}
    {detail?.direction === "received" && <InwardOutwardPrintPreview open={print} onOpenChange={setPrint} companyName={printInfo.organization?.name || detail.entry.client_org_name} companyAddress={printInfo.organizationAddress} selectedOutward={detail.outward_details} gauges={detail.gauges} />}
  </div>
}
