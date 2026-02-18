import { extractAcceptanceLimitRows } from "./specificationFormatter"

type DynamicAcceptanceLimitTableProps = {
  specifications?: Record<string, unknown>
  fallbackGo?: string
  fallbackNoGo?: string
}

export function DynamicAcceptanceLimitTable({
  specifications,
  fallbackGo = "N/A",
  fallbackNoGo = "N/A",
}: DynamicAcceptanceLimitTableProps) {
  const rows = extractAcceptanceLimitRows(specifications)

  const resolvedRows =
    rows.length > 0
      ? rows
      : [
          {
            parameter: "Go",
            specificationLimitMax: fallbackGo,
            specificationLimitMin: "-",
            wearLimit: "-",
          },
          {
            parameter: "No Go",
            specificationLimitMax: fallbackNoGo,
            specificationLimitMin: "-",
            wearLimit: "-",
          },
        ]

  return (
    <table className="chr-acceptance-table">
      <thead>
        <tr>
          <th>Parameter</th>
          <th>Specification Limit Max</th>
          <th>Specification Limit Min</th>
          <th>Wear Limit</th>
        </tr>
      </thead>
      <tbody>
        {resolvedRows.map((row) => (
          <tr key={`${row.parameter}-${row.specificationLimitMax}-${row.specificationLimitMin}`}>
            <td>{row.parameter}</td>
            <td>{row.specificationLimitMax || "-"}</td>
            <td>{row.specificationLimitMin || "-"}</td>
            <td>{row.wearLimit || "-"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
