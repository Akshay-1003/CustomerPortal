import { OutwardTable } from "@/components/tables/OutwardTable"

export default function OutwardPage() {
  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Outward Processing</h1>
          <p className="text-muted-foreground">
            Manage gauges that are waiting for outward processing after inward completion.
          </p>
        </div>
      </div>
      
      <OutwardTable />
    </div>
  )
}
