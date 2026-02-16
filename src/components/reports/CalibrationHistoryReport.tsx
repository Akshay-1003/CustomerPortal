import { useMemo } from "react"
import { Button } from "@/components/ui/button"
import type { Gauge, GaugeHistory } from "@/types/api"
import { Printer } from "lucide-react"

type CalibrationRow = {
  certificateNo: string
  calibrationDate: string
  observations: string
  remark: string
  calibratedBy: string
  dueDate: string
  maintenanceDetails: string
}

type ReportPage = {
  type: "full" | "compact"
  rows: CalibrationRow[]
}

type CalibrationHistoryReportProps = {
  gauge?: Gauge
  history?: GaugeHistory[]
}

const A4_WIDTH_PX = 794
const A4_HEIGHT_PX = 1123
const PAGE_MARGIN_PX = 10
const PRINTABLE_HEIGHT_PX = A4_HEIGHT_PX - PAGE_MARGIN_PX * 2

const FULL_HEADER_HEIGHT_PX = 298
const COMPACT_HEADER_HEIGHT_PX = 88
const FOOTER_HEIGHT_PX = 64
const TABLE_HEADER_HEIGHT_PX = 34

const FIRST_PAGE_ROW_SPACE_PX =
  PRINTABLE_HEIGHT_PX - FULL_HEADER_HEIGHT_PX - FOOTER_HEIGHT_PX - TABLE_HEADER_HEIGHT_PX
const COMPACT_PAGE_ROW_SPACE_PX =
  PRINTABLE_HEIGHT_PX - COMPACT_HEADER_HEIGHT_PX - FOOTER_HEIGHT_PX - TABLE_HEADER_HEIGHT_PX

const COMPANY = {
  name: "CALIBRATION SERVICES",
  address: "123 Industrial Avenue, Manufacturing District",
  contact: "Tel: +1-555-0123 | Email: calibration@company.com",
}

function readSpec(specifications: Record<string, any> | undefined, keys: string[], fallback = "N/A"): string {
  if (!specifications) {
    return fallback
  }

  for (const key of keys) {
    const value = specifications[key]
    if (value === undefined || value === null) {
      continue
    }

    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      const normalized = String(value).trim()
      if (normalized !== "") {
        return normalized
      }
      continue
    }

    if (typeof value === "object") {
      const nestedValue = value.value || value.label || value.text
      if (nestedValue !== undefined && nestedValue !== null && String(nestedValue).trim() !== "") {
        return String(nestedValue).trim()
      }
    }
  }

  return fallback
}

