import { useCallback, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { PrintPreviewActions } from "@/components/export/PrintPreviewActions"
import { exportSpreadsheetData, exportTablePdf } from "@/lib/export/export.service"
import type { DownloadFormat, ExportColumn } from "@/lib/export/types"
import "./GaugeListPrintPreview.css"

export type GaugeListPrintRow = {
  serialNo: number
  clientOrganization: string
  name: string
  identification: string
  specifications: string
  serial: string
  frequency: string
  remark: string
  make: string
}

type GaugeListPrintPreviewProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  rows: GaugeListPrintRow[]
  companyName: string
  companyAddress?: string
}

const GAUGE_LIST_EXPORT_COLUMNS: ExportColumn<GaugeListPrintRow>[] = [
  { key: "serialNo", header: "SN", accessor: "serialNo", width: 8, pdfWidth: 8 },
  // { key: "clientOrganization", header: "Client Organization", accessor: "clientOrganization", width: 24, pdfWidth: 24 },
  { key: "name", header: "Gauge Name", accessor: "name", width: 24, pdfWidth: 24 },
  { key: "identification", header: "Identification", accessor: "identification", width: 18, pdfWidth: 18 },
  { key: "specifications", header: "Specification", accessor: "specifications", width: 24, pdfWidth: 24 },
  { key: "serial", header: "Serial", accessor: "serial", width: 16, pdfWidth: 16 },
  { key: "frequency", header: "Cal. Freq.", accessor: "frequency", width: 16, pdfWidth: 16 },
    { key: "make", header: "Make", accessor: "make", width: 16, pdfWidth: 16 },

  { key: "remark", header: "Remark", accessor: "remark", width: 14, pdfWidth: 14 },
]

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

function buildPrintHtml(rows: GaugeListPrintRow[], companyName: string, companyAddress: string) {
  const rowsHtml = rows
    .map(
      (row) => `
        <tr>
          <td class="sn-col">${row.serialNo}</td>
          <td>${escapeHtml(row.identification)}</td>
          <td>${escapeHtml(row.specifications)}</td>
          <td>${escapeHtml(row.serial)}</td>
          <td>${escapeHtml(row.frequency)}</td>
          <td>${escapeHtml(row.make)}</td>
          <td>${escapeHtml(row.remark)}</td>
        </tr>
      `
    )
    .join("")

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Gauge List Print</title>
        <style>
          @page { size: A4 portrait; margin: 4mm; }
          * { box-sizing: border-box; }
          body { margin: 0; color: #111; font-family: Arial, sans-serif; }
          .print-header { margin-bottom: 6px; }
          .company-name { font-size: 22px; font-weight: 700; line-height: 1.15; }
          .company-address { font-size: 11px; color: #333; line-height: 1.3; margin-top: 1px; }
          .doc-title { margin: 6px 0 4px; text-align: center; font-size: 18px; font-weight: 700; }
          .print-table { width: 100%; border-collapse: collapse; table-layout: auto; }
          .print-table th, .print-table td {
            border: 1px solid #6b7280;
            padding: 4px 5px;
            font-size: 10px;
            line-height: 1.2;
            text-align: left;
            vertical-align: top;
            word-break: break-word;
          }
          .sn-col { width: 42px; min-width: 42px; max-width: 42px; }
          .print-table th { background: #f3f4f6; font-weight: 700; }
          thead { display: table-header-group; }
        </style>
      </head>
      <body>
        <header class="print-header">
          <div class="company-name">${escapeHtml(companyName)}</div>
          <div class="company-address">${escapeHtml(companyAddress)}</div>
          <div class="doc-title">GAUGES AND INSTRUMENTS LIST</div>
        </header>
        <table class="print-table">
          <thead>
            <tr>
              <th class="sn-col">SN</th>
              <th>Gauge Name</th>
              <th>Identification</th>
              <th>Specification</th>
              <th>Serial</th>
              <th>Cal. Freq.</th>
              <th>Remark</th>
              <th>Make</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </body>
    </html>
  `
}

export function GaugeListPrintPreview({
  open,
  onOpenChange,
  rows,
  companyName,
  companyAddress = "Address not available",
}: GaugeListPrintPreviewProps) {
  const previewRows = useMemo(() => rows, [rows])
  const fileName = useMemo(() => `${companyName}_gauge_list`, [companyName])

  const onPrint = useCallback(() => {
    const iframe = document.createElement("iframe")
    iframe.style.position = "fixed"
    iframe.style.right = "0"
    iframe.style.bottom = "0"
    iframe.style.width = "0"
    iframe.style.height = "0"
    iframe.style.border = "0"
    document.body.appendChild(iframe)

    const doc = iframe.contentDocument || iframe.contentWindow?.document
    if (!doc) return

    const html = buildPrintHtml(rows, companyName, companyAddress)
    doc.open()
    doc.write(html)
    doc.close()

    setTimeout(() => {
      iframe.contentWindow?.focus()
      iframe.contentWindow?.print()
      setTimeout(() => {
        document.body.removeChild(iframe)
      }, 500)
    }, 250)
  }, [rows, companyAddress, companyName])

  const onDownload = useCallback((format: DownloadFormat) => {
    const result =
      format === "pdf"
        ? exportTablePdf({
            fileName,
            title: "Gauges and Instruments List",
            companyName,
            companyAddress,
            rows,
            columns: GAUGE_LIST_EXPORT_COLUMNS,
          })
        : exportSpreadsheetData({
            fileName,
            format,
            sheets: [
              {
                name: "Gauge List",
                rows,
                columns: GAUGE_LIST_EXPORT_COLUMNS,
              },
            ],
          })

    if (!result.ok) {
      toast.error(
        result.reason === "empty"
          ? "No rows available to export."
          : "Unable to export because the document columns are not configured."
      )
      return
    }

    toast.success(`${result.format.toUpperCase()} export downloaded successfully.`)
  }, [companyAddress, companyName, fileName, rows])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw] max-w-[96vw] p-0">
        <div className="gl-print-preview-root">
          <DialogHeader className="gl-print-preview-header">
            <div>
              <DialogTitle className="gl-print-org-name">{companyName}</DialogTitle>
              <div className="gl-print-org-address">{companyAddress}</div>
              <div className="gl-preview-title">GAUGES AND INSTRUMENTS LIST</div>
            </div>
            <div className="gl-print-preview-header-actions">
              <PrintPreviewActions disabled={rows.length === 0} onPrint={onPrint} onDownload={onDownload} />
            </div>
          </DialogHeader>

          <div className="gl-print-preview-body">
            <section className="gl-preview-sheet">
              <table className="gl-preview-table">
                <thead>
                  <tr>
                    <th className="gl-col-sn">SN</th>
                    <th>Client Organization</th>
                    <th>Gauge Name</th>
                    <th>Identification</th>
                    <th>Specification</th>
                    <th>Serial</th>
                    <th>Calibration Frequency</th>
                    <th>Remark</th>
                    <th>Make</th>
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row) => (
                    <tr key={`row-${row.serialNo}`}>
                      <td>{row.serialNo}</td>
                      <td>{row.clientOrganization}</td>
                      <td>{row.name}</td>
                      <td>{row.identification}</td>
                      <td>{row.specifications}</td>
                      <td>{row.serial}</td>
                      <td>{row.frequency}</td>
                      <td>{row.remark}</td>
                      <td>{row.make}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
