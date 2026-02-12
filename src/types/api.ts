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
  certificate_type: string
  client_organization: string
  status?: 'inward_pending' | 'calibration_completed' | 'calibration_due' | 'calibration_expired' | string
  certificate_issue_date?: string
  next_calibration_date?: string
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
}
