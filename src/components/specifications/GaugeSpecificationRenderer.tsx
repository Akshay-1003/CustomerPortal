import { memo, useEffect, useMemo } from "react"
import { Controller, useFormContext } from "react-hook-form"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type GaugeSpecificationRendererProps = {
  gaugeType: string | null | undefined
}

const fixedRangeTypes = new Set([
  "fixed range gauge",
  "external micrometer",
  "internal micrometer",
  "depth caliper",
  "caliper",
  "fixed range gauge (degree, min)",
  "pressure gauge",
  "height gauge",
  "electronic height gauge",
  "digital dial gauge",
  "depth caliper.",
  "plunger dial",
])

const numericInputClassName = "mt-2"

function normalizeGaugeType(value: string | null | undefined): string {
  return (value || "").toLowerCase().trim()
}

function Section({
  title = "Specification / Size",
  children,
}: {
  title?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-4 rounded-lg border border-border/60 bg-muted/20 p-4">
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground">{title}</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Keep the specification details aligned with the gauge&apos;s latest external certificate.
        </p>
      </div>
      {children}
    </div>
  )
}

function FormField({
  label,
  required = false,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required ? " *" : ""}
      </Label>
      {children}
    </div>
  )
}

function BasicSizeInput({
  name,
  label,
}: {
  name: string
  label: string
}) {
  const { register } = useFormContext()

  return (
    <Section>
      <FormField label={label} required>
        <Input
          {...register(name)}
          className={numericInputClassName}
          inputMode="decimal"
          placeholder="Enter size"
        />
      </FormField>
    </Section>
  )
}

