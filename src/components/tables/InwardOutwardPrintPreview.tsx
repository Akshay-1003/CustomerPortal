import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { OutwardGauge, Outward } from "@/types/api"
import { formatSpecificationForPrint } from "@/components/reports/helpers/specificationFormatter"
import { toast } from "sonner"
import { PrintPreviewActions } from "@/components/export/PrintPreviewActions"
import { exportSpreadsheetData, exportTablePdf } from "@/lib/export/export.service"
import type { DownloadFormat, ExportColumn } from "@/lib/export/types"
import "./InwardOutwardPrintPreview.css"

type InwardOutwardPrintPreviewProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyName: string
  companyAddress?: string
  gauges: OutwardGauge[]
  selectedOutward: Outward
}

const INWARD_EXPORT_COLUMNS: ExportColumn<OutwardGauge>[] = [
  { key: "inward_gauge_lab_id", header: "Lab ID", accessor: (row) => row.inward_gauge_lab_id || "N/A", width: 16, pdfWidth: 16 },
  { key: "master_gauge_name", header: "Gauge Name", accessor: (row) => row.master_gauge_name || "N/A", width: 24, pdfWidth: 24 },
  { key: "identification_number", header: "Identification", accessor: (row) => row.identification_number || "N/A", width: 18, pdfWidth: 18 },
  { key: "specifications", header: "Specifications", accessor: (row) => formatSpecificationForPrint(row.specifications), width: 24, pdfWidth: 24 },
  { key: "manf_serial_number", header: "Serial", accessor: (row) => row.manf_serial_number || "N/A", width: 16, pdfWidth: 16 },
  { key: "process", header: "Process", accessor: (row) => row.process || "N/A", width: 14, pdfWidth: 14 },
  { key: "status", header: "Status", accessor: (row) => row.status || "N/A", width: 14, pdfWidth: 14 },
  { key: "inward_date", header: "Inward Date", accessor: (row) => formatDate(row.inward_date), width: 14, pdfWidth: 14 },
]

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

function formatDate(value?: string): string {
  if (!value) return "N/A"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return "N/A"
  return d.toLocaleDateString("en-GB")
}

function buildPrintHtml(companyName: string, companyAddress: string, gauges: OutwardGauge[]) {
  const rows = gauges
    .map((row, index) => {
      return `
        <tr>
          <td class="sn-col">${index + 1}</td>
          <td>${escapeHtml(row.inward_gauge_lab_id || "N/A")}</td>
          <td>${escapeHtml(row.master_gauge_name || "N/A")}</td>
          <td>${escapeHtml(row.identification_number || "N/A")}</td>
          <td>${escapeHtml(formatSpecificationForPrint(row.specifications))}</td>
          <td>${escapeHtml(row.manf_serial_number || "N/A")}</td>
          <td>${escapeHtml(row.process || "N/A")}</td>
          <td>${escapeHtml(row.status || "N/A")}</td>
          <td>${escapeHtml(formatDate(row.inward_date))}</td>
        </tr>
      `
    })
    .join("")

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Inward Print</title>
        <style>
          @page { size: A4 portrait; margin: 12mm; }
          * { box-sizing: border-box; }
          body { margin: 0; color: #111; font-family: Arial, sans-serif; }
          .print-header { margin-bottom: 6px; }
          .company-name { font-size: 22px; font-weight: 700; line-height: 1.15; }
          .company-address { font-size: 11px; color: #333; line-height: 1.3; margin-top: 1px; }
          .doc-title { margin: 6px 0 4px; text-align: center; font-size: 18px; font-weight: 700; }
          .table-scroll { width: 100%; overflow-x: auto; }
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
          <div class="doc-title">INWARD GAUGE LIST</div>
        </header>
        <div class="table-scroll">
          <table class="print-table">
            <thead>
              <tr>
                <th class="sn-col">SN</th>
                <th>Lab ID</th>
                <th>Gauge Name</th>
                <th>Identification</th>
                <th>Specifications</th>
                <th>Serial</th>
                <th>Process</th>
                <th>Status</th>
                <th>Inward Date</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </body>
    </html>
  `
}

export function InwardOutwardPrintPreview({
  open,
  onOpenChange,
  companyName,
  companyAddress = "Address not available",
  gauges,
  selectedOutward,
}: InwardOutwardPrintPreviewProps) {
  const fileName = `${companyName}_inward_gauge_list`

  const onPrint = () => {
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

    const html = buildPrintHtml(companyName, companyAddress, gauges)
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
  }

  const onDownload = (format: DownloadFormat) => {
    const result =
      format === "pdf"
        ? exportTablePdf({
            fileName,
            title: "Inward Gauge List",
            companyName,
            companyAddress,
            rows: gauges,
            columns: INWARD_EXPORT_COLUMNS,
          })
        : exportSpreadsheetData({
            fileName,
            format,
            sheets: [
              {
                name: "Inward Gauges",
                rows: gauges,
                columns: INWARD_EXPORT_COLUMNS,
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
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw] max-w-[96vw] h-[94vh] p-0">
        <div className="iop-print-preview-root">
          <DialogHeader className="iop-print-preview-header">
            <div>
              <DialogTitle className="iop-print-org-name">{companyName}</DialogTitle>
              <div className="iop-print-org-address">{companyAddress}</div>
              <div className="iop-preview-title">INWARD GAUGE LIST</div>
            </div>
            <PrintPreviewActions disabled={gauges.length === 0} onPrint={onPrint} onDownload={onDownload} />
          </DialogHeader>

          <div className="iop-print-preview-body">
            <section className="iop-preview-sheet">
              <div className="iop-table-scroll">
                <table className="iop-preview-table">
                  <thead>
                    <tr>
                      <th className="iop-col-sn">SN</th>
                      <th>Lab ID</th>
                      <th>Gauge Name</th>
                      <th>Identification</th>
                      <th>Specifications</th>
                      <th>Serial</th>
                      <th>Process</th>
                      <th>Status</th>
                      <th>Inward Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gauges.map((row, index) => (
                      <tr key={row.id || `${row.gauge_id}-${index}`}>
                        <td>{index + 1}</td>
                        <td>{row.inward_gauge_lab_id || "N/A"}</td>
                        <td>{row.master_gauge_name || "N/A"}</td>
                        <td>{row.identification_number || "N/A"}</td>
                        <td>{formatSpecificationForPrint(row.specifications)}</td>
                        <td>{row.manf_serial_number || "N/A"}</td>
                        <td>{row.process || "N/A"}</td>
                        <td>{row.status || "N/A"}</td>
                        <td>{formatDate(selectedOutward.outward_date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
