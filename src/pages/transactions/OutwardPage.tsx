import { CustomerTransactionsTable } from "@/components/tables/CustomerTransactionsTable"
import { DemoTransactions } from "@/components/DemoControls"

export default function OutwardPage() {
  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Received from Calibration</h1>
          <p className="text-muted-foreground">
            Track laboratory outward entries and the gauges dispatched back to your organization after calibration.
          </p>
        </div>
      </div>
      
      <DemoTransactions direction="received" />
      <CustomerTransactionsTable direction="received" />
    </div>
  )
}
