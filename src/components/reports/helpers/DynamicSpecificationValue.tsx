import { formatSpecificationByKeys, formatSpecificationForPrint } from "./specificationFormatter"

type DynamicSpecificationValueProps = {
  specifications?: Record<string, unknown>
  value?: unknown
  keys?: string[]
  unit?: string
  fallback?: string
  className?: string
}

export function DynamicSpecificationValue({
  specifications,
  value,
  keys,
  unit = "mm",
  fallback = "N/A",
  className,
}: DynamicSpecificationValueProps) {
  const formatted =
    value !== undefined
      ? formatSpecificationForPrint(value, unit)
      : keys && keys.length > 0
        ? formatSpecificationByKeys(specifications, keys, unit, fallback)
        : formatSpecificationForPrint(specifications, unit)

  return <span className={className}>{formatted && formatted !== "-" ? formatted : fallback}</span>
}
