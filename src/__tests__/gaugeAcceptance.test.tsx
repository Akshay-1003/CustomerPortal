import { beforeEach, afterEach, describe, expect, it, vi } from "vitest"
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter } from "react-router-dom"
import GaugeAcceptance from "@/pages/transactions/GaugeAcceptance"
import { CalibrationHistoryReport } from "@/components/reports/CalibrationHistoryReport"
import { acceptanceService } from "@/services/gaugeAcceptance.service"
import { apiService } from "@/services/api.service"
import { gaugeService } from "@/services/gauge.service"
import { createDemoState, loadDemoState, saveDemoState, demoUser } from "@/demo/data"
import type { ReviewValues } from "@/types/gaugeAcceptance"

const auth = vi.hoisted(() => ({ viewer: false }))
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: { organization_id: "demo-customer", roles: [auth.viewer ? "org_viewer" : "org_admin"], user: { ...demoUser, role: auth.viewer ? "org_viewer" : "org_admin" } } }) }))
const clients: QueryClient[] = []
beforeEach(() => {
  auth.viewer = false
  sessionStorage.clear(); sessionStorage.setItem("customerportal.demo-session", "active")
  saveDemoState(createDemoState(new Date(2026, 10, 2, 12)))
  vi.spyOn(XMLHttpRequest.prototype, "open").mockImplementation(() => { throw new Error("Real network forbidden") })
})
afterEach(() => { cleanup(); clients.forEach(c => c.clear()); clients.length = 0; sessionStorage.clear(); vi.restoreAllMocks() })
function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } }); clients.push(client)
  return render(<QueryClientProvider client={client}><MemoryRouter><GaugeAcceptance /></MemoryRouter></QueryClientProvider>)
}
function values(changes: Partial<ReviewValues> = {}): ReviewValues {
  return { decision: "accept", remark_note: "", fields: {}, correction_reason: "", idempotency_key: "acceptance-test-key", ...changes }
}
const pending = () => loadDemoState().acceptances.filter(r => r.status === "pending")

