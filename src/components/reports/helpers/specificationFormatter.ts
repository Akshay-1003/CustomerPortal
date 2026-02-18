/**
 * Specification formatter for print/PDF.
 * Extracts concise, readable specification values for print documents.
 */

/**
 * Format a number value for display (4 decimal places for measurements).
 */
export function formatNumber(value: unknown): string {
  if (value === null || value === undefined) return ""
  if (typeof value === "number") return value.toFixed(4)
  if (typeof value === "string") return value
  return String(value)
}

/**
 * Check if a value has meaningful data.
 */
export function hasValue(value: unknown): boolean {
  if (value === null || value === undefined) return false
  if (typeof value === "string" && value.trim() === "") return false
  if (Array.isArray(value) && value.length === 0) return false
  if (typeof value === "object" && Object.keys(value as Record<string, unknown>).length === 0) return false
  return true
}

/**
 * Extract Go value from specification.
 */
export function extractGoValue(go: unknown): string | null {
  if (!go || typeof go !== "object") return null
  const goObj = go as Record<string, unknown>

  if (goObj.basic_size !== undefined) return formatNumber(goObj.basic_size)
  if (goObj.specification_limit_max !== undefined) return formatNumber(goObj.specification_limit_max)
  if (goObj.specification_limit_min !== undefined) return formatNumber(goObj.specification_limit_min)

  return null
}

/**
 * Extract No-Go value from specification.
 */
export function extractNoGoValue(noGo: unknown): string | null {
  if (!noGo || typeof noGo !== "object") return null
  const noGoObj = noGo as Record<string, unknown>

  if (noGoObj.basic_size !== undefined) return formatNumber(noGoObj.basic_size)
  if (noGoObj.specification_limit_max !== undefined) return formatNumber(noGoObj.specification_limit_max)
  if (noGoObj.specification_limit_min !== undefined) return formatNumber(noGoObj.specification_limit_min)

  return null
}

export interface AcceptanceLimitRow {
  parameter: string
  specificationLimitMax: string
  specificationLimitMin: string
  wearLimit: string
}

function toRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null
  }
  return value as Record<string, unknown>
}

function titleCase(value: string): string {
  return value
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (m) => m.toUpperCase())
}

function pickValue(obj: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    if (hasValue(obj[key])) {
      return formatNumber(obj[key])
    }
  }
  return "-"
}

function makeRow(parameter: string, source: Record<string, unknown>): AcceptanceLimitRow {
  return {
    parameter,
    specificationLimitMax: pickValue(source, [
      "specification_limit_max",
      "specified_limit_max",
      "limit_max",
      "max",
      "max_wear_limit",
      "upper_limit",
      "upper",
      "basic_size",
    ]),
    specificationLimitMin: pickValue(source, [
      "specification_limit_min",
      "specified_limit_min",
      "limit_min",
      "min",
      "min_wear_limit",
      "lower_limit",
      "lower",
      "basic_size",
    ]),
    wearLimit: pickValue(source, ["wear_limit", "wear_limit_max", "wear", "wearLimit", "max_wear"]),
  }
}

/**
 * Extract a dynamic acceptance limit table from specifications.
 * Handles go/no_go, nested parameter objects, and mixed formats.
 */
