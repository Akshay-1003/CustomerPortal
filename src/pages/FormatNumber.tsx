import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { mastersService } from "@/services/masters.service"

type FormatNumberFormValues = {
  history_card_format_number: string
}

const STORAGE_KEY = "history_card_format_number"

export function FormatNumberPage() {
  const [isSaving, setIsSaving] = useState(false)
  const form = useForm<FormatNumberFormValues>({
    defaultValues: { history_card_format_number: "" },
  })

  const { data, isLoading } = useQuery({
    queryKey: ["history-card-format-number"],
    queryFn: async () => {
      try {
        const fromApi = await mastersService.getHistoryCardFormatNumber()
        if (fromApi) return fromApi
      } catch {
        // fall back to local storage
      }
      return localStorage.getItem(STORAGE_KEY) || ""
    },
  })

  useEffect(() => {
    if (data !== undefined) {
      form.setValue("history_card_format_number", data)
    }
  }, [data, form])

  const onSubmit = form.handleSubmit(async (values) => {
    const value = values.history_card_format_number.trim()
    if (!value) {
      toast.error("History Card Format Number is required")
      return
    }

    setIsSaving(true)
    try {
      await mastersService.upsertHistoryCardFormatNumber(value)
      localStorage.setItem(STORAGE_KEY, value)
      toast.success("History Card Format Number updated")
    } catch (error: any) {
      localStorage.setItem(STORAGE_KEY, value)
      toast.success("Saved locally. API endpoint was unavailable.")
      console.error("Format number save error:", error)
    } finally {
      setIsSaving(false)
    }
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Format Numbers</h2>
        <p className="text-muted-foreground">Add or update the History Card format number.</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>History Card Format Number</CardTitle>
          <CardDescription>Short form to maintain print footer format number.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="history_card_format_number">Format Number *</Label>
              <Input
                id="history_card_format_number"
                placeholder="e.g. F/QA/09B Rev No.:00"
                disabled={isLoading}
                {...form.register("history_card_format_number", { required: true })}
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={isSaving || isLoading}>
                {isSaving ? "Updating..." : "Update"}
              </Button>
              <Button type="button" variant="outline" onClick={() => form.reset({ history_card_format_number: data || "" })}>
                Reset
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default FormatNumberPage

