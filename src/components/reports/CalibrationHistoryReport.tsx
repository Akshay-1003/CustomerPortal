import { useMemo } from "react"
import { Button } from "@/components/ui/button"
import type { Gauge, GaugeHistory } from "@/types/api"
import { Printer } from "lucide-react"
import {
  extractGoValue,
  extractNoGoValue,
  formatSpecificationByKeys,
  formatSpecificationForPrint,
} from "./helpers/specificationFormatter"
import { DynamicAcceptanceLimitTable } from "./helpers/DynamicAcceptanceLimitTable"

type CalibrationRow = {
  certificateNo: string
  certificateUrl?: string
  calibrationDate: string
  observations: string
  gauge_condition: string
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

type LabelValue = {
  label: string
  value: string
}

const A4_WIDTH_PX = 794
const A4_HEIGHT_PX = 1123
const PAGE_MARGIN_PX = 32
const PRINTABLE_HEIGHT_PX = A4_HEIGHT_PX - PAGE_MARGIN_PX * 2

const FULL_HEADER_HEIGHT_PX = 360
const COMPACT_HEADER_HEIGHT_PX = 96
const FOOTER_HEIGHT_PX = 52
const TABLE_HEADER_HEIGHT_PX = 32

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
  if (!specifications) return fallback
  for (const key of keys) {
    const value = specifications[key]
    if (value === undefined || value === null) continue
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      const normalized = String(value).trim()
      if (normalized) return normalized
      continue
    }
    if (typeof value === "object") {
      const nestedValue = value.value || value.label || value.text
      if (nestedValue !== undefined && nestedValue !== null && String(nestedValue).trim()) {
        return String(nestedValue).trim()
      }
    }
  }
  return fallback
}

function formatDate(value?: string): string {
  if (!value) return "N/A"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "N/A"
  return date.toLocaleDateString("en-GB")
}

function toCalibrationRows(history: GaugeHistory[] = []): CalibrationRow[] {
  return history.map((record, index) => {
    const raw = record as GaugeHistory & { certificate_number?: string; certificate_url?: string }
    return {
      certificateNo: raw.certificate_number || record.inward_gauge_lab_id || record.certificate || `CERT-${index + 1}`,
      certificateUrl: raw.certificate_url,
      calibrationDate: formatDate(record.certificate_issue_date || record.date),
      observations: record.notes || record.result || "N/A",
      gauge_condition: record.gauge_condition || (record.gauge_condition === "calibration_completed" ? "Completed" : record.gauge_condition || "N/A"),
      calibratedBy: record.performed_by || "N/A",
      dueDate: formatDate(record.next_calibration_date),
      maintenanceDetails:
        record.action === "Maintenance" ? (record.notes || "Maintenance completed") : record.action || "N/A",
    }
  })
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
    estimateLines(row.certificateNo, 18),
    estimateLines(row.calibrationDate, 12),
    estimateLines(row.observations, 36),
    estimateLines(row.gauge_condition, 24),
    estimateLines(row.calibratedBy, 18),
    estimateLines(row.dueDate, 12),
    estimateLines(row.maintenanceDetails, 30),
  ]
  return Math.max(...lines) * 12 + 10
}

function paginateRows(rows: CalibrationRow[]): ReportPage[] {
  if (!rows.length) return [{ type: "full", rows: [] }]

  const pages: ReportPage[] = []
  let pageType: "full" | "compact" = "full"
  let availableHeight = FIRST_PAGE_ROW_SPACE_PX
  let currentRows: CalibrationRow[] = []

  const closeCurrentPage = () => {
    pages.push({ type: pageType, rows: currentRows })
    pageType = "compact"
    availableHeight = COMPACT_PAGE_ROW_SPACE_PX
    currentRows = []
  }

  for (const row of rows) {
    const rowHeight = estimateRowHeight(row)
    if (rowHeight > availableHeight && currentRows.length > 0) {
      closeCurrentPage()
    }
    currentRows.push(row)
    availableHeight -= rowHeight
  }

  if (currentRows.length > 0) {
    pages.push({ type: pageType, rows: currentRows })
  }

  return pages
}

function renderInfoGrid(items: LabelValue[]) {
  return (
    <div className="chr-info-grid">
      {items.map((item) => (
        <div className="chr-info-row" key={item.label}>
          <span className="chr-info-label">{item.label}</span>
          <span className="chr-info-value">{item.value}</span>
        </div>
      ))}
    </div>
  )
}

function renderCertificateCell(row: CalibrationRow) {
  if (row.certificateUrl) {
    return (
      <a href={row.certificateUrl} target="_blank" rel="noopener noreferrer" className="chr-cert-tag" title="Open Certificate">
        {row.certificateNo}
      </a>
    )
  }
  return <span className="chr-cert-tag chr-cert-tag-muted">{row.certificateNo}</span>
}

