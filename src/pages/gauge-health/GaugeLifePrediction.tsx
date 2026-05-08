import { useMemo, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { motion } from "framer-motion"
import { useFieldArray, useForm, type FieldErrors, type Resolver } from "react-hook-form"
import { AlertCircle, Cpu, Radar } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { calculateGaugeLifePrediction } from "@/lib/gauge-health/calculations"
import { gaugeLifePredictionDemoDefaults } from "@/lib/gauge-health/defaults"
import { gaugeLifePredictionSchema } from "@/lib/gauge-health/schema"
import type { GaugeLifePredictionFormValues } from "@/types/gauge-health"
import { EngineeringRecommendationPanel } from "@/components/gauge-health/EngineeringRecommendationPanel"
import { FuturePredictionChart } from "@/components/gauge-health/FuturePredictionChart"
import { GaugeHealthKpiGrid } from "@/components/gauge-health/GaugeHealthKpiGrid"
import { GaugePredictionInputPanel } from "@/components/gauge-health/GaugePredictionInputPanel"
import { HealthDonutChart } from "@/components/gauge-health/HealthDonutChart"
import { IndustrialHeroCard } from "@/components/gauge-health/IndustrialHeroCard"
import { WearTrendChart } from "@/components/gauge-health/WearTrendChart"

function getFirstErrorMessage(errors: FieldErrors<GaugeLifePredictionFormValues>): string | null {
  const walk = (value: unknown): string | null => {
    if (!value) return null

    if (Array.isArray(value)) {
      for (const item of value) {
        const nested = walk(item)
        if (nested) return nested
      }
      return null
    }

    if (typeof value === "object") {
      const maybeFieldError = value as { message?: unknown }
      if (typeof maybeFieldError.message === "string" && maybeFieldError.message.length > 0) {
        return maybeFieldError.message
      }

      for (const nestedValue of Object.values(value)) {
        const nested = walk(nestedValue)
        if (nested) return nested
      }
    }

    return null
  }

  return walk(errors)
}

export function GaugeLifePredictionPage() {
  const [simulatedValues, setSimulatedValues] = useState<GaugeLifePredictionFormValues>(
    gaugeLifePredictionDemoDefaults
  )
  const [lastRunAt, setLastRunAt] = useState<Date>(new Date())
  const [submitFeedback, setSubmitFeedback] = useState<string | null>(null)

  const form = useForm<GaugeLifePredictionFormValues>({
    resolver: zodResolver(gaugeLifePredictionSchema) as Resolver<GaugeLifePredictionFormValues>,
    defaultValues: gaugeLifePredictionDemoDefaults,
    mode: "onChange",
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "history",
  })

  const metrics = useMemo(() => calculateGaugeLifePrediction(simulatedValues), [simulatedValues])
  const lastRunLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(lastRunAt),
    [lastRunAt]
  )

  const draftHasErrors = !form.formState.isValid

  const handleRunPrediction = (values: GaugeLifePredictionFormValues) => {
    setSimulatedValues(values)
    setLastRunAt(new Date())
    setSubmitFeedback(null)
  }

  const handlePredictionSubmitInvalid = () => {
    setSubmitFeedback(
      getFirstErrorMessage(form.formState.errors) ??
        "Please fix the highlighted input errors and run prediction again."
    )
  }

  const handleLoadDemo = () => {
    form.reset(gaugeLifePredictionDemoDefaults)
    setSimulatedValues(gaugeLifePredictionDemoDefaults)
    setLastRunAt(new Date())
    setSubmitFeedback(null)
  }

  const handleResetDraft = () => {
    form.reset(simulatedValues)
    setSubmitFeedback(null)
  }

  return (
    <div className="relative space-y-6">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute right-0 top-40 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"
      >
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="primary">Predictive Calibration Demo</Badge>
            <Badge variant="outline">Manual inputs</Badge>
            <Badge variant="outline">Frontend-only</Badge>
          </div>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Gauge Life Prediction &amp; Wear Analytics
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground sm:text-base">
              Predict gauge usable life using historical calibration observations.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-3 shadow-sm backdrop-blur">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Radar className="h-4 w-4 text-primary" />
              Metrology signal
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Linear wear projection designed for realistic calibration analytics demos.
            </p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-3 shadow-sm backdrop-blur">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Cpu className="h-4 w-4 text-primary" />
              Future API-ready
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Calculation engine, charts, and inputs are isolated for future backend integration.
            </p>
          </div>
        </div>
      </motion.div>

      {draftHasErrors && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Draft inputs need attention</AlertTitle>
          <AlertDescription>
            Fix validation errors in the manual input panel, then run the prediction again. The analytics below are still showing the last valid simulation snapshot.
          </AlertDescription>
        </Alert>
      )}

      {submitFeedback && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Prediction could not run</AlertTitle>
          <AlertDescription>{submitFeedback}</AlertDescription>
        </Alert>
      )}

      <IndustrialHeroCard
        metrics={metrics}
        simulatedValues={simulatedValues}
        lastRunLabel={lastRunLabel}
      />

      <GaugePredictionInputPanel
        form={form}
        fields={fields}
        appendHistory={append}
        removeHistory={remove}
        onLoadDemo={handleLoadDemo}
        onResetDraft={handleResetDraft}
        onSubmit={handleRunPrediction}
        onSubmitInvalid={handlePredictionSubmitInvalid}
      />

      <GaugeHealthKpiGrid metrics={metrics} />

      <div className="grid gap-6 2xl:grid-cols-[1.45fr_1fr]">
        <WearTrendChart metrics={metrics} />
        <HealthDonutChart metrics={metrics} />
      </div>

      <FuturePredictionChart metrics={metrics} />
      <EngineeringRecommendationPanel metrics={metrics} />
    </div>
  )
}