function FixedRangeFields({ includeLeastCount = true }: { includeLeastCount?: boolean }) {
  const { register } = useFormContext()

  return (
    <Section>
      <div className={`grid grid-cols-1 gap-4 ${includeLeastCount ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
        <FormField label="Range From" required>
          <Input
            {...register("specifications.range.min")}
            className={numericInputClassName}
            inputMode="decimal"
            placeholder="0"
          />
        </FormField>
        <FormField label="Range To" required>
          <Input
            {...register("specifications.range.max")}
            className={numericInputClassName}
            inputMode="decimal"
            placeholder="0"
          />
        </FormField>
        {includeLeastCount ? (
          <FormField label="Least Count">
            <Input
              {...register("specifications.least_count")}
              className={numericInputClassName}
              inputMode="decimal"
              placeholder="0.01"
            />
          </FormField>
        ) : null}
      </div>
    </Section>
  )
}

function VBlockFields() {
  const { register } = useFormContext()

  return (
    <Section>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <FormField label="Length" required>
          <Input {...register("specifications.length")} className={numericInputClassName} inputMode="decimal" placeholder="0" />
        </FormField>
        <FormField label="Width" required>
          <Input {...register("specifications.width")} className={numericInputClassName} inputMode="decimal" placeholder="0" />
        </FormField>
        <FormField label="Height" required>
          <Input {...register("specifications.height")} className={numericInputClassName} inputMode="decimal" placeholder="0" />
        </FormField>
      </div>
    </Section>
  )
}

function BenchCenterFields() {
  const { register } = useFormContext()

  return (
    <Section>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormField label="Range" required>
          <Input {...register("specifications.range")} className={numericInputClassName} inputMode="decimal" placeholder="0" />
        </FormField>
        <FormField label="Base Width" required>
          <Input {...register("specifications.base_width")} className={numericInputClassName} inputMode="decimal" placeholder="0" />
        </FormField>
      </div>
    </Section>
  )
}

function MasterPieceFields() {
  const { control, setValue, watch } = useFormContext()
  const values = watch("specifications.basic_size")
  const rows = Array.isArray(values) && values.length > 0 ? values : [""]

  useEffect(() => {
    if (!Array.isArray(values) || values.length === 0) {
      setValue("specifications.basic_size", [""], { shouldDirty: false, shouldTouch: false })
    }
  }, [setValue, values])

  const handleAdd = () => {
    setValue("specifications.basic_size", [...rows, ""], { shouldDirty: true, shouldTouch: true })
  }

  const handleRemove = (index: number) => {
    const nextRows = rows.filter((_: unknown, rowIndex: number) => rowIndex !== index)
    setValue("specifications.basic_size", nextRows.length > 0 ? nextRows : [""], {
      shouldDirty: true,
      shouldTouch: true,
    })
  }

  return (
    <Section>
      <div className="space-y-3">
        {rows.map((_: unknown, index: number) => (
          <div key={`basic-size-${index}`} className="flex items-end gap-2">
            <div className="flex-1">
              <FormField label={`Basic Size ${index + 1}`} required>
                <Controller
                  name={`specifications.basic_size.${index}`}
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      className={numericInputClassName}
                      inputMode="decimal"
                      placeholder="Enter size"
                      value={field.value ?? ""}
                    />
                  )}
                />
              </FormField>
            </div>
            {rows.length > 1 ? (
              <Button type="button" variant="outline" size="icon" onClick={() => handleRemove(index)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
        ))}
        <Button type="button" variant="outline" onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add More Size
        </Button>
      </div>
    </Section>
  )
}

function SurfacePlateFields() {
  const { register, setValue, watch } = useFormContext()
  const material = watch("specifications.surface_material")
  const method = watch("specifications.method")

  return (
    <Section>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormField label="Surface Material" required>
          <Select value={material || ""} onValueChange={(value) => setValue("specifications.surface_material", value, { shouldDirty: true })}>
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="Select material" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="granite">Granite</SelectItem>
              <SelectItem value="cast_iron">Cast Iron</SelectItem>
              <SelectItem value="steel">Steel</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="Method" required>
          <Select value={method || ""} onValueChange={(value) => setValue("specifications.method", value, { shouldDirty: true })}>
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="Select method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="division">Division</SelectItem>
              <SelectItem value="micron_per_block">Micron / Block Size</SelectItem>
              <SelectItem value="micron_per_meter">Micron / Meter</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="Length" required>
          <Input {...register("specifications.length")} className={numericInputClassName} inputMode="decimal" placeholder="0" />
        </FormField>
        <FormField label="Width" required>
          <Input {...register("specifications.width")} className={numericInputClassName} inputMode="decimal" placeholder="0" />
        </FormField>
        <FormField label="Block Size">
          <Input {...register("specifications.block_size")} className={numericInputClassName} inputMode="decimal" placeholder="0" />
        </FormField>
        <FormField label="LC">
          <Input {...register("specifications.lc")} className={numericInputClassName} inputMode="decimal" placeholder="0" />
        </FormField>
      </div>
    </Section>
  )
}

function SplineTypeGaugeFields() {
  const { register } = useFormContext()

  return (
    <Section>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormField label="Specification" required>
          <Input {...register("specifications.specification")} className={numericInputClassName} placeholder="Enter specification" />
        </FormField>
        <FormField label="Number Of Splines">
          <Input {...register("specifications.numberOfSplines")} className={numericInputClassName} inputMode="numeric" placeholder="0" />
        </FormField>
        <FormField label="Major Diameter Min">
          <Input {...register("specifications.majorDiameterMin")} className={numericInputClassName} inputMode="decimal" placeholder="0" />
        </FormField>
        <FormField label="Major Diameter Max">
          <Input {...register("specifications.majorDiameterMax")} className={numericInputClassName} inputMode="decimal" placeholder="0" />
        </FormField>
      </div>
    </Section>
  )
}

function LimitGaugeFields() {
  const { register } = useFormContext()

  return (
    <Section title="Specification / Size">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-md border border-border/60 p-4">
          <h4 className="text-sm font-semibold text-foreground">Go</h4>
          <FormField label="Basic Size" required>
            <Input {...register("specifications.go.basic_size")} className={numericInputClassName} inputMode="decimal" placeholder="0" />
          </FormField>
          <FormField label="Specification Limit Max">
            <Input {...register("specifications.go.specification_limit_max")} className={numericInputClassName} inputMode="decimal" placeholder="0" />
          </FormField>
          <FormField label="Specification Limit Min">
            <Input {...register("specifications.go.specification_limit_min")} className={numericInputClassName} inputMode="decimal" placeholder="0" />
          </FormField>
          <FormField label="Wear Limit">
            <Input {...register("specifications.go.wear_limit")} className={numericInputClassName} inputMode="decimal" placeholder="0" />
          </FormField>
        </div>
        <div className="space-y-4 rounded-md border border-border/60 p-4">
          <h4 className="text-sm font-semibold text-foreground">No Go</h4>
          <FormField label="Basic Size" required>
            <Input {...register("specifications.no_go.basic_size")} className={numericInputClassName} inputMode="decimal" placeholder="0" />
          </FormField>
          <FormField label="Specification Limit Max">
            <Input {...register("specifications.no_go.specification_limit_max")} className={numericInputClassName} inputMode="decimal" placeholder="0" />
          </FormField>
          <FormField label="Specification Limit Min">
            <Input {...register("specifications.no_go.specification_limit_min")} className={numericInputClassName} inputMode="decimal" placeholder="0" />
          </FormField>
        </div>
      </div>
    </Section>
  )
}

function PlainThreadFields() {
  const { register } = useFormContext()

  return (
    <Section>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormField label="Standard Specification" required>
          <Input {...register("specifications.standard_specification")} className={numericInputClassName} placeholder="Example: M20 x 2.5" />
        </FormField>
        <FormField label="Pitch / Dial">
          <Input {...register("specifications.pitch_dial.specified_limit_max")} className={numericInputClassName} placeholder="Enter pitch / dial" />
        </FormField>
      </div>
    </Section>
  )
}

function TaperThreadFields() {
  const { register } = useFormContext()

  return (
    <Section>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormField label="Taper Angle / Standard" required>
          <Input {...register("specifications.taper_angle")} className={numericInputClassName} placeholder="Example: 1/2 14 NPTF" />
        </FormField>
        <FormField label="Basic Size">
          <Input {...register("specifications.basic_size")} className={numericInputClassName} inputMode="decimal" placeholder="0" />
        </FormField>
      </div>
    </Section>
  )
}

function PlainTaperRingFields() {
  const { register } = useFormContext()

  return (
    <Section>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <FormField label="Taper Angle" required>
          <Input {...register("specifications.taper_angle")} className={numericInputClassName} placeholder="Enter taper angle" />
        </FormField>
        <FormField label="Small Diameter">
          <Input {...register("specifications.small_diameter")} className={numericInputClassName} inputMode="decimal" placeholder="0" />
        </FormField>
        <FormField label="Large Diameter">
          <Input {...register("specifications.large_diameter")} className={numericInputClassName} inputMode="decimal" placeholder="0" />
        </FormField>
      </div>
    </Section>
  )
}

function GenericSpecificationFields() {
  const { register } = useFormContext()

  return (
    <Section>
      <FormField label="Specification / Size" required>
        <Input
          {...register("specifications.specification")}
          className={numericInputClassName}
          placeholder="Enter the gauge specification or size"
        />
      </FormField>
    </Section>
  )
}

export const GaugeSpecificationRenderer = memo(function GaugeSpecificationRenderer({
  gaugeType,
}: GaugeSpecificationRendererProps) {
  const normalizedGaugeType = useMemo(() => normalizeGaugeType(gaugeType), [gaugeType])

  if (!normalizedGaugeType || normalizedGaugeType === "no type") {
    return <GenericSpecificationFields />
  }

  if (normalizedGaugeType === "od limit gauge" || normalizedGaugeType === "id limit gauge") {
    return <LimitGaugeFields />
  }

  if (normalizedGaugeType === "master piece" || normalizedGaugeType === "slip / feeler gauge") {
    return <MasterPieceFields />
  }

  if (
    normalizedGaugeType === "plunger dial" ||
    normalizedGaugeType === "plunger dial std" ||
    normalizedGaugeType === "lever dial"
  ) {
    return <FixedRangeFields />
  }

  if (normalizedGaugeType === "dial snap gauge") {
    return <FixedRangeFields includeLeastCount={false} />
  }

  if (normalizedGaugeType === "surface roughness master/tester") {
    return <FixedRangeFields />
  }

  if (normalizedGaugeType === "coating thickness gauge") {
    return <FixedRangeFields />
  }

  if (fixedRangeTypes.has(normalizedGaugeType)) {
    return <FixedRangeFields />
  }

  if (
    normalizedGaugeType === "thread plug gauge" ||
    normalizedGaugeType === "thread ring gauge"
  ) {
    return <PlainThreadFields />
  }

  if (
    normalizedGaugeType === "taper thread ring gauge" ||
    normalizedGaugeType === "taper thread plug gauge"
  ) {
    return <TaperThreadFields />
  }

  if (normalizedGaugeType === "plain taper plug gauge") {
    return <TaperThreadFields />
  }

  if (normalizedGaugeType === "plain taper ring gauge") {
    return <PlainTaperRingFields />
  }

  if (normalizedGaugeType === "comparator stand") {
    return <BasicSizeInput name="specifications.basic_size" label="Basic Size" />
  }

  if (normalizedGaugeType === "v block") {
    return <VBlockFields />
  }

  if (normalizedGaugeType === "bench center") {
    return <BenchCenterFields />
  }

  if (normalizedGaugeType === "master ring" || normalizedGaugeType === "id master") {
    return <BasicSizeInput name="specifications.basic_size" label="Basic Size" />
  }

  if (normalizedGaugeType === "surface plate") {
    return <SurfacePlateFields />
  }

  if (normalizedGaugeType === "spline gauge" || normalizedGaugeType === "spline type gauge") {
    return <SplineTypeGaugeFields />
  }

  return <GenericSpecificationFields />
})

export default GaugeSpecificationRenderer
