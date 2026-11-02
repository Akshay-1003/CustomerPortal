export const ACCEPTANCE_DECISIONS = {
  accept: "Accept", conditional_accept: "Conditional Accept", not_ok: "Not Ok", missing: "Missing",
  damaged: "Damaged / Broken", repair: "Repair", rework: "Rework", not_in_use: "Not in Use",
} as const
export type AcceptanceDecision = keyof typeof ACCEPTANCE_DECISIONS
export type AcceptanceStatus = "pending" | "accepted" | "rejected"
export const ACCEPTANCE_FIELDS = {
  maintenance_details: "Maintenance / other details", history_card_number: "History-card number",
  acceptance_criteria: "Acceptance criteria", gauge_location: "Gauge location", part_name: "Part name",
} as const
export type AcceptanceField = keyof typeof ACCEPTANCE_FIELDS
export type AcceptanceFields = Record<AcceptanceField, string>
export interface CustomerAcceptance extends AcceptanceFields {
  decision: AcceptanceDecision; remark_note: string; status: AcceptanceStatus; version: number;
  certificate_id: string; certificate_revision: number; gauge_id: string; updated_at: string; reviewed_by: string;
  history: Array<AcceptanceFields & { decision: AcceptanceDecision; remark_note: string; version: number;
    updated_at: string; reviewed_by: string; correction_reason: string; batch_id?: string | null }>
}
export interface AcceptanceSource {
  outward_gauge_id: string; certificate_id: string; certificate_revision: number; version: number;
}
export interface AcceptanceRow extends AcceptanceSource {
  gauge_id: string; gauge_inward_id: string; organization_id: string; laboratory_id: string; laboratory_name: string;
  inward_no: string | number; outward_no: string | number; inward_gauge_lab_id: string;
  through: string; gauge_name: string; identification_number: string; manf_serial_number: string; process: string;
  status: AcceptanceStatus; decision: AcceptanceDecision | null; review: CustomerAcceptance | null;
  prefill: AcceptanceFields; requires_review: boolean;
}
export interface AcceptanceList { data: AcceptanceRow[]; total: number; page: number; limit: number; counts: Record<AcceptanceStatus, number> }
export interface ReviewValues { decision: AcceptanceDecision; remark_note: string; fields: Partial<AcceptanceFields>;
  correction_reason: string; idempotency_key: string }
export interface ReviewResult { outward_gauge_id: string; outcome: "saved" | "replayed" | "failed";
  gauge_label?: string;
  review?: CustomerAcceptance; reason?: string; code?: number }
export interface BulkReviewResult { results: ReviewResult[]; saved: number; replayed: number; failed: number }
export const EMPTY_ACCEPTANCE_FIELDS: AcceptanceFields = { maintenance_details: "", history_card_number: "", acceptance_criteria: "", gauge_location: "", part_name: "" }