export function CalibrationHistoryReport({ gauge, history }: CalibrationHistoryReportProps) {
  const rows = useMemo(() => toCalibrationRows(history), [history])
  const pages = useMemo(() => paginateRows(rows), [rows])

  const specifications = (gauge?.specifications || {}) as Record<string, unknown>
  const unit = gauge?.unit || "mm"

  const specificationSize = formatSpecificationForPrint(specifications, unit) || "N/A"
  const acceptanceCriteria = formatSpecificationByKeys(
    specifications,
    ["acceptance_criteria", "acceptance_limit"],
    unit,
    "N/A"
  )
  const goLimit =
    extractGoValue((specifications as Record<string, unknown>).go) ||
    formatSpecificationByKeys(specifications, ["go_limit", "go", "go_value"], unit, "N/A")
  const noGoLimit =
    extractNoGoValue((specifications as Record<string, unknown>).no_go) ||
    formatSpecificationByKeys(specifications, ["no_go_limit", "nogo", "no_go", "no_go_value"], unit, "N/A")

  const footerMeta = {
    documentCode: readSpec(gauge?.specifications, ["document_code", "doc_code"], "DOC-GHC-001"),
    revisionNo: readSpec(gauge?.specifications, ["revision_no", "revision"], "00"),
    revisionDate: formatDate(readSpec(gauge?.specifications, ["revision_date"], "")),
    preparedBy: readSpec(gauge?.specifications, ["prepared_by"], "Calibration Department"),
    approvedBy: readSpec(gauge?.specifications, ["approved_by"], "Quality Head"),
  }

  const historyCardNo = gauge?.id ? gauge.id.slice(-6).toUpperCase() : "N/A"
  const topInfo: LabelValue[] = [
    { label: "Code No", value: gauge?.identification_number || "N/A" },
    { label: "History Card No", value: historyCardNo },
    { label: "Make", value: gauge?.make || "N/A" },
    { label: "Serial No", value: gauge?.manf_serial_number || "N/A" },
    { label: "Part Name", value: gauge?.part_name || "N/A" },
  ]

  const calibrationInfo: LabelValue[] = [
    { label: "Calibration Agency", value: "NABL Accredited LAB" },
    {
      label: "Frequency",
      value: gauge?.calibration_frequency
        ? `${gauge.calibration_frequency} ${gauge.calibration_frequency_unit || ""}`.trim()
        : "N/A",
    },
    { label: "REF. STD. (IF ANY)", value: gauge?.reference_standard || "N/A" },
    { label: "Last Calibration Date", value: formatDate(gauge?.certificate_issue_date) },
    { label: "Next Due Date", value: formatDate(gauge?.next_calibration_date) },
  ]

  const specificationInfoHeader: LabelValue[] = [
    { label: "Reference Standard / Master Equipment", value: gauge?.master_gauge || "N/A" },

  ]
  const specificationInfo: LabelValue[] = [
    { label: "Specification Size", value: specificationSize },
    { label: "Acceptance Criteria", value: acceptanceCriteria },
  ]
  const onPrint = () => window.print()

  const renderTable = (page: ReportPage) => (
    <table className="chr-table">
      <colgroup>
        <col style={{ width: "16%" }} />
        <col style={{ width: "12%" }} />
        <col style={{ width: "20%" }} />
        <col style={{ width: "10%" }} />
        <col style={{ width: "12%" }} />
        <col style={{ width: "12%" }} />
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
              <td>{renderCertificateCell(row)}</td>
              <td>{row.calibrationDate}</td>
              <td>{row.observations}</td>
              <td>{row.gauge_condition}</td>
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
              <div className="chr-headline-row">
                <div className="chr-company-head">
                  <h2>{gauge?.client_organization || COMPANY.name}</h2>
                  <p>{COMPANY.address}</p>
                  <p>{COMPANY.contact}</p>
                </div>
                <div className="chr-doc-title-inline">HISTORY CARD (Gauge and Instrument)</div>
              </div>
              <section className="chr-section">
                {renderInfoGrid(specificationInfoHeader)}
                
              </section>
              <div className="chr-top-grid">
                <section className="chr-section chr-section-top-info">
                  {renderInfoGrid(topInfo)}
                </section>

                <section className="chr-section chr-section-spec">
                  {renderInfoGrid(calibrationInfo)}
                </section>
              </div>

              <section className="chr-section mt-2">
                {renderInfoGrid(specificationInfo)}
                <div className="chr-acceptance-wrap">
                  <h4 className="chr-subtitle">Acceptance Limit</h4>
                  <DynamicAcceptanceLimitTable specifications={specifications} fallbackGo={goLimit} fallbackNoGo={noGoLimit} />
                </div>
              </section>
            </header>
          ) : (
            <header className="chr-header-compact">
              <div className="chr-company-compact">{gauge?.client_organization || COMPANY.name}</div>
              <div className="chr-title-compact">HISTORY CARD (Gauge and Instrument)</div>
              <div className="chr-compact-meta">
                <span>Gauge: {gauge?.identification_number || "N/A"}</span>
                <span>Serial: {gauge?.manf_serial_number || "N/A"}</span>
                <span>Spec: {specificationSize}</span>
              </div>
            </header>
          )}

          <section className="chr-history-wrap">
            <h3 className="chr-section-title">Calibration History</h3>
            {renderTable(page)}
          </section>

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
            max-width: 100%;
          }

          .chr-actions {
            display: flex;
            justify-content: flex-end;
            margin: 8px 0 12px;
          }

          .chr-preview-pages {
            width: 100%;
            background: #f3f4f6;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 12px;
            box-sizing: border-box;
          }

          .chr-slide + .chr-slide {
            margin-top: 12px;
          }

          .chr-report-page {
            width: 100%;
            background: #fff;
            color: #111827;
            overflow: hidden;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
          }

          .chr-page-content {
            min-height: ${A4_HEIGHT_PX}px;
            box-sizing: border-box;
            padding: ${PAGE_MARGIN_PX}px;
            display: flex;
            flex-direction: column;
            font-family: Arial, sans-serif;
          }

          .chr-header-full {
            margin-bottom: 10px;
          }

          .chr-headline-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 12px;
            border-bottom: 1px solid #d7dbe1;
            padding-bottom: 5px;
            margin-bottom: 7px;
          }

          .chr-company-head h2 {
            margin: 0;
            font-size: 16px;
            font-weight: 700;
          }

          .chr-company-head p {
            margin: 2px 0 0;
            font-size: 11px;
          }

          .chr-doc-title-inline {
            text-align: right;
            font-size: 13px;
            font-weight: 700;
            white-space: nowrap;
          }

          .chr-section {
            margin-bottom: 10px;
          }

          .chr-section-title {
            margin: 0 0 6px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.04em;
          }

          .chr-subtitle {
            margin: 0 0 4px;
            font-size: 11px;
            font-weight: 700;
          }

          .chr-side-title {
            margin: 0;
            padding: 4px 6px;
            font-size: 12px;
            font-weight: 700;
            border: 1px solid #d8dde3;
            border-bottom: 0;
            background: #fafbfc;
          }

          .chr-top-grid {
            display: grid;
            grid-template-columns: 58% 42%;
            gap: 10px;
            align-items: stretch;
          }

          .chr-section-top-info,
          .chr-section-spec {
            margin-bottom: 0;
          }

          .chr-info-grid {
            border: 1px solid #d8dde3;
          }

          .chr-info-row {
            display: grid;
            grid-template-columns: 42% 58%;
            min-height: 28px;
          }

          .chr-info-row + .chr-info-row {
            border-top: 1px solid #e9edf2;
          }

          .chr-info-label,
          .chr-info-value {
            padding: 4px 7px;
            font-size: 11px;
            line-height: 1.3;
            display: flex;
            align-items: center;
          }

          .chr-info-label {
            font-weight: 700;
            background: #fafbfc;
            border-right: 1px solid #e9edf2;
          }

          .chr-acceptance-wrap {
            margin-top: 6px;
          }

          .chr-acceptance-table,
          .chr-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
          }

          .chr-acceptance-table th,
          .chr-acceptance-table td,
          .chr-table th,
          .chr-table td {
            border: 1px solid #d8dde3;
            padding: 4px 6px;
            text-align: left;
            vertical-align: top;
            font-size: 11px;
            line-height: 1.3;
          }

          .chr-acceptance-table th,
          .chr-table th {
            font-weight: 700;
            background: #f6f8fa;
          }

          .chr-acceptance-table th:not(:first-child),
          .chr-acceptance-table td:not(:first-child) {
            text-align: center;
          }

          .chr-acceptance-table th:first-child,
          .chr-acceptance-table td:first-child {
            text-align: left;
          }

          .chr-history-wrap {
            flex: 1;
          }

          .chr-cert-tag {
            display: inline-flex;
            align-items: center;
            max-width: 100%;
            padding: 2px 8px;
            border-radius: 999px;
            border: 1px solid #cfd5dc;
            background: #f5f7fa;
            color: #111827;
            text-decoration: none;
            font-size: 10px;
            font-weight: 700;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .chr-cert-tag:hover {
            background: #f1f5f9;
          }

          .chr-cert-tag-muted {
            cursor: default;
          }

          .chr-empty-row {
            text-align: center;
            font-style: italic;
            color: #6b7280;
          }

          .chr-header-compact {
            margin-bottom: 8px;
          }

          .chr-company-compact {
            font-size: 12px;
            font-weight: 700;
          }

          .chr-title-compact {
            margin: 4px 0;
            padding: 4px 0;
            text-align: center;
            font-size: 12px;
            font-weight: 700;
            border-top: 1px solid #d1d5db;
            border-bottom: 1px solid #d1d5db;
          }

          .chr-compact-meta {
            display: flex;
            flex-wrap: wrap;
            gap: 8px 14px;
            font-size: 10px;
          }

          .chr-footer {
            margin-top: 8px;
            min-height: ${FOOTER_HEIGHT_PX}px;
            border-top: 1px solid #d1d5db;
            padding-top: 6px;
            display: flex;
            justify-content: space-between;
            gap: 10px;
            font-size: 10px;
          }

          .chr-footer-left {
            width: 84%;
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 2px 8px;
          }

          .chr-footer-right {
            width: 16%;
            text-align: right;
            align-self: flex-end;
            font-weight: 700;
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
              left: 0;
              top: 0;
              width: 100%;
              margin: 0;
              padding: 0;
            }

            .chr-no-print,
            .chr-no-print * {
              display: none !important;
              visibility: hidden !important;
            }

            .chr-report-print-only {
              display: block !important;
              visibility: visible !important;
            }

            .chr-report-page {
              width: ${A4_WIDTH_PX}px !important;
              min-height: ${A4_HEIGHT_PX}px !important;
              max-height: ${A4_HEIGHT_PX}px !important;
              border: none !important;
              border-radius: 0 !important;
              margin: 0 !important;
              page-break-after: always;
            }

            .chr-report-page:last-child {
              page-break-after: auto;
            }

            .chr-page-content {
              padding: 22px !important;
            }

            .chr-header-full {
              margin-bottom: 6px !important;
            }

            .chr-headline-row {
              gap: 8px !important;
              padding-bottom: 4px !important;
              margin-bottom: 4px !important;
              border-bottom: 1px solid #6b7280 !important;
            }

            .chr-company-head h2 {
              font-size: 14px !important;
            }

            .chr-company-head p {
              margin-top: 1px !important;
              font-size: 10px !important;
              line-height: 1.25 !important;
            }

            .chr-doc-title-inline {
              font-size: 11px !important;
            }

            .chr-section {
              margin-bottom: 6px !important;
            }

            .chr-section-title {
              margin-bottom: 4px !important;
              font-size: 10px !important;
              letter-spacing: 0.03em !important;
            }

            .chr-subtitle {
              margin-bottom: 3px !important;
              font-size: 10px !important;
            }

            .chr-top-grid {
              grid-template-columns: 60% 40% !important;
              gap: 0 !important;
              border: 1px solid #6b7280 !important;
            }

            .chr-section-top-info,
            .chr-section-spec {
              margin: 0 !important;
            }

            .chr-section-top-info {
              border-right: 1px solid #6b7280 !important;
            }

            .chr-side-title {
              margin: 0 !important;
              padding: 3px 5px !important;
              font-size: 10px !important;
              border: 0 !important;
              border-bottom: 1px solid #6b7280 !important;
              background: #f8f9fb !important;
            }

            .chr-info-row {
              min-height: 24px !important;
            }

            .chr-info-label,
            .chr-info-value {
              padding: 2px 5px !important;
              font-size: 10px !important;
              line-height: 1.25 !important;
            }

            .chr-info-grid,
            .chr-info-row + .chr-info-row,
            .chr-info-label {
              border-color: #6b7280 !important;
            }

            .chr-acceptance-wrap {
              margin-top: 0 !important;
            }

            .chr-acceptance-table th,
            .chr-acceptance-table td,
            .chr-table th,
            .chr-table td {
              border-color: #6b7280 !important;
              padding: 2px 5px !important;
              font-size: 10px !important;
              line-height: 1.2 !important;
            }

            .chr-acceptance-table th,
            .chr-table th {
              background: #f3f4f6 !important;
            }

            .chr-header-compact {
              margin-bottom: 5px !important;
            }

            .chr-company-compact {
              font-size: 11px !important;
            }

            .chr-title-compact {
              margin: 2px 0 !important;
              padding: 2px 0 !important;
              font-size: 11px !important;
            }

            .chr-compact-meta {
              gap: 5px 10px !important;
              font-size: 9px !important;
            }

            .chr-footer {
              margin-top: 6px !important;
              padding-top: 4px !important;
              min-height: 44px !important;
              font-size: 9px !important;
            }

            .chr-footer-left {
              gap: 1px 6px !important;
            }

            .chr-cert-tag {
              border-color: #4b5563 !important;
              background: #f3f4f6 !important;
              color: #111827 !important;
              font-size: 9px !important;
              font-weight: 700 !important;
              padding: 1px 5px !important;
            }
          }

          @page {
            size: A4 portrait;
            margin: 0;
          }
        `}</style>
      </div>
    </>
  )
}
