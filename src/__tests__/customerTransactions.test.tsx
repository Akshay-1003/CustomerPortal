import { beforeEach, afterEach, describe, expect, it, vi } from "vitest"
import { render, screen, within, fireEvent, waitFor, cleanup } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter } from "react-router-dom"
import { apiService } from "@/services/api.service"
import { customerTransactionsService } from "@/services/customerTransactions.service"
import { createDemoState, loadDemoState, saveDemoState, demoUser } from "@/demo/data"
import InwardPage from "@/pages/transactions/InwardPage"
import OutwardPage from "@/pages/transactions/OutwardPage"

vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: { organization_id: "demo-customer", roles: ["org_admin"], user: demoUser } }) }))
const clients: QueryClient[] = []
beforeEach(() => {
  sessionStorage.clear(); sessionStorage.setItem("customerportal.demo-session", "active")
  saveDemoState(createDemoState(new Date(2026, 10, 3, 12)))
  vi.spyOn(XMLHttpRequest.prototype, "open").mockImplementation(() => { throw new Error("No live API requests in demo tests") })
})
afterEach(() => { cleanup(); clients.forEach(c => c.clear()); clients.length = 0; apiService.clearLocalAuthState(false); sessionStorage.clear(); vi.restoreAllMocks() })
function renderPage(direction: "sent" | "received") {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } }); clients.push(client)
  return render(<QueryClientProvider client={client}><MemoryRouter>{direction === "sent" ? <InwardPage /> : <OutwardPage />}</MemoryRouter></QueryClientProvider>)
}
const filters = { search: "", page: 0, limit: 10 }

