import { extractAcceptanceLimitRows } from "./specificationFormatter"

type DynamicAcceptanceLimitTableProps = {
  specifications?: Record<string, unknown>
}

export function DynamicAcceptanceLimitTable({
  specifications,
}: DynamicAcceptanceLimitTableProps) {
  const rows = extractAcceptanceLimitRows(specifications)

  if (rows.length === 0) {
    return null
  }

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
        {rows.map((row) => (
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
