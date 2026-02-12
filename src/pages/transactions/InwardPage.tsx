import { InwardTable } from "@/components/tables/InwardTable"

export default function InwardPage() {
  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Inward Processing</h1>
          <p className="text-muted-foreground">
            Manage gauges that are ready for inward processing after calibration completion.
          </p>
        </div>
      </div>
      
      <InwardTable />
    </div>
  )
}