export function extractAcceptanceLimitRows(
  specifications: Record<string, unknown> | undefined
): AcceptanceLimitRow[] {
  if (!specifications) return []

  const rows: AcceptanceLimitRow[] = []

  const specificationTable = toRecord(specifications.specification_table)
  const tableGo = toRecord(specificationTable?.go)
  const tableNoGo = toRecord(specificationTable?.no_go)
  if (tableGo) rows.push(makeRow("Go", tableGo))
  if (tableNoGo) rows.push(makeRow("No Go", tableNoGo))

  const go = toRecord(specifications.go)
  const noGo = toRecord(specifications.no_go)

  if (!tableGo && go) rows.push(makeRow("Go", go))
  if (!tableNoGo && noGo) rows.push(makeRow("No Go", noGo))

  const ignoredKeys = new Set([
    "go",
    "no_go",
    "inputs",
    "range",
    "from",
    "to",
    "least_count",
    "leastCount",
    "basic_size",
    "size",
    "specification_size",
    "specification",
    "specification_table",
    "gauge_type",
    "gaugeType",
    "standard_specification",
    "reference_standard",
    "master_equipment",
    "acceptance_criteria",
    "acceptance_limit",
    "length",
    "width",
    "blockSize",
    "pitch_dial",
    "numberOfSplines",
    "majorDiameterMin",
    "majorDiameterMax",
  ])

  Object.entries(specifications).forEach(([key, value]) => {
    if (ignoredKeys.has(key)) return
    const record = toRecord(value)
    if (!record) return

    const hasLimitLikeData =
      hasValue(record.specification_limit_max) ||
      hasValue(record.specification_limit_min) ||
      hasValue(record.specified_limit_max) ||
      hasValue(record.specified_limit_min) ||
      hasValue(record.wear_limit) ||
      hasValue(record.limit_max) ||
      hasValue(record.limit_min)

    if (hasLimitLikeData) {
      rows.push(makeRow(titleCase(key), record))
    }
  })

  if (rows.length > 0) {
    return rows
  }

  const inputs = toRecord(specifications.inputs)
  const toleranceInputs = toRecord(inputs?.inputs)
  if (inputs?.method === "tolerance" && toleranceInputs) {
    rows.push({
      parameter: "Tolerance",
      specificationLimitMax: pickValue(toleranceInputs, ["upper_tolerance"]),
      specificationLimitMin: pickValue(toleranceInputs, ["lower_tolerance"]),
      wearLimit: "-",
    })
  }

  return rows
}

/**
 * Format specifications for print display.
 */