describe("customer inward/outward mapping", () => {
  it("maps Sent to inwards, Received to outwards, and returns totals across all pages", async () => {
    const get = vi.spyOn(apiService, "get")
    const sent = await customerTransactionsService.list("sent", filters)
    expect(get).toHaveBeenLastCalledWith("/customer/transactions/inwards", expect.anything())
    expect(sent.total).toBe(24); expect(sent.data).toHaveLength(10)
    expect(sent.summary.gauge_count).toBe(24)
    expect(sent.summary.returned_count).toBe(12); expect(sent.summary.awaiting_return_count).toBe(12)
    const received = await customerTransactionsService.list("received", filters)
    expect(get).toHaveBeenLastCalledWith("/customer/transactions/outwards", expect.anything())
    expect(received.total).toBe(12); expect(received.summary.gauge_count).toBe(12)
    expect((await customerTransactionsService.list("sent", { ...filters, page: 2 })).data).toHaveLength(4)
    expect(XMLHttpRequest.prototype.open).not.toHaveBeenCalled()
  })

  it("searches transaction and gauge details, and maps date filters to their source dates", async () => {
    const source = loadDemoState().transactions[0]
    const gaugeId = source.gauge_ids[0]
    const gauge = loadDemoState().gauges.find(g => g.id === gaugeId)!
    expect((await customerTransactionsService.list("sent", { ...filters, search: gauge.identification_number })).total).toBe(1)
    const result = await customerTransactionsService.list("received", { ...filters, date_from: source.received_date, date_to: source.received_date })
    expect(result.data.every(r => r.date === source.received_date)).toBe(true)
    const detail = await customerTransactionsService.detail("received", source.id)
    expect(detail.gauges[0].gauge_id).toBe(gaugeId)
    expect(detail.direction).toBe("received")
    expect(detail.gauges[0].certificate_id).toBe("")
    expect(detail.gauges[0]).not.toHaveProperty("certificate_url")
  })

  it("preserves the gauge's sent snapshot after the master is edited", async () => {
    const state = loadDemoState(), source = state.transactions[0]
    const original = source.gauge_snapshots![source.gauge_ids[0]].identification_number
    state.gauges.find(g => g.id === source.gauge_ids[0])!.identification_number = "UPDATED-MASTER"
    saveDemoState(state)
    const detail = await customerTransactionsService.detail("sent", source.id)
    expect(detail.gauges[0].identification_number).toBe(original)
  })

  it("shows the correct live page titles, source columns and gauge modal", async () => {
    const source = (await customerTransactionsService.list("sent", filters)).data[0]
    renderPage("sent")
    expect(await screen.findByRole("heading", { name: "Sent for Calibration" })).toBeInTheDocument()
    await screen.findByText("24 entries · Page 1")
    expect(screen.getByRole("columnheader", { name: "Inward No" })).toBeInTheDocument()
    expect(screen.queryByRole("columnheader", { name: "Outward No" })).not.toBeInTheDocument()
    fireEvent.click(screen.getAllByRole("button", { name: "View gauges" })[0])
    const dialog = await screen.findByRole("dialog")
    expect(within(dialog).getByRole("heading", { name: `Sent for Calibration · Inward ${source.number}` })).toBeInTheDocument()
    expect(within(dialog).getByRole("columnheader", { name: "Calibration status" })).toBeInTheDocument()
    const detail = await customerTransactionsService.detail("sent", source.id)
    expect(within(dialog).getByText(detail.gauges[0].identification_number)).toBeInTheDocument()
    expect(within(dialog).getByRole("button", { name: "Print all transaction gauges" })).toBeInTheDocument()
  })

  it("shows Received as laboratory outward dispatches with a separate verification step", async () => {
    renderPage("received")
    await screen.findByText("12 entries · Page 1")
    expect(screen.getByRole("heading", { name: "Received from Calibration" })).toBeInTheDocument()
    expect(screen.getByRole("columnheader", { name: "Outward No" })).toBeInTheDocument()
    fireEvent.click(screen.getAllByRole("button", { name: "View gauges" })[0])
    const dialog = await screen.findByRole("dialog")
    expect(within(dialog).getByRole("columnheader", { name: "Source inward / DC" })).toBeInTheDocument()
    expect(within(dialog).getByRole("link", { name: "Gauge Verification & Acceptance" })).toHaveAttribute("href", "/transactions/gauge-acceptance")
    expect(within(dialog).getByText(/These are laboratory dispatch records/)).toBeInTheDocument()
  })

  it("paginates on the server and uses a customer detail endpoint rather than laboratory APIs", async () => {
    const list = vi.spyOn(customerTransactionsService, "list")
    const detail = vi.spyOn(customerTransactionsService, "detail")
    renderPage("sent")
    await screen.findByText("24 entries · Page 1")
    fireEvent.click(screen.getByRole("button", { name: "Next" }))
    await screen.findByText("24 entries · Page 2")
    expect(list).toHaveBeenLastCalledWith("sent", expect.objectContaining({ page: 1, limit: 10 }))
    fireEvent.click(screen.getAllByRole("button", { name: "View gauges" })[0])
    await screen.findByRole("dialog")
    expect(detail).toHaveBeenLastCalledWith("sent", expect.any(String), undefined)
  })

  it("loads all gauges for printing rather than only the visible detail page", async () => {
    const state = loadDemoState()
    state.transactions.unshift({ id: "bulk-inward", gauge_ids: state.gauges.slice(0, 30).map(g => g.id), date: "2026-11-03", number: 99999 })
    saveDemoState(state)
    renderPage("sent")
    await screen.findByText("25 entries · Page 1")
    const row = within(screen.getByRole("table")).getByText("99999").closest("tr")!
    fireEvent.click(within(row as HTMLElement).getByRole("button", { name: "View gauges" }))
    const dialog = await screen.findByRole("dialog")
    expect(within(dialog).getByText("30 matching gauges")).toBeInTheDocument()
    expect(within(dialog).queryByText("QA-030")).not.toBeInTheDocument()
    fireEvent.click(within(dialog).getByRole("button", { name: "Print all transaction gauges" }))
    const print = await screen.findByRole("dialog")
    await waitFor(() => expect(within(print).getByText("QA-030")).toBeInTheDocument())
  })

  it("shows empty and error states and blocks invalid date ranges", async () => {
    renderPage("received")
    await screen.findByText("12 entries · Page 1")
    fireEvent.change(screen.getByLabelText("Search transactions"), { target: { value: "no-such-gauge" } })
    await screen.findByText("No matching outward entries.")
    fireEvent.change(screen.getByLabelText("From date"), { target: { value: "2026-11-10" } })
    fireEvent.change(screen.getByLabelText("To date"), { target: { value: "2026-11-01" } })
    expect(screen.getByRole("alert")).toHaveTextContent("From date must not be after")
    expect(screen.getByRole("button", { name: "Refresh" })).toBeDisabled()
  })
})
