import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { loadDemoState, snapshot } from "@/demo/data"
import { gaugeService } from "@/services/gauge.service"

export function DemoCertificates() {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState("")
  const state = useQuery({ queryKey: ["demo-state"], queryFn: loadDemoState }).data
  const certificate = useQuery({ queryKey: ["demo-certificate", selected], queryFn: () => gaugeService.getGaugeHistory(selected), enabled: Boolean(selected) })
  const gauges = (state?.gauges ?? []).filter(g => `${g.identification_number} ${g.master_gauge_name} ${snapshot(g).laboratory_name}`.toLowerCase().includes(search.toLowerCase()))
  const pdf = certificate.data?.[0]?.certificate_url
  return <div className="space-y-4">
    <h1 className="text-3xl font-semibold">Calibration certificates</h1>
    <p className="text-sm text-muted-foreground">Sample certificates for the same 50 demo gauges. Every PDF is marked as a demonstration.</p>
    <Input aria-label="Search demo certificates" placeholder="Search gauge, identification, or laboratory" value={search} onChange={e => { setSearch(e.target.value); setPage(0) }} />
    <div className="overflow-x-auto rounded-md border"><Table><TableHeader><TableRow>
      <TableHead>Identification</TableHead><TableHead>Gauge</TableHead><TableHead>Laboratory</TableHead><TableHead>Calibrated</TableHead><TableHead>Next due</TableHead><TableHead>Certificate</TableHead>
    </TableRow></TableHeader><TableBody>{gauges.slice(page * 10, page * 10 + 10).map(g => <TableRow key={g.id}>
      <TableCell><Link className="text-primary underline" to={`/gauge/${g.id}`}>{g.identification_number}</Link></TableCell>
      <TableCell>{g.master_gauge_name}</TableCell><TableCell>{snapshot(g).laboratory_name}</TableCell>
      <TableCell>{g.certificate_issue_date}</TableCell><TableCell>{g.next_calibration_date}</TableCell>
      <TableCell><Button size="sm" variant="outline" onClick={() => setSelected(g.id)}>Preview PDF</Button></TableCell>
    </TableRow>)}{!gauges.length && <TableRow><TableCell colSpan={6}>No matching certificates.</TableCell></TableRow>}</TableBody></Table></div>
    <div className="flex items-center justify-between gap-2"><Badge variant="outline">{gauges.length} sample certificates</Badge>
      <div className="flex gap-2"><Button variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</Button>
        <Button variant="outline" disabled={(page + 1) * 10 >= gauges.length} onClick={() => setPage(page + 1)}>Next</Button></div>
    </div>
    <Dialog open={Boolean(selected)} onOpenChange={open => { if (!open) setSelected("") }}>
      <DialogContent className="max-w-4xl"><DialogHeader><DialogTitle>Demo certificate · Sample only</DialogTitle></DialogHeader>
        {certificate.isLoading && <p>Preparing sample PDF...</p>}
        {certificate.isError && <p role="alert">Unable to prepare the sample PDF.</p>}
        {pdf && <><iframe title="Demo calibration certificate PDF" src={pdf} className="h-[65vh] w-full" />
          <Button asChild><a href={pdf} download={`DEMO-${selected}.pdf`}>Download sample PDF</a></Button></>}
      </DialogContent>
    </Dialog>
  </div>
}
