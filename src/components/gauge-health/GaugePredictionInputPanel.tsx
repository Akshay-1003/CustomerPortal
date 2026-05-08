import type { UseFieldArrayAppend, UseFieldArrayRemove, UseFormReturn } from "react-hook-form"
import { motion } from "framer-motion"
import { Calculator, FlaskConical, Plus, RotateCcw, Sparkles, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  GAUGE_TYPE_OPTIONS,
  gaugeLifePredictionDemoDefaults,
  getGaugeTypeWearDirectionPreset,
  WEAR_DIRECTION_OPTIONS,
} from "@/lib/gauge-health/defaults"
import type { GaugeHistoryObservation, GaugeLifePredictionFormValues } from "@/types/gauge-health"

interface GaugePredictionInputPanelProps {
  form: UseFormReturn<GaugeLifePredictionFormValues, unknown, GaugeLifePredictionFormValues>
  fields: Array<{ id: string }>
  appendHistory: UseFieldArrayAppend<GaugeLifePredictionFormValues, "history">
  removeHistory: UseFieldArrayRemove
  onLoadDemo: () => void
  onResetDraft: () => void
  onSubmit: (values: GaugeLifePredictionFormValues) => void
  onSubmitInvalid: () => void
}

function nextHistoryRow(previousYear?: number): GaugeHistoryObservation {
  return {
    year: previousYear ? previousYear + 1 : new Date().getFullYear(),
    measured_value_mm: gaugeLifePredictionDemoDefaults.standard_size_mm,
  }
}

export function GaugePredictionInputPanel({
  form,
  fields,
  appendHistory,
  removeHistory,
  onLoadDemo,
  onResetDraft,
  onSubmit,
  onSubmitInvalid,
}: GaugePredictionInputPanelProps) {
  const historyErrors = form.formState.errors.history
  const selectedGaugeType = form.watch("gauge_type")
  const selectedWearDirection = form.watch("wear_direction")
  const wearDirectionPreset = getGaugeTypeWearDirectionPreset(selectedGaugeType)
  const isWearDirectionPresetLocked = wearDirectionPreset !== null && selectedGaugeType !== "Snap Gauge"

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, onSubmitInvalid)}>
        <Card className="border-border/70 shadow-sm">
          <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FlaskConical className="h-5 w-5 text-primary" />
                Manual Gauge Input &amp; Observation Builder
              </CardTitle>
              <p className="mt-2 text-sm text-muted-foreground">
                Frontend-only demo workflow. Enter gauge dimensions and historical calibration observations, then run the prediction engine.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={onLoadDemo}>
                <Sparkles className="h-4 w-4" />
                Load Demo Sample
              </Button>
              <Button type="button" variant="outline" onClick={onResetDraft}>
                <RotateCcw className="h-4 w-4" />
                Reset Draft
              </Button>
              <Button type="submit">
                <Calculator className="h-4 w-4" />
                Run Prediction
              </Button>
            </div>
          </CardHeader>

          <CardContent className="grid gap-6 xl:grid-cols-[0.95fr_1.25fr]">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="rounded-2xl border border-border/70 bg-muted/20 p-5"
            >
              <div className="mb-5">
                <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Gauge information</div>
                <div className="mt-2 text-lg font-semibold">Dimensional baseline</div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                <FormField
                  control={form.control}
                  name="gauge_name"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2 xl:col-span-1 2xl:col-span-2">
                      <FormLabel>Gauge Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Plug Gauge - 10 mm Master" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="gauge_type"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2 xl:col-span-1 2xl:col-span-2">
                      <FormLabel>Gauge Type</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value)
                          const preset = getGaugeTypeWearDirectionPreset(value)
                          if (preset) {
                            form.setValue("wear_direction", preset, {
                              shouldDirty: true,
                              shouldTouch: true,
                              shouldValidate: true,
                            })
                          }
                        }}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select gauge type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {GAUGE_TYPE_OPTIONS.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="wear_direction"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2 xl:col-span-1 2xl:col-span-2">
                      <FormLabel>Wear Direction</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={isWearDirectionPresetLocked}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select wear direction" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {WEAR_DIRECTION_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Wear Trend:{" "}
                        <span className="font-medium text-foreground">
                          {selectedWearDirection === "decreasing" ? "↘ Decreasing" : "↗ Increasing"}
                        </span>
                        {wearDirectionPreset && isWearDirectionPresetLocked
                          ? ` • Auto-set by ${selectedGaugeType} preset`
                          : " • Manual selection enabled"}
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="standard_size_mm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Standard Size (mm)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.001"
                          inputMode="decimal"
                          value={field.value ?? ""}
                          onChange={(event) => field.onChange(event.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="wear_limit_mm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Wear Limit (mm)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.001"
                          inputMode="decimal"
                          value={field.value ?? ""}
                          onChange={(event) => field.onChange(event.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="min_limit_mm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Min Limit (mm)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.001"
                          inputMode="decimal"
                          value={field.value ?? ""}
                          onChange={(event) => field.onChange(event.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="max_limit_mm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Limit (mm)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.001"
                          inputMode="decimal"
                          value={field.value ?? ""}
                          onChange={(event) => field.onChange(event.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.08 }}
              className="rounded-2xl border border-border/70 bg-muted/20 p-5"
            >
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Historical calibration data</div>
                  <div className="mt-2 text-lg font-semibold">Observed dimensional wear</div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendHistory(nextHistoryRow(form.getValues(`history.${fields.length - 1}.year`)))}
                >
                  <Plus className="h-4 w-4" />
                  Add Observation
                </Button>
              </div>

              <div className="overflow-hidden rounded-xl border border-border/70 bg-background">
                <div className="max-h-[420px] overflow-auto">
                  <Table className="min-w-[560px]">
                    <TableHeader>
                      <TableRow className="bg-muted/30 hover:bg-muted/30">
                        <TableHead className="sticky top-0 bg-background/95 backdrop-blur">Calibration Year</TableHead>
                        <TableHead className="sticky top-0 bg-background/95 backdrop-blur">Measured Value (mm)</TableHead>
                        <TableHead className="sticky top-0 bg-background/95 text-right backdrop-blur">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fields.map((row, index) => (
                        <TableRow key={row.id}>
                          <TableCell className="align-top">
                            <FormField
                              control={form.control}
                              name={`history.${index}.year`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      step="1"
                                      inputMode="numeric"
                                      value={field.value ?? ""}
                                      onChange={(event) => field.onChange(event.target.value)}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </TableCell>
                          <TableCell className="align-top">
                            <FormField
                              control={form.control}
                              name={`history.${index}.measured_value_mm`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      step="0.001"
                                      inputMode="decimal"
                                      value={field.value ?? ""}
                                      onChange={(event) => field.onChange(event.target.value)}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </TableCell>
                          <TableCell className="text-right align-top">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeHistory(index)}
                              disabled={fields.length <= 2}
                              aria-label={`Remove history row ${index + 1}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {typeof historyErrors?.message === "string" && (
                <p className="mt-3 text-sm font-medium text-destructive">{historyErrors.message}</p>
              )}

              <p className="mt-3 text-xs text-muted-foreground">
                Enter at least two observations with unique years in ascending order. Wear calculations convert dimensional drift into microns per year.
              </p>
            </motion.div>
          </CardContent>
        </Card>
      </form>
    </Form>
  )
}
