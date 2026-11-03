import { CustomerTransactionsTable } from "@/components/tables/CustomerTransactionsTable"
import { DemoTransactions } from "@/components/DemoControls"

export default function InwardPage() {
  return (
    <div className="w-full space-y-6 rounded-xl bg-muted/30 p-4 sm:p-6">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Sent for Calibration</h1>
          <p className="text-muted-foreground">
            Track laboratory inward entries for your organization, the gauges sent, and their calibration and return progress.
          </p>
        </div>
      </div>
      
      <DemoTransactions direction="sent" />
      <CustomerTransactionsTable direction="sent" />
    </div>
  )
}
