import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import type { CertificateType, GaugeMasterOption } from "@/types/api"
import { mastersService, type GaugeCreatePayload } from "@/services/masters.service"

type GaugeMasterFormValues = {
  master_gauge_id: string
  certificate_type_id: string
  gauge_class: string
  identification_number: string
  calibration_frequency: string
  calibration_frequency_unit: string
  make: string
  manf_serial_number: string
  unit: string
  calibration_location_type: string
  calibration_done_under: string
  gauge_condition: string
  last_calibration_certificate_no: string
  date_of_certificate: string
  calibration_by: string
  observations: string
  maintenance_other_details: string
  keep_record_history_card: boolean
}

const initialValues: GaugeMasterFormValues = {
  master_gauge_id: "",
  certificate_type_id: "",
  gauge_class: "no_type",
  identification_number: "",
  calibration_frequency: "12",
  calibration_frequency_unit: "months",
  make: "",
  manf_serial_number: "",
  unit: "mm",
  calibration_location_type: "permanent_facility",
  calibration_done_under: "nabl",
  gauge_condition: "",
  last_calibration_certificate_no: "",
  date_of_certificate: "",
  calibration_by: "",
  observations: "",
  maintenance_other_details: "",
  keep_record_history_card: true,
}

export function GaugeMasterPage() {
  const navigate = useNavigate()
  const [isSaving, setIsSaving] = useState(false)

  const form = useForm<GaugeMasterFormValues>({ defaultValues: initialValues })
  const selectedMasterGaugeId = form.watch("master_gauge_id")
  const selectedCertificateTypeId = form.watch("certificate_type_id")

  const { data: masterGaugeOptions = [], isLoading: mastersLoading } = useQuery({
    queryKey: ["gauge-master-options"],
    queryFn: () => mastersService.getGaugeMasterOptions(),
  })

  const { data: certificateTypes = [], isLoading: certificateLoading } = useQuery({
    queryKey: ["certificate-types"],
    queryFn: () => mastersService.getCertificateTypes(),
  })


  const onGaugeMasterChange = (masterGaugeId: string) => {
    form.setValue("master_gauge_id", masterGaugeId, { shouldValidate: true })
    const selected = masterGaugeOptions.find((item) => item.id === masterGaugeId)
    if (selected?.certificate_type_id) {
      form.setValue("certificate_type_id", selected.certificate_type_id, { shouldValidate: true })
    }
  }

  const resetForm = () => {
    form.reset(initialValues)
  }

  const onSubmit = form.handleSubmit(async (values) => {
    const payload: GaugeCreatePayload = {
      master_gauge_id: values.master_gauge_id,
      certificate_type_id: values.certificate_type_id,
      gauge_class: values.gauge_class,
      identification_number: values.identification_number.trim(),
      calibration_frequency: Number(values.calibration_frequency || 0),
      calibration_frequency_unit: values.calibration_frequency_unit,
      make: values.make.trim(),
      manf_serial_number: values.manf_serial_number.trim(),
      unit: values.unit,
      calibration_location_type: values.calibration_location_type,
      calibration_location: "",
      calibration_done_under: values.calibration_done_under,
      gauge_condition: values.gauge_condition.trim(),
      specifications: {
        last_calibration_certificate_no: values.last_calibration_certificate_no.trim(),
        date_of_certificate: values.date_of_certificate || null,
        calibration_by: values.calibration_by.trim(),
        observations: values.observations.trim(),
        maintenance_other_details: values.maintenance_other_details.trim(),
        keep_record_history_card: values.keep_record_history_card ? "yes" : "no",
      },
    }

    if (!payload.master_gauge_id || !payload.certificate_type_id || !payload.identification_number) {
      toast.error("Gauge Name, Gauge Type and Identification Number are required")
      return
    }

    if (!payload.calibration_frequency || payload.calibration_frequency < 1) {
      toast.error("Calibration frequency must be a valid number")
      return
    }

    setIsSaving(true)
    try {
      await mastersService.createGauge(payload)
      toast.success("Gauge created")
      resetForm()
      navigate("/gauge-list")
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to save gauge")
    } finally {
      setIsSaving(false)
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-3xl font-bold">Create Gauge Master</h2>
        </div>
      </div>

      <Card>
        
        <CardContent className="mt-4">
          <form onSubmit={onSubmit} className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Gauge Name *</Label>
                <Select value={selectedMasterGaugeId || undefined} onValueChange={onGaugeMasterChange}>
                  <SelectTrigger>
                    <SelectValue placeholder={mastersLoading ? "Loading..." : "Select gauge name"} />
                  </SelectTrigger>
                  <SelectContent>
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
                <Select value={selectedCertificateTypeId || undefined} onValueChange={(v) => form.setValue("certificate_type_id", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder={certificateLoading ? "Loading..." : "Select gauge type"} />
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
                <Label>Class</Label>
                <Select value={form.watch("gauge_class")} onValueChange={(v) => form.setValue("gauge_class", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no_type">No Type</SelectItem>
                    <SelectItem value="digital">Digital</SelectItem>
                    <SelectItem value="vernier">Vernier</SelectItem>
                    <SelectItem value="dial">Dial</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Identification No. *</Label>
                <Input {...form.register("identification_number", { required: true })} placeholder="Enter identification number" />
              </div>

              <div className="space-y-2">
                <Label>Calibration Frequency *</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input {...form.register("calibration_frequency", { required: true })} placeholder="12" />
                  <Select value={form.watch("calibration_frequency_unit")} onValueChange={(v) => form.setValue("calibration_frequency_unit", v)}>
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

              <div className="space-y-2">
                <Label>Make</Label>
                <Input {...form.register("make")} placeholder="Enter make" />
              </div>

              <div className="space-y-2">
                <Label>Manf.SR.No</Label>
                <Input {...form.register("manf_serial_number")} placeholder="Enter serial number" />
              </div>

              <div className="space-y-2">
                <Label>Unit *</Label>
                <Select value={form.watch("unit")} onValueChange={(v) => form.setValue("unit", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mm">mm</SelectItem>
                    <SelectItem value="µm">µm</SelectItem>
                    <SelectItem value="inch">inch</SelectItem>
                    <SelectItem value="bar">bar</SelectItem>
                    <SelectItem value="Pa">Pa</SelectItem>
                    <SelectItem value="degree">degree</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Calibration Location</Label>
                <Select value={form.watch("calibration_location_type")} onValueChange={(v) => form.setValue("calibration_location_type", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select location type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="permanent_facility">Permanent Facility</SelectItem>
                    <SelectItem value="mobile_facility">Mobile Facility</SelectItem>
                    <SelectItem value="customer_site">Customer Site</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Calibration Done Under</Label>
                <Select value={form.watch("calibration_done_under")} onValueChange={(v) => form.setValue("calibration_done_under", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select standard" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nabl">NABL</SelectItem>
                    <SelectItem value="non_nabl">Non NABL</SelectItem>
                    
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Remarks</Label>
                <Input {...form.register("gauge_condition")} placeholder="Enter remarks" />
              </div>

              <div className="space-y-2">
                <Label>Last Calibration Certificate No.</Label>
                <Input
                  {...form.register("last_calibration_certificate_no")}
                  placeholder="Enter certificate number"
                />
              </div>

              <div className="space-y-2">
                <Label>Date of Certificate</Label>
                <Input
                  type="date"
                  {...form.register("date_of_certificate")}
                />
              </div>

              <div className="space-y-2">
                <Label>Calibration By</Label>
                <Input
                  {...form.register("calibration_by")}
                  placeholder="Enter calibration by"
                />
              </div>

              <div className="space-y-2 md:col-span-3">
                <Label>Observations</Label>
                <Input
                  {...form.register("observations")}
                  placeholder="Enter observations"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Maintenance & Other Details</Label>
                <Input
                  {...form.register("maintenance_other_details")}
                  placeholder="Enter maintenance details"
                />
              </div>

              <div className="space-y-2">
                <Label>Keep Record History Card</Label>
                <div className="flex items-center gap-4 rounded-md border px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={form.watch("keep_record_history_card") === true}
                      onCheckedChange={(checked) => form.setValue("keep_record_history_card", checked === true)}
                    />
                    <span className="text-sm">Yes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={form.watch("keep_record_history_card") === false}
                      onCheckedChange={(checked) => {
                        if (checked === true) form.setValue("keep_record_history_card", false)
                      }}
                    />
                    <span className="text-sm">No</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : "Create Gauge"}
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
