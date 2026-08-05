import { useMemo, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Info, Plus } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { authService } from "@/services/auth.service"
import { mastersService, type GaugeCreatePayload } from "@/services/masters.service"
import type { CertificateType, GaugeMasterOption } from "@/types/api"

type GaugeMasterFormValues = {
  master_gauge_id: string
  certificate_type_id: string
  identification_number: string
  calibration_frequency: string
  calibration_frequency_unit: string
  make: string
  manf_serial_number: string
  last_calibration_date: string
  due_date: string
  calibration_by: string
  external_lab_name: string
  remarks: string
  specifications: Record<string, unknown>
}

const initialValues: GaugeMasterFormValues = {
  master_gauge_id: "",
  certificate_type_id: "",
  identification_number: "",
  calibration_frequency: "12",
  calibration_frequency_unit: "months",
  make: "",
  manf_serial_number: "",
  last_calibration_date: "",
  due_date: "",
  calibration_by: "",
  external_lab_name: "",
  remarks: "",
  specifications: {},
}

export function GaugeMasterPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const [isSaving, setIsSaving] = useState(false)
  const [certificateFile, setCertificateFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const form = useForm<GaugeMasterFormValues>({
    defaultValues: initialValues,
  })

  const selectedMasterGaugeId = form.watch("master_gauge_id")
  const selectedCertificateTypeId = form.watch("certificate_type_id")
  const calibrationBy = form.watch("calibration_by")
  const organizationId = searchParams.get("organizationId") || authService.getOrganizationId() || ""

  const { data: masterGaugeOptions = [], isLoading: mastersLoading } = useQuery({
    queryKey: ["gauge-master-options"],
    queryFn: () => mastersService.getGaugeMasterOptions(),
  })

  const { data: certificateTypes = [], isLoading: certificateLoading } = useQuery({
    queryKey: ["certificate-types"],
    queryFn: () => mastersService.getCertificateTypes(),
  })

  const selectedGaugeTypeName = useMemo(() => {
    if (!selectedCertificateTypeId) return ""

    const fromCertificateType = certificateTypes.find(
      (item: CertificateType) => item.id === selectedCertificateTypeId
    )
    if (fromCertificateType?.name) {
      return fromCertificateType.name
    }

    const fromGaugeMaster = masterGaugeOptions.find(
      (item: GaugeMasterOption) => item.id === selectedMasterGaugeId
    )
    return fromGaugeMaster?.gauge_type || ""
  }, [certificateTypes, masterGaugeOptions, selectedCertificateTypeId, selectedMasterGaugeId])

  const onGaugeMasterChange = (masterGaugeId: string) => {
    form.setValue("master_gauge_id", masterGaugeId, { shouldValidate: true })
    const selected = masterGaugeOptions.find((item: GaugeMasterOption) => item.id === masterGaugeId)
    if (selected?.certificate_type_id) {
      form.setValue("certificate_type_id", selected.certificate_type_id, { shouldValidate: true })
    }
  }

  const resetForm = () => {
    form.reset(initialValues)
    setCertificateFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const onSubmit = form.handleSubmit(async (values) => {
    if (!values.master_gauge_id || !values.certificate_type_id || !values.identification_number.trim()) {
      toast.error("Gauge Name, Gauge Type and Identification Number are required")
      return
    }

    if (!values.calibration_by.trim()) {
      toast.error("Calibration By is required")
      return
    }

    if (values.calibration_by === "external" && !values.external_lab_name.trim()) {
      toast.error("External Lab Name is required when Calibration By is External")
      return
    }

    if (!values.last_calibration_date || !values.due_date) {
      toast.error("Last Calibration Date and Due Date are required")
      return
    }

    if (!values.calibration_frequency || Number(values.calibration_frequency) < 1) {
      toast.error("Calibration frequency must be a valid number")
      return
    }

    if (!certificateFile) {
      toast.error("Upload Calibration Certificate is required")
      return
    }

    setIsSaving(true)

    try {
      const certificateUrl = await mastersService.uploadGaugeCertificate(certificateFile)

      const payload: GaugeCreatePayload = {
        master_gauge_id: values.master_gauge_id,
        certificate_type_id: values.certificate_type_id,
        gauge_class: "no_type",
        identification_number: values.identification_number.trim(),
        calibration_frequency: Number(values.calibration_frequency || 0),
        calibration_frequency_unit: values.calibration_frequency_unit,
        make: values.make.trim(),
        manf_serial_number: values.manf_serial_number.trim(),
        unit: "mm",
        calibration_location_type: "customer_site",
        calibration_location: "",
        calibration_done_under: "non_nabl",
        gauge_condition: values.remarks.trim(),
        certificate_issue_date: values.last_calibration_date || null,
        next_calibration_date: values.due_date || null,
        certificate_url: certificateUrl,
        specifications: {
          // Specification / Size import is intentionally disabled for now.
          // ...values.specifications,
          source: "external_import",
          import_mode: "existing_gauge",
          date_of_certificate: values.last_calibration_date || null,
          next_calibration_date: values.due_date || null,
          calibration_by: values.calibration_by === "external"
            ? values.external_lab_name.trim() || "External"
            : "Internal",
          calibration_by_type: values.calibration_by,
          external_lab_name: values.external_lab_name.trim(),
          remarks: values.remarks.trim(),
          certificate_url: certificateUrl,
          certificate_file_name: certificateFile.name,
          gauge_type_name: selectedGaugeTypeName,
        },
      }

      await mastersService.createGauge(payload)
      await queryClient.invalidateQueries({ queryKey: ["gauges"] })
      toast.success("Existing gauge added successfully")
      resetForm()
      navigate("/gauge-list")
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || "Failed to save gauge")
    } finally {
      setIsSaving(false)
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold">Add Existing Gauge</h2>
          <p className="text-sm text-muted-foreground">
            Register gauges that were already calibrated externally and attach the latest certificate.
          </p>
          {organizationId ? (
            <p className="text-xs text-muted-foreground">Organization ID: {organizationId}</p>
          ) : null}
        </div>
      </div>

      <Alert className="border-amber-200 bg-amber-50 text-amber-950">
        <Info className="h-4 w-4" />
        <AlertTitle>External Gauge Import Only</AlertTitle>
        <AlertDescription>
          Use this page only for migration or gauges calibrated by another laboratory. New gauges that
          will be calibrated by us should be created from the calibration workflow instead.
        </AlertDescription>
      </Alert>

      <Card>
        <CardContent className="mt-4">
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Gauge Name *</Label>
                <Select value={selectedMasterGaugeId || undefined} onValueChange={onGaugeMasterChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={mastersLoading ? "Loading..." : "Select gauge name"} />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {masterGaugeOptions.map((option: GaugeMasterOption) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Gauge Type *</Label>
                <Select value={selectedCertificateTypeId || undefined} disabled>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={certificateLoading ? "Loading..." : "Auto-selected from gauge name"} />
                  </SelectTrigger>
                  <SelectContent>
                    {certificateTypes.map((option: CertificateType) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Identification Number *</Label>
                <Input
                  {...form.register("identification_number")}
                  placeholder="Enter identification number"
                />
              </div>

              <div className="space-y-2">
                <Label>Make</Label>
                <Input {...form.register("make")} placeholder="Enter make" />
              </div>

              <div className="space-y-2">
                <Label>Serial Number</Label>
                <Input {...form.register("manf_serial_number")} placeholder="Enter serial number" />
              </div>

              <div className="space-y-2">
                <Label>Calibration Frequency *</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    {...form.register("calibration_frequency")}
                    inputMode="numeric"
                    placeholder="12"
                  />
                  <Select
                    value={form.watch("calibration_frequency_unit")}
                    onValueChange={(value) => form.setValue("calibration_frequency_unit", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="months">months</SelectItem>
                      <SelectItem value="years">years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/*
              <div className="space-y-2 md:col-span-3">
                <GaugeSpecificationRenderer gaugeType={selectedGaugeTypeName} />
              </div>
              */}

              <div className="space-y-2">
                <Label>Last Calibration Date *</Label>
                <Input type="date" {...form.register("last_calibration_date")} />
              </div>

              <div className="space-y-2">
                <Label>Due Date *</Label>
                <Input type="date" {...form.register("due_date")} />
              </div>

              <div className="space-y-2">
                <Label>Calibration By *</Label>
                <Select
                  value={calibrationBy || undefined}
                  onValueChange={(value) => form.setValue("calibration_by", value, { shouldValidate: true })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select calibration source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internal">Internal</SelectItem>
                    <SelectItem value="external">External</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {calibrationBy === "external" ? (
                <div className="space-y-2">
                  <Label>External Lab Name</Label>
                  <Input
                    {...form.register("external_lab_name")}
                    placeholder="Enter external lab name"
                  />
                </div>
              ) : (
                <div />
              )}

              <div className="space-y-2 md:col-span-3">
                <Label>Remarks</Label>
                <textarea
                  {...form.register("remarks")}
                  className="min-h-[96px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="Add optional remarks"
                />
              </div>

              <div className="space-y-2 md:col-span-3">
                <Label>Upload Calibration Certificate (PDF/Image) *</Label>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,image/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0] || null
                    setCertificateFile(file)
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Accepted formats: PDF, JPG, JPEG, PNG, WEBP.
                </p>
                {certificateFile ? (
                  <p className="text-xs font-medium text-foreground">Selected file: {certificateFile.name}</p>
                ) : null}
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={isSaving}>
                <Plus className="mr-2 h-4 w-4" />
                {isSaving ? "Saving..." : "Add Existing Gauge"}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                Reset
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default GaugeMasterPage
