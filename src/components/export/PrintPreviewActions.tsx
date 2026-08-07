import { useState } from "react"
import { Download, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { DownloadFormat } from "@/lib/export/types"

type PrintPreviewActionsProps = {
  disabled?: boolean
  onPrint: () => void
  onDownload: (format: DownloadFormat) => void
}

export function PrintPreviewActions({
  disabled = false,
  onPrint,
  onDownload,
}: PrintPreviewActionsProps) {
  const [downloadFormat, setDownloadFormat] = useState<DownloadFormat>("pdf")

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Select
        value={downloadFormat}
        onValueChange={(value) => setDownloadFormat(value as DownloadFormat)}
      >
        <SelectTrigger className="h-9 w-[168px] bg-background">
          <SelectValue placeholder="Select format" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="pdf">PDF</SelectItem>
          <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
          <SelectItem value="csv">CSV (.csv)</SelectItem>
        </SelectContent>
      </Select>

      <Button variant="outline" onClick={() => onDownload(downloadFormat)} disabled={disabled}>
        <Download className="h-4 w-4" />
        Download
      </Button>

      <Button onClick={onPrint} disabled={disabled}>
        <Printer className="h-4 w-4" />
        Print
      </Button>
    </div>
  )
}
