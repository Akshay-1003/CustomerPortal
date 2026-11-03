import type { Inward, InwardGauge, Outward, OutwardGauge } from "./api"

export type TransactionDirection = "sent" | "received"
export interface TransactionCounts {
  gauge_count: number; returned_count: number; awaiting_return_count: number;
  completed_count: number; in_progress_count: number; cancelled_count: number;
}
export interface CustomerTransaction extends TransactionCounts {
  id: string; direction: TransactionDirection; number: number | string; date: string | null;
  laboratory_id: string | null; laboratory_name: string; client_org_name: string;
  client_dc_no: string; client_dc_date: string | null; received_date?: string | null; commit_date?: string | null;
  through: string; transport_by: string;
}
export type CustomerTransactionGauge = InwardGauge & OutwardGauge & { returned: boolean; unit: string; through: string }
export type SentChallanDetails = Pick<Inward, "id" | "inward_no" | "inward_date" | "client_dc_no" | "client_dc_date">
export type ReceivedChallanDetails = Pick<Outward, "id" | "outward_no" | "outward_date" | "transport_by" | "client_org" | "address">
export interface CustomerTransactionList {
  data: CustomerTransaction[]; total: number; page: number; limit: number;
  summary: TransactionCounts & { transaction_count: number };
}
export type CustomerTransactionDetail = { entry: CustomerTransaction; gauges: CustomerTransactionGauge[] } & (
  { direction: "sent"; inward_details: SentChallanDetails } | { direction: "received"; outward_details: ReceivedChallanDetails }
)
export interface TransactionFilters { search?: string; date_from?: string; date_to?: string; through_group?: string; page: number; limit: number }