function formatDate(value?: string): string {
  if (!value) {
    return "N/A"
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleDateString("en-GB")
}

function toCalibrationRows(history: GaugeHistory[] = []): CalibrationRow[] {
  if (!history.length) {
    return []
  }

  return history.map((record, index) => ({
    certificateNo: record.inward_gauge_lab_id || record.certificate || `CERT-${index + 1}`,
    calibrationDate: formatDate(record.certificate_issue_date || record.date),
    observations: record.notes || record.result || "N/A",
    remark:
      record.result ||
      (record.status === "calibration_completed" ? "Completed" : record.status || "N/A"),
    calibratedBy: record.performed_by || "N/A",
    dueDate: formatDate(record.next_calibration_date),
    maintenanceDetails:
      record.action === "Maintenance" ? (record.notes || "Maintenance completed") : record.action || "N/A",
  }))
}

function estimateLines(text: string, charsPerLine: number): number {
  const safeText = text || ""
  const paragraphLines = safeText
    .split("\n")
    .reduce((sum, segment) => sum + Math.max(1, Math.ceil(segment.length / charsPerLine)), 0)

  return Math.max(1, paragraphLines)
}

function estimateRowHeight(row: CalibrationRow): number {
  const lines = [
    estimateLines(row.certificateNo, 14),
    estimateLines(row.calibrationDate, 10),
    estimateLines(row.observations, 30),
    estimateLines(row.remark, 20),
    estimateLines(row.calibratedBy, 18),
    estimateLines(row.dueDate, 10),
    estimateLines(row.maintenanceDetails, 24),
  ]

  return Math.max(...lines) * 14 + 12
}

function paginateRows(rows: CalibrationRow[]): ReportPage[] {
  if (!rows.length) {
    return [{ type: "full", rows: [] }]
  }

  const pages: ReportPage[] = []
  let currentPageType: "full" | "compact" = "full"
  let available = FIRST_PAGE_ROW_SPACE_PX
  let currentRows: CalibrationRow[] = []

  const pushPage = () => {
    pages.push({ type: currentPageType, rows: currentRows })
    currentPageType = "compact"
    available = COMPACT_PAGE_ROW_SPACE_PX
    currentRows = []
  }

  for (const row of rows) {
    const rowHeight = estimateRowHeight(row)

    if (rowHeight > available && currentRows.length > 0) {
      pushPage()
    }

    currentRows.push(row)
    available -= rowHeight
  }

  if (currentRows.length > 0) {
    pages.push({ type: currentPageType, rows: currentRows })
  }

  return pages
}

function renderLabelValue(label: string, value: string) {
  return (
    <div className="chr-field" key={label}>
      <span className="chr-field-label">{label}</span>
      <span className="chr-field-value">{value}</span>
    </div>
  )
}

export function CalibrationHistoryReport({ gauge, history }: CalibrationHistoryReportProps) {
  const rows = useMemo(() => toCalibrationRows(history), [history])
  const pages = useMemo(() => paginateRows(rows), [rows])

  const specificationSize =
    readSpec(gauge?.specifications, ["size", "specification_size", "range"]) || "N/A"

  const referenceStandard = readSpec(gauge?.specifications, [
    "reference_standard",
    "master_equipment",
    "standard",
  ])

  const acceptanceCriteria = readSpec(gauge?.specifications, ["acceptance_criteria", "acceptance_limit"])
  const goLimit = readSpec(gauge?.specifications, ["go_limit", "go", "go_value"])
  const noGoLimit = readSpec(gauge?.specifications, ["no_go_limit", "nogo", "no_go", "no_go_value"])

  const footerMeta = {
    documentCode: readSpec(gauge?.specifications, ["document_code", "doc_code"], "DOC-GHC-001"),
    revisionNo: readSpec(gauge?.specifications, ["revision_no", "revision"], "00"),
    revisionDate: formatDate(readSpec(gauge?.specifications, ["revision_date"], "")) || "N/A",
    preparedBy: readSpec(gauge?.specifications, ["prepared_by"], "Calibration Department"),
    approvedBy: readSpec(gauge?.specifications, ["approved_by"], "Quality Head"),
  }

  const onPrint = () => {
    window.print()
  }

  const renderTable = (page: ReportPage) => (
    <table className="chr-table">
      <colgroup>
        <col style={{ width: "13%" }} />
        <col style={{ width: "11%" }} />
        <col style={{ width: "22%" }} />
        <col style={{ width: "12%" }} />
        <col style={{ width: "13%" }} />
        <col style={{ width: "11%" }} />
        <col style={{ width: "18%" }} />
      </colgroup>
      <thead>
        <tr>
          <th>Certificate No</th>
          <th>Calibration Date</th>
          <th>Observations</th>
          <th>Remark</th>
          <th>Calibrated By</th>
          <th>Due Date</th>
          <th>Maintenance Details</th>
        </tr>
      </thead>
      <tbody>
        {page.rows.length === 0 ? (
          <tr>
            <td colSpan={7} className="chr-empty-row">
              No calibration history available.
            </td>
          </tr>
        ) : (
          page.rows.map((row, rowIndex) => (
            <tr key={`${row.certificateNo}-${rowIndex}`}>
              <td>{row.certificateNo}</td>
              <td>{row.calibrationDate}</td>
              <td>{row.observations}</td>
              <td>{row.remark}</td>
              <td>{row.calibratedBy}</td>
              <td>{row.dueDate}</td>
              <td>{row.maintenanceDetails}</td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  )

  const renderPage = (page: ReportPage, pageIndex: number) => {
    const pageNumber = pageIndex + 1
    const totalPages = pages.length

    return (
      <article className="chr-report-page" key={`page-${pageNumber}`}>
        <div className="chr-page-content">
          {page.type === "full" ? (
            <header className="chr-header-full">
              <div className="chr-company-block">
                <div>
                  <h2>{gauge?.client_organization || COMPANY.name}</h2>
                  <p>{COMPANY.address}</p>
                  <p>{COMPANY.contact}</p>
                </div>
              </div>

              <div className="chr-title-block">
                <h1>HISTORY CARD (Gauge and Instrument)</h1>
              </div>

              <div className="chr-ref-grid">
                {renderLabelValue("Reference Standard / Master Equipment", referenceStandard)}
                {renderLabelValue("Specification Size", specificationSize)}
              </div>

              <div className="chr-acceptance-block">
                <div className="chr-acceptance-title">Acceptance Limit Table</div>
                <table className="chr-acceptance-table">
                  <tbody>
                    <tr>
                      <th>Go</th>
                      <td>{goLimit}</td>
                      <th>No-Go</th>
                      <td>{noGoLimit}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="chr-gauge-details">
                <div className="chr-gauge-title">Complete Gauge Details</div>
                <div className="chr-gauge-grid">
                  {renderLabelValue("Code No", gauge?.identification_number || "N/A")}
                  {renderLabelValue("Make", gauge?.make || "N/A")}
                  {renderLabelValue("Serial No", gauge?.manf_serial_number || "N/A")}
                  {renderLabelValue("Part Name", gauge?.master_gauge || "N/A")}
                  {renderLabelValue("Calibration Agency", gauge?.calibration_location || "N/A")}
                  {renderLabelValue(
                    "Frequency",
                    gauge?.calibration_frequency
                      ? `${gauge.calibration_frequency} ${gauge.calibration_frequency_unit}`
                      : "N/A"
                  )}
                  {renderLabelValue("Acceptance Criteria", acceptanceCriteria)}
                </div>
              </div>
            </header>
          ) : (
            <header className="chr-header-compact">
              <div className="chr-company-compact">
                <span>{gauge?.client_organization || COMPANY.name}</span>
              </div>
              <div className="chr-title-compact">HISTORY CARD (Gauge and Instrument)</div>
              <div className="chr-compact-meta">
                <span>Gauge Code: {gauge?.identification_number || "N/A"}</span>
                <span>Serial No: {gauge?.manf_serial_number || "N/A"}</span>
                <span>Specification Size: {specificationSize}</span>
              </div>
            </header>
          )}

          <section className="chr-history-table-wrap">{renderTable(page)}</section>

          <footer className="chr-footer">
            <div className="chr-footer-left">
              <span>Document Code: {footerMeta.documentCode}</span>
              <span>Revision No: {footerMeta.revisionNo}</span>
              <span>Revision Date: {footerMeta.revisionDate}</span>
              <span>Prepared By: {footerMeta.preparedBy}</span>
              <span>Approved By: {footerMeta.approvedBy}</span>
            </div>
            <div className="chr-footer-right">Page {pageNumber} of {totalPages}</div>
          </footer>
        </div>
      </article>
    )
  }

  return (
    <>
      <div className="chr-actions chr-no-print">
        <Button size="sm" onClick={onPrint}>
          <Printer className="h-4 w-4" />
          Print Report
        </Button>
      </div>

      <div className="chr-report-root chr-report-print-root">


        <div className="chr-preview-pages chr-no-print">
          {pages.map((page, pageIndex) => (
            <div className="chr-slide" key={`slide-${pageIndex}`}>
              {renderPage(page, pageIndex)}
            </div>
          ))}
        </div>

        <div className="chr-report-print-only">
          {pages.map((page, pageIndex) => (
            <div key={`print-page-${pageIndex}`}>{renderPage(page, pageIndex)}</div>
          ))}
        </div>

        <style>{`
        .chr-report-root {
          width: 100%;
          border: 1px solid #d1d5db;
        }

        .chr-preview-pages {
          width: 100%;
        }

        .chr-actions {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 8px;
          margin-top: 8px;
        }

        .chr-slide {
          width: 100%;
        }

        .chr-slide + .chr-slide {
          margin-top: 10px;
        }

        .chr-report-page {
          width: 100%;
          overflow: hidden;
        }

        .chr-page-content {
          height: 100%;
          box-sizing: border-box;
          padding: ${PAGE_MARGIN_PX}px;
          display: flex;
          flex-direction: column;
        }

        .chr-header-full {
          margin-bottom: 10px;
        }

        .chr-company-block h2 {
          margin: 0;
          font-size: 16px;
          font-weight: 700;
          letter-spacing: 0.2px;
        }

        .chr-company-block p {
          margin: 1px 0;
          font-size: 11px;
        }

        .chr-title-block h1 {
          margin: 8px 0;
          text-align: center;
          font-size: 14px;
          border-top: 1px solid #d1d5db;
          border-bottom: 1px solid #d1d5db;
          padding: 7px 4px;
          font-weight: 700;
        }

        .chr-ref-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px;
          margin-bottom: 8px;
        }

        .chr-acceptance-title,
        .chr-gauge-title {
          font-size: 11px;
          font-weight: 700;
          margin: 6px 0;
        }

        .chr-acceptance-table,
        .chr-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
        }

        .chr-acceptance-table th,
        .chr-acceptance-table td {
          border: 1px solid #d1d5db;
          padding: 5px 7px;
          font-size: 11px;
          text-align: left;
        }

        .chr-gauge-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px;
        }

        .chr-field {
          display: flex;
          border: 1px solid #d1d5db;
        }

        .chr-field-label,
        .chr-field-value {
          padding: 4px 6px;
          font-size: 12px;
        }

        .chr-field-label {
          width: 42%;
          border-right: 1px solid #d1d5db;
          font-weight: 700;
        }

        .chr-field-value {
          width: 58%;
          word-break: break-word;
        }

        .chr-header-compact {
          padding: 8px 10px;
          margin-bottom: 10px;
        }

        .chr-company-compact {
          font-size: 12px;
          font-weight: 700;
        }

        .chr-title-compact {
          text-align: center;
          font-size: 12px;
          font-weight: 700;
          margin: 4px 0;
          border-top: 1px solid #d1d5db;
          border-bottom: 1px solid #d1d5db;
          padding: 4px 0;
        }

        .chr-compact-meta {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          font-size: 10px;
          flex-wrap: wrap;
        }

        .chr-history-table-wrap {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .chr-table th,
        .chr-table td {
          border: 1px solid #d1d5db;
          font-size: 12px;
          text-align: left;
          vertical-align: top;
          padding: 5px 6px;
          line-height: 1.4;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
        }

        .chr-table th {
          font-weight: 700;
        }

        .chr-empty-row {
          text-align: center;
          font-style: italic;
          padding: 10px 0;
        }

        .chr-footer {
          margin-top: 10px;
          border-top: 1px solid #d1d5db;
          padding-top: 8px;
          display: flex;
          justify-content: space-between;
          gap: 10px;
          font-size: 10px;
          min-height: ${FOOTER_HEIGHT_PX - 7}px;
        }

        .chr-footer-left {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 2px 8px;
          width: 82%;
        }

        .chr-footer-right {
          width: 18%;
          text-align: right;
          font-weight: 700;
          align-self: flex-end;
        }

        .chr-report-print-only {
          display: none;
        }

        @media print {
          body * {
            visibility: hidden !important;
          }

          .chr-report-print-root,
          .chr-report-print-root * {
            visibility: visible !important;
          }

          .chr-report-print-root {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            padding: 0;
            margin: 0;
          }

          .chr-no-print,
          .chr-no-print * {
            display: none !important;
            visibility: hidden !important;
            height: 0 !important;
            overflow: hidden !important;
          }

          .chr-report-print-only {
            display: block !important;
            visibility: visible !important;
          }

          .chr-report-page {
            width: ${A4_WIDTH_PX}px !important;
            min-height: ${A4_HEIGHT_PX}px !important;
            max-height: ${A4_HEIGHT_PX}px !important;
            margin: 0;
            page-break-after: always;
          }

          .chr-report-page:last-child {
            page-break-after: auto;
          }
        }

        @page {
          size: A4 portrait;
          margin: 0;
        }

        @media print {
          .chr-title-block h1,
          .chr-title-compact,
          .chr-footer {
            border-color: #000 !important;
          }

          .chr-table th,
          .chr-table td,
          .chr-acceptance-table th,
          .chr-acceptance-table td,
          .chr-field,
          .chr-field-label {
            border-color: #000 !important;
          }
        }
      `}</style>
      </div>

    </>

  )
}