export function formatSpecificationForPrint(specifications: unknown, unit = "mm"): string {
  if (specifications === null || specifications === undefined) return "-"

  if (typeof specifications === "string") {
    return specifications.trim() || "-"
  }

  if (Array.isArray(specifications)) {
    if (specifications.length === 0) return "-"

    const values = specifications
      .map((value) => formatNumber(value))
      .filter(Boolean)

    if (values.length === 0) return "-"

    const formattedValues = values.map((value) => `${value} ${unit}`)
    if (formattedValues.length <= 4) return formattedValues.join(", ")
    return `${formattedValues.slice(0, 4).join(", ")} (+${formattedValues.length - 4} more)`
  }

  if (typeof specifications === "object") {
    const specs = specifications as Record<string, unknown>
    const parts: string[] = []

    if (specs.inputs && typeof specs.inputs === "object") {
      const inputs = specs.inputs as Record<string, unknown>
      if (inputs.method === "tolerance" && inputs.inputs && typeof inputs.inputs === "object") {
        const toleranceInputs = inputs.inputs as Record<string, unknown>
        const basicSize = toleranceInputs.basic_size
        const upperTolerance = toleranceInputs.upper_tolerance
        const lowerTolerance = toleranceInputs.lower_tolerance

        if (hasValue(basicSize) && hasValue(upperTolerance) && hasValue(lowerTolerance)) {
          const basicSizeStr = formatNumber(basicSize)
          const upperTolStr = formatNumber(upperTolerance)
          const lowerTolStr = formatNumber(lowerTolerance)
          parts.push(`${basicSizeStr} (${upperTolStr}/${lowerTolStr}) ${unit}`)
          return parts.join("; ")
        }
      }
    }

    const goValue = extractGoValue(specs.go)
    const noGoValue = extractNoGoValue(specs.no_go)

    if (goValue && noGoValue) {
      parts.push(`(${goValue} / ${noGoValue}) ${unit}`)
    } else if (goValue) {
      parts.push(`${goValue} ${unit}`)
    } else if (noGoValue) {
      parts.push(`${noGoValue} ${unit}`)
    }

    if (specs.range && typeof specs.range === "object") {
      const range = specs.range as Record<string, unknown>
      const min = formatNumber(range.min)
      const max = formatNumber(range.max)
      if (min && max) {
        parts.push(`(${min} - ${max}) ${unit}`)
      } else if (min || max) {
        parts.push(`${min || max} ${unit}`)
      }
    }

    if (hasValue(specs.from) || hasValue(specs.to)) {
      const from = formatNumber(specs.from)
      const to = formatNumber(specs.to)
      if (from && to) {
        parts.push(`(${from} - ${to}) ${unit}`)
      } else if (from || to) {
        parts.push(`${from || to} ${unit}`)
      }
    }

    const lc = specs.least_count || specs.leastCount
    if (hasValue(lc)) {
      parts.push(`LC: ${formatNumber(lc)} ${unit}`)
    }

    if (specs.basic_size) {
      if (Array.isArray(specs.basic_size)) {
        const values = specs.basic_size
          .map((value) => formatNumber(value))
          .filter(Boolean)
        if (values.length > 0) {
          parts.push(values.map((value) => `${value} ${unit}`).join(", "))
        }
      } else if (hasValue(specs.basic_size)) {
        parts.push(`${formatNumber(specs.basic_size)} ${unit}`)
      }
    }

    if (hasValue(specs.standard_specification)) {
      parts.push(`Std: ${formatNumber(specs.standard_specification)}`)
    }

    if (hasValue(specs.taper_angle)) {
      parts.push(`Taper: ${formatNumber(specs.taper_angle)}°`)
    }

    if (specs.pitch_dial && typeof specs.pitch_dial === "object") {
      const pd = specs.pitch_dial as Record<string, unknown>
      if (hasValue(pd.specified_limit_max)) {
        parts.push(`PD: ${formatNumber(pd.specified_limit_max)} ${unit}`)
      }
    }

    if (hasValue(specs.length) || hasValue(specs.width)) {
      const dimensions: string[] = []
      if (hasValue(specs.length)) dimensions.push(`L:${formatNumber(specs.length)} ${unit}`)
      if (hasValue(specs.width)) dimensions.push(`W:${formatNumber(specs.width)} ${unit}`)
      if (dimensions.length > 0) parts.push(dimensions.join(" × "))
    }

    if (hasValue(specs.blockSize)) {
      parts.push(`Block: ${formatNumber(specs.blockSize)} ${unit}`)
    }

    if (hasValue(specs.specification)) {
      parts.push(formatNumber(specs.specification))
    }

    if (hasValue(specs.numberOfSplines)) {
      parts.push(`${formatNumber(specs.numberOfSplines)} Splines`)
    }

    if (hasValue(specs.majorDiameterMin) || hasValue(specs.majorDiameterMax)) {
      const min = formatNumber(specs.majorDiameterMin)
      const max = formatNumber(specs.majorDiameterMax)
      if (min || max) {
        parts.push(`MD: ${min && max ? `${min}-${max} ${unit}` : `${min || max} ${unit}`}`)
      }
    }

    if (parts.length === 0) {
      const keys = Object.keys(specs)
      for (const key of keys) {
        const value = specs[key]
        if (hasValue(value) && typeof value !== "object") {
          return formatNumber(value)
        }
      }
      return "-"
    }

    return parts.join("; ")
  }

  return String(specifications) || "-"
}

/**
 * Pick the first key that has a meaningful value and format it.
 */
export function formatSpecificationByKeys(
  specifications: Record<string, unknown> | undefined,
  keys: string[],
  unit = "mm",
  fallback = "N/A"
): string {
  if (!specifications) return fallback

  for (const key of keys) {
    const value = specifications[key]
    if (hasValue(value)) {
      const formatted = formatSpecificationForPrint(value, unit)
      if (formatted && formatted !== "-") {
        return formatted
      }
    }
  }

  return fallback
}

/**
 * Format Lab ID for display without truncation.
 */
export function formatLabIdForPrint(labId: string | number | null | undefined): string {
  if (!labId) return "-"

  const value = String(labId).trim()
  if (!value) return "-"

  return value
}
