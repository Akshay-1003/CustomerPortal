import { InwardTable } from "@/components/tables/InwardTable"
import { OutwardTable } from "@/components/tables/OutwardTable"
import { DemoTransactions } from "@/components/DemoControls"
import { isDemoSession } from "@/demo/session"

export default function InwardPage() {
  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{isDemoSession() ? "Sent for calibration" : "Inward Processing"}</h1>
          <p className="text-muted-foreground">
            {isDemoSession() ? "Track sample dispatches from your organization to the calibration laboratory." : "Manage gauges that are ready for inward processing after calibration completion."}
          </p>
        </div>
      </div>
      
      <DemoTransactions direction="sent" />
      {isDemoSession() ? <OutwardTable /> : <InwardTable />}
    </div>
  )
}
