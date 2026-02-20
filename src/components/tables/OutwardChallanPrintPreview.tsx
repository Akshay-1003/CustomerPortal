import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { Inward, InwardGauge } from "@/types/api"
import { formatSpecificationForPrint } from "@/components/reports/helpers/specificationFormatter"
import "./OutwardChallanPrintPreview.css"
import { PrinterCheckIcon } from "lucide-react"
type OutwardChallanPrintPreviewProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyName: string
  companyAddress?: string
  inward: Inward
  gauges: InwardGauge[]
}

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
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "N/A"
  return date.toLocaleDateString("en-GB")
}

function buildPrintHtml(
  companyName: string,
  companyAddress: string,
  inward: Inward,
  gauges: InwardGauge[]
) {
  const gaugeRows = gauges
    .map((row, index) => {
      const frequency = row.calibration_frequency
        ? `${row.calibration_frequency} ${row.calibration_frequency_unit || ""}`
        : "N/A"
      return `
        <tr>
          <td class="sn-col">${index + 1}</td>
          <td>${escapeHtml(row.master_gauge_name || "N/A")}</td>
          <td>${escapeHtml(row.identification_number || "N/A")}</td>
          <td>${escapeHtml(row.manf_serial_number || "N/A")}</td>
          <td>${escapeHtml(row.make || "N/A")}</td>
          <td>${escapeHtml(frequency)}</td>
          <td>${escapeHtml(formatSpecificationForPrint(row.specifications))}</td>
          <td>${escapeHtml(row.inward_gauge_lab_id || "N/A")}</td>
        </tr>
      `
    })
    .join("")

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Outward Challan Print</title>
        <style>
          @page { size: A4 portrait;margin: 4mm; }
          * { box-sizing: border-box; }
          body { margin: 0; color: #111; font-family: Arial, sans-serif; }
          .print-header { margin-bottom: 6px; }
          .company-name { font-size: 22px; font-weight: 700; line-height: 1.15; }
          .company-address { font-size: 11px; color: #333; line-height: 1.3; margin-top: 1px; }
          .doc-title { margin: 10px 0 10px; text-align: center; font-size: 18px; font-weight: 700; }
          .table-scroll { width: 100%; overflow-x: auto; }
          .meta-table, .gauges-table { width: 100%; border-collapse: collapse; table-layout: auto; }
          .meta-table { margin-bottom: 8px; }
          .meta-table th, .meta-table td, .gauges-table th, .gauges-table td {
            border: 1px solid #6b7280;
            padding: 4px 5px;
            font-size: 10px;
            line-height: 1.2;
            text-align: left;
            vertical-align: top;
            word-break: break-word;
          }
          .meta-table th, .gauges-table th { background: #f3f4f6; font-weight: 700; }
          .sn-col { width: 42px; min-width: 42px; max-width: 42px; }
          thead { display: table-header-group; }
        </style>
      </head>
      <body>
        <header class="print-header">
          <div class="company-name">${escapeHtml(companyName)}</div>
          <div class="company-address">${escapeHtml(companyAddress)}</div>
          <div class="doc-title">OUTWARD CHALLAN ${escapeHtml(String(inward.inward_no))}</div>
        </header>
        <div class="table-scroll">
          <table class="meta-table">
            <tbody>
              <tr>
                <th>Outward No</th>
                <th>Inward ID</th>
                <th>Client DC No</th>
                <th>Client DC Date</th>
                <th>Inward Date</th>
                <th>Total Gauges</th>
              </tr>
              <tr>
                <td>${inward.inward_no}</td>
                <td>${escapeHtml(inward.id)}</td>
                <td>${escapeHtml(inward.client_dc_no || "N/A")}</td>
                <td>${escapeHtml(formatDate(inward.client_dc_date))}</td>
                <td>${escapeHtml(formatDate(inward.inward_date))}</td>
                <td>${gauges.length}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="table-scroll">
          <table class="gauges-table">
            <thead>
              <tr>
                <th class="sn-col">SN</th>
                <th>Gauge Name</th>
                <th>Identification</th>
                <th>Serial</th>
                <th>Make</th>
                <th>Frequency</th>
                <th>Specifications</th>
                <th>Lab ID</th>
              </tr>
            </thead>
            <tbody>${gaugeRows}</tbody>
          </table>
        </div>
      </body>
    </html>
  `
}

export function OutwardChallanPrintPreview({
  open,
  onOpenChange,
  companyName,
  companyAddress = "Address not available",
  inward,
  gauges,
}: OutwardChallanPrintPreviewProps) {
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

    const html = buildPrintHtml(companyName, companyAddress, inward, gauges)
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw] max-w-[96vw] h-[94vh] p-0">
        <div className="oc-print-preview-root">
          <DialogHeader className="oc-print-preview-header">
            <div>
              <DialogTitle className="oc-print-org-name">{companyName}</DialogTitle>
              <div className="oc-print-org-address">{companyAddress}</div>
              <div className="oc-preview-title">OUTWARD CHALLAN</div>
            </div>
            <div className="oc-print-preview-header-actions">
              <Button onClick={onPrint}>
                <PrinterCheckIcon className="h-4 w-4" /> Print
              </Button>
            </div>
          </DialogHeader>

          <div className="oc-print-preview-body">
            <section className="oc-preview-sheet">
              <div className="oc-table-scroll">
                <table className="oc-preview-meta-table">
                  <tbody>
                    <tr>
                      <th>Outward No</th>
                      <th>Inward ID</th>
                      <th>Client DC No</th>
                      <th>Client DC Date</th>
                      <th>Inward Date</th>
                      <th>Total Gauges</th>
                    </tr>
                    <tr>
                      <td>{inward.inward_no}</td>
                      <td>{inward.id}</td>
                      <td>{inward.client_dc_no || "N/A"}</td>
                      <td>{formatDate(inward.client_dc_date)}</td>
                      <td>{formatDate(inward.inward_date)}</td>
                      <td>{gauges.length}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="oc-table-scroll">
                <table className="oc-preview-gauges-table">
                  <thead>
                    <tr>
                      <th className="oc-col-sn">SN</th>
                      <th>Client Name</th>
                      <th>Gauge Name</th>
                      <th>Identification</th>
                      <th>Specifications</th>
                      <th>Serial</th>
                      <th>Make</th>
                      <th>Frequency</th>
                      <th>Lab ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gauges.map((row, index) => {
                      const frequency = row.calibration_frequency
                        ? `${row.calibration_frequency} ${row.calibration_frequency_unit || ""}`
                        : "N/A"
                      return (
                        <tr key={row.id || `${row.gauge_id}-${index}`}>
                          <td>{index + 1}</td>
                          <td>{row.client_org_name || "N/A"}</td>
                          <td>{row.master_gauge_name || "N/A"}</td>
                          <td>{row.identification_number || "N/A"}</td>
                          <td>{formatSpecificationForPrint(row.specifications)}</td>
                          <td>{row.manf_serial_number || "N/A"}</td>
                          <td>{row.make || "N/A"}</td>
                          <td>{frequency}</td>
                          <td>{row.inward_gauge_lab_id || "N/A"}</td>
                        </tr>
                      )
                    })}
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