describe("customer gauge verification", () => {
  it("saves an individual review, releases only its latest history, and corrects it without losing fields", async () => {
    const row = pending()[0]
    const before = await gaugeService.getGaugeHistory(row.gauge_id)
    const saved = await acceptanceService.review(row, values({ fields: { part_name: "Spindle", gauge_location: "Line A" } }))
    expect(saved.review?.status).toBe("accepted")
    expect((await gaugeService.getGaugeHistory(row.gauge_id))).toHaveLength(before.length + 1)
    expect((await gaugeService.getGaugeById(row.gauge_id)).customer_acceptance?.part_name).toBe("Spindle")
    expect((await acceptanceService.review(row, values({ fields: { part_name: "Spindle", gauge_location: "Line A" } }))).outcome).toBe("replayed")
    const current = await acceptanceService.detail(row.outward_gauge_id)
    await acceptanceService.review(current, values({ idempotency_key: "correction-key-123", correction_reason: "Moved", fields: { gauge_location: "" } }))
    const corrected = await acceptanceService.detail(row.outward_gauge_id)
    expect(corrected.review?.part_name).toBe("Spindle")
    expect(corrected.review?.gauge_location).toBe("")
    expect(corrected.review?.history).toHaveLength(2)
    expect(corrected.review?.history[0].gauge_location).toBe("Line A")
  })

  it("supports mixed bulk results and repeat-safe retries", async () => {
    const rows = pending().slice(0, 3)
    const selected = rows.map(r => ({ ...r, certificate_revision: r === rows[2] ? 999 : r.certificate_revision }))
    const data = values({ decision: "repair", remark_note: "Inspection requires repair", fields: { acceptance_criteria: "Check fit" } })
    const result = await acceptanceService.bulk(selected, data)
    expect(result.saved).toBe(2); expect(result.failed).toBe(1)
    const retry = await acceptanceService.bulk(selected, data)
    expect(retry.replayed).toBe(2); expect(retry.failed).toBe(1)
    expect((await acceptanceService.detail(rows[0].outward_gauge_id)).status).toBe("rejected")
    expect((await gaugeService.getGaugeById(rows[0].gauge_id)).pending_acceptance).toBe(false)
    await expect(acceptanceService.bulk(selected, { ...data, remark_note: "Changed" })).rejects.toThrow("different values")
  })

  it("requires review again after certificate replacement while preserving older review history", async () => {
    const row = loadDemoState().acceptances.find(r => r.status === "accepted")!
    const original = await gaugeService.getGaugeHistory(row.gauge_id)
    await apiService.post("/demo/replace-acceptance-certificate", { id: row.outward_gauge_id })
    const current = await acceptanceService.detail(row.outward_gauge_id)
    expect(current.status).toBe("pending"); expect(current.certificate_revision).toBe(2)
    await expect(acceptanceService.review(row, values({ correction_reason: "Stale" }))).rejects.toThrow("Certificate changed")
    const history = await gaugeService.getGaugeHistory(row.gauge_id)
    expect(history).toHaveLength(original.length)
    expect(history[0].customer_acceptance?.decision).toBe(row.decision)
    await acceptanceService.review(current, values())
    expect((await gaugeService.getGaugeHistory(row.gauge_id))).toHaveLength(original.length + 1)
  })

  it("keeps earlier unreviewed certificate revisions hidden after another replacement", async () => {
    const row = pending()[0]
    const count = (await gaugeService.getGaugeHistory(row.gauge_id)).length
    await apiService.post("/demo/replace-acceptance-certificate", { id: row.outward_gauge_id })
    expect(await gaugeService.getGaugeHistory(row.gauge_id)).toHaveLength(count)
    const current = await acceptanceService.detail(row.outward_gauge_id)
    await acceptanceService.review(current, values())
    expect(await gaugeService.getGaugeHistory(row.gauge_id)).toHaveLength(count + 1)
  })

  it("filters counts before status, with exact Accept versus Conditional Accept matching", async () => {
    const all = await acceptanceService.list({ status: "pending", search: "", page: 0, limit: 100 })
    expect(all.counts).toEqual({ pending: 5, accepted: 4, rejected: 3 })
    const accepted = await acceptanceService.list({ status: "accepted", decision: "accept", search: "", page: 0, limit: 100 })
    expect(accepted.data).toHaveLength(3)
    expect(accepted.data.every(r => r.decision === "accept")).toBe(true)
  })

  it("opens Review, validates an exception remark, then shows View and audited editing", async () => {
    renderPage()
    await screen.findByRole("button", { name: "Pending Acceptance · 5" })
    fireEvent.click(screen.getAllByRole("button", { name: "Review" })[0])
    const dialog = await screen.findByRole("dialog")
    fireEvent.change(within(dialog).getByLabelText("Review decision"), { target: { value: "not_ok" } })
    fireEvent.submit(within(dialog).getByRole("button", { name: "Save review" }).closest("form")!)
    expect(await within(dialog).findByRole("alert")).toHaveTextContent("Enter a remark")
    fireEvent.change(within(dialog).getByLabelText("Remark note"), { target: { value: "Damage found" } })
    fireEvent.submit(within(dialog).getByRole("button", { name: "Save review" }).closest("form")!)
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
    fireEvent.click(screen.getByRole("button", { name: "Rejected · 4" }))
    await waitFor(() => expect(screen.getAllByRole("button", { name: "View" })).toHaveLength(4))
    fireEvent.click(screen.getAllByRole("button", { name: "View" })[0])
    const view = await screen.findByRole("dialog")
    expect(within(view).getByLabelText("Review decision")).toBeDisabled()
    fireEvent.click(within(view).getByRole("button", { name: "Edit review" }))
    expect(within(view).getByLabelText("Correction reason")).toBeRequired()
  })

  it("bulk-selects the current page, preserves disabled fields, and clears selection after filters change", async () => {
    renderPage()
    await screen.findByRole("button", { name: "Pending Acceptance · 5" })
    fireEvent.click(screen.getByRole("checkbox", { name: "Select current page" }))
    expect(screen.getByText("5 selected")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Bulk Accept" }))
    const dialog = await screen.findByRole("dialog")
    expect(within(dialog).getByText("5 pending · 0 corrections. Optional fields change only when enabled below.")).toBeInTheDocument()
    expect(within(dialog).getByRole("textbox", { name: /^Gauge location/ })).toBeDisabled()
    fireEvent.click(within(dialog).getAllByRole("checkbox")[0])
    fireEvent.change(within(dialog).getByRole("textbox", { name: /^Maintenance \/ other details/ }), { target: { value: "Inspected" } })
    fireEvent.click(within(dialog).getByRole("button", { name: "Confirm bulk review" }))
    await waitFor(() => expect(pending()).toHaveLength(0))
    expect(screen.getByText("0 selected")).toBeInTheDocument()
    expect(loadDemoState().acceptances.filter(r => r.review?.maintenance_details === "Inspected")).toHaveLength(5)
    fireEvent.click(screen.getByRole("button", { name: "Accepted · 9" }))
    await waitFor(() => expect(screen.getByRole("checkbox", { name: "Select current page" })).toBeEnabled())
    fireEvent.click(screen.getByRole("checkbox", { name: "Select current page" }))
    fireEvent.change(screen.getByLabelText("Filter review decision"), { target: { value: "conditional_accept" } })
    await waitFor(() => expect(screen.getByText("0 selected")).toBeInTheDocument())
  })

  it("keeps failed bulk rows selected and reports their reasons", async () => {
    const realBulk = acceptanceService.bulk.bind(acceptanceService)
    vi.spyOn(acceptanceService, "bulk").mockImplementation((items, body) => realBulk(items.map((i, index) => ({ ...i, certificate_revision: index === 1 ? 999 : i.certificate_revision })), body))
    renderPage()
    await screen.findByRole("button", { name: "Pending Acceptance · 5" })
    fireEvent.click(screen.getByRole("checkbox", { name: "Select current page" }))
    fireEvent.click(screen.getByRole("button", { name: "Bulk Accept" }))
    fireEvent.click(await screen.findByRole("button", { name: "Confirm bulk review" }))
    await waitFor(() => expect(screen.getByText("1 selected")).toBeInTheDocument())
    expect(screen.getByLabelText("Review results")).toHaveTextContent("Certificate changed")
  })

  it("keeps permission-restricted customers read-only", async () => {
    auth.viewer = true
    renderPage()
    await screen.findByRole("button", { name: "Pending Acceptance · 5" })
    expect(screen.queryByRole("button", { name: "Bulk Accept" })).not.toBeInTheDocument()
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument()
    expect(screen.getAllByRole("button", { name: "Review" })[0]).toBeDisabled()
    fireEvent.click(screen.getByRole("button", { name: "Accepted · 4" }))
    await waitFor(() => expect(screen.getAllByRole("button", { name: "View" })).toHaveLength(4))
    fireEvent.click(screen.getAllByRole("button", { name: "View" })[0])
    await screen.findByRole("dialog")
    expect(screen.queryByRole("button", { name: "Edit review" })).not.toBeInTheDocument()
    expect(XMLHttpRequest.prototype.open).not.toHaveBeenCalled()
  })

  it("prints each cycle's own review metadata and paginates long remarks without losing text", () => {
    const state = loadDemoState()
    const row = state.acceptances.find(r => r.review)!
    const review = { ...row.review!, remark_note: `BEGIN-NOTE ${"detailed note ".repeat(300)} END-NOTE`,
      gauge_location: "NEW-LOCATION", part_name: "CUSTOMER-PART-991", acceptance_criteria: "USE-WITH-TOLERANCE" }
    const gauge = { ...state.gauges.find(g => g.id === row.gauge_id)!, customer_acceptance: review }
    const original = state.histories[gauge.id][0]
    const history = [{ ...original, customer_acceptance: review }, { ...original, id: "earlier-cycle",
      customer_acceptance: { ...review, remark_note: "Earlier cycle", gauge_location: "OLD-LOCATION" } }]
    const { container } = render(<MemoryRouter><CalibrationHistoryReport gauge={gauge} history={history} /></MemoryRouter>)
    const printable = container.querySelector(".chr-preview-pages")!
    expect(printable.querySelectorAll(".chr-report-page").length).toBeGreaterThan(1)
    expect(printable.textContent).toContain("END-NOTE")
    expect(printable.textContent).toContain("CUSTOMER-PART-991")
    expect(printable.textContent).toContain("USE-WITH-TOLERANCE")
    expect(printable.textContent).toContain("NEW-LOCATION")
    expect(printable.textContent).toContain("OLD-LOCATION")
  })
})
