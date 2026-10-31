import { OutwardTable } from "@/components/tables/OutwardTable"
import { InwardTable } from "@/components/tables/InwardTable"
import { DemoTransactions } from "@/components/DemoControls"
import { isDemoSession } from "@/demo/session"

export default function OutwardPage() {
  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{isDemoSession() ? "Received from calibration" : "Outward Processing"}</h1>
          <p className="text-muted-foreground">
            {isDemoSession() ? "Track sample gauges returned after calibration, including certificates and due dates." : "Manage gauges that are waiting for outward processing after inward completion."}
          </p>
        </div>
      </div>
      
      <DemoTransactions direction="received" />
      {isDemoSession() ? <InwardTable /> : <OutwardTable />}
    </div>
  )
}
