export interface Organization {
  id: string
  name: string
  code?: string
  created_at?: string
  updated_at?: string
}



export interface GaugeHistory {
  id: string
  gauge_id: string
  action: 'Calibration' | 'Repair' | 'Maintenance' | 'Inspection'
  performed_by: string
  date: string
  result: 'Pass' | 'Fail' | 'Pending'
  notes: string
  certificate?: string
  certificate_url?: string
  // Additional properties from actual API response
  certificate_issue_date?: string
  next_calibration_date?: string
  inward_gauge_lab_id?: string
  status?: string
  gauge_condition?: string
}

export interface LoginRequest {
  email: string
  password: string
  organization_id: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
  user: {
    id: string
    email: string
    name: string
    organization_id: string
  }
}

export interface ApiError {
  message: string
  status?: number
  errors?: Record<string, string[]>
}

export interface Gauge {
  archived: boolean
  updated_at: string
  created_at: string
  deleted_at: string | null

  client_org_id: string
  master_gauge_id: string
  scope_master_id: string
  certificate_type_id: string

  gauge_class: string
  identification_number: string
  calibration_frequency: number
  calibration_frequency_unit: string

  make: string
  manf_serial_number: string
  unit: string

  calibration_location_type: string
  calibration_location: string
  calibration_done_under: string
  gauge_condition: string

  // dynamic object
  specifications: Record<string, any>

  id: string
  master_gauge: string
  master_gauge_name: string
  certificate_type: string
  client_organization: string
  client_org_name: string
  status?: 'inward_pending' | 'calibration_completed' | 'calibration_due' | 'calibration_expired' | string
  certificate_issue_date?: string
  next_calibration_date?: string
  reference_standard?: string
  part_name?: string
}

export type DynamicGaugeSpecifications = Record<string, unknown>

export interface HistoryCardGauge extends Gauge {
  specifications: DynamicGaugeSpecifications
}

export interface GaugeMasterOption {
  id: string
  name: string
  certificate_type_id?: string
  gauge_type?: string
  has_sub_part?: boolean
}

export interface CertificateType {
  id: string
  name: string
}

export interface Inward {
  calibration_method: string
  reporting_method: string
  collection_mode: string
  dispatch_mode: string
  compliance_required: boolean
  compliance_accepted: boolean
  specific_requirements: string
  rate_card: string | null
  archived: boolean
  updated_at: string
  created_at: string
  deleted_at: string | null
  client_org_id: string
  billing_org_id: string
  delivery_org_id: string
  other_access_org_id: string
  client_dc_no: string
  client_dc_date: string
  through: string
  inward_date: string
  received_date: string
  commit_date: string
  additional_requirements: string
  lab_authorized_person_id: string
  lab_authorized_person_designation: string
  client_authorized_person_id: string
  id: string
  inward_no: number
  client_org_name: string
  billing_org_name: string
  delivery_org_name: string
  other_access_org_name: string
  status?: string
}

export interface InwardGauge {
  inward_id: string
  gauge_id: string
  inward_gauge_lab_id: string
  status: string
  master_gauge_name: string
  gauge_class: string
  make: string
  identification_number: string
  manf_serial_number: string
  inward_date: string
  client_org_name: string
  specifications: Record<string, unknown>
  id: string
  certificate_id: string
  calibration_frequency?: number
  calibration_frequency_unit?: string
}

export interface OutwardAddress {
  address_line_1?: string
  address_line_2?: string
  city?: string
  state?: string
  zip_code?: string
  country?: string
}

export interface Outward {
  updated_at: string
  created_at: string
  deleted_at: string | null
  archived: boolean
  client_org_id: string
  outward_date: string
  transport_by: string
  id: string
  outward_no: number
  client_org: string
  address: OutwardAddress | null
}

export interface OutwardGauge {
  inward_id: string
  client_dc_no: string
  client_dc_date: string
  inward_no: number
  outward_id: string
  outward_no: number
  gauge_inward_id: string
  gauge_id: string
  inward_gauge_lab_id: string
  specifications: Record<string, unknown>
  master_gauge_name: string
  identification_number: string
  manf_serial_number: string
  inward_date: string
  process: string
  status: string
  id?: string
}

export interface OutwardGaugesResponse {
  outward_details: Outward
  outward_gauges: OutwardGauge[]
}

export interface User {
  id: string
  username: string
  email: string
  first_name: string
  last_name: string
  organization_id: string
  lab_id: string
  role: "org_admin" | "org_user" | "org_viewer"
  password: string
  phone: string
  department: string
}
