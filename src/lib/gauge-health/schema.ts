import { z } from "zod"

export const gaugeHistoryObservationSchema = z.object({
  year: z.coerce
    .number()
    .int("Year must be a whole number")
    .min(1900, "Year must be 1900 or later")
    .max(2100, "Year must be 2100 or earlier"),
  measured_value_mm: z.coerce.number().finite("Measured value must be numeric"),
})

export const gaugeLifePredictionSchema = z
  .object({
    gauge_name: z.string().trim().min(2, "Gauge name is required"),
    gauge_type: z.string().trim().min(1, "Gauge type is required"),
    wear_direction: z.enum(["increasing", "decreasing"]),
    standard_size_mm: z.coerce.number().positive("Standard size must be greater than 0"),
    min_limit_mm: z.coerce.number().finite("Min limit must be numeric"),
    max_limit_mm: z.coerce.number().finite("Max limit must be numeric"),
    wear_limit_mm: z.coerce.number().positive("Wear limit must be greater than 0"),
    history: z
      .array(gaugeHistoryObservationSchema)
      .min(2, "Minimum 2 history records are required"),
  })
  .superRefine((values, ctx) => {
    if (values.wear_direction === "increasing" && values.wear_limit_mm < values.standard_size_mm) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["wear_limit_mm"],
        message: "Wear limit must be greater than or equal to standard size",
      })
    }

    if (values.wear_direction === "decreasing" && values.wear_limit_mm > values.standard_size_mm) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["wear_limit_mm"],
        message: "Wear limit must be less than or equal to standard size for decreasing wear",
      })
    }

    if (values.max_limit_mm < values.min_limit_mm) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["max_limit_mm"],
        message: "Max limit must be greater than or equal to min limit",
      })
    }

    const seenYears = new Map<number, number>()

    values.history.forEach((entry, index) => {
      const existingIndex = seenYears.get(entry.year)
      if (typeof existingIndex === "number") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["history", index, "year"],
          message: "Years must be unique",
        })
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["history", existingIndex, "year"],
          message: "Years must be unique",
        })
      } else {
        seenYears.set(entry.year, index)
      }

      if (index > 0 && entry.year <= values.history[index - 1].year) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["history", index, "year"],
          message: "Years must be in ascending order",
        })
      }
    })
  })

export type GaugeLifePredictionSchema = z.infer<typeof gaugeLifePredictionSchema>
