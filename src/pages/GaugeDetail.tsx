import { Link, useParams } from "react-router-dom"
import { usePageTitle } from "@/hooks/usePageTitle"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useGaugeHistory, useGaugeDetail } from "@/hooks/useGauges"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ArrowLeft, Download, Eye, Printer } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog"
import { toast } from "sonner"
import { useState, useCallback, useRef, useEffect } from "react"
import { CalibrationHistoryReport } from "@/components/reports/CalibrationHistoryReport"
import type { GaugeHistory } from "@/types/api"

type CertificatePreviewRecord = GaugeHistory & {
  gauge_name?: string
}

export function GaugeDetail() {
  usePageTitle()
  const { id } = useParams()

  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false)
  const [selectedCertificateUrl, setSelectedCertificateUrl] = useState<CertificatePreviewRecord | null>(null)
  const [isPrinting, setIsPrinting] = useState(false)
  const [iframeLoaded, setIframeLoaded] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const { data: gauge, isLoading: isLoadingGauge } = useGaugeDetail(id as string)
  const { data: gaugeHistory, isLoading: isLoadingGaugeHistory } = useGaugeHistory(id as string)

  const isLoading = isLoadingGauge || isLoadingGaugeHistory

  useEffect(() => {
    if (selectedCertificateUrl) {
      setIframeLoaded(false)
    }
  }, [selectedCertificateUrl])

  useEffect(() => {
    if (!isPreviewModalOpen) {
      setIframeLoaded(false)
      setIsPrinting(false)
    }
  }, [isPreviewModalOpen])

  const openPreviewModal = useCallback((certificateData: CertificatePreviewRecord) => {
    setSelectedCertificateUrl(certificateData)
    setIsPreviewModalOpen(true)
  }, [])

  const gaugeOverviewItems = [
    { label: "Gauge Name", value: gauge?.master_gauge || "N/A" },
    { label: "Serial Number", value: gauge?.manf_serial_number || "N/A" },
    { label: "Identification Number", value: gauge?.identification_number || "N/A" },
    { label: "Make", value: gauge?.make || "N/A" },
    {
      label: "Calibration Frequency",
      value: gauge?.calibration_frequency
        ? `${gauge.calibration_frequency} ${gauge?.calibration_frequency_unit || ""}`
        : "N/A",
    },
    { label: "Location", value: gauge?.calibration_location || "N/A" },
  ]

  const handleDownloadCertificate = useCallback(
    async (certificateUrl?: string, gaugeName?: string, gaugeLabId?: string) => {
      if (!certificateUrl) {
        toast.error("Certificate URL not available")
        return
      }

      try {
        const response = await fetch(certificateUrl, {
          credentials: "include",
        })

        if (!response.ok) {
          throw new Error("Download failed")
        }

        const blob = await response.blob()
        const safeName = `${gaugeName ?? "certificate"}_${gaugeLabId ?? ""}`.replace(/[^\w\d_-]/g, "_")
        const blobUrl = window.URL.createObjectURL(blob)

        const link = document.createElement("a")
        link.href = blobUrl
        link.download = `${safeName}.pdf`
        link.click()

        window.URL.revokeObjectURL(blobUrl)
        toast.success("Certificate downloaded successfully")
      } catch (error) {
        console.error(error)
        toast.error("Failed to download certificate")
      }
    },
    []
  )

  const handlePrint = useCallback(() => {
    const certificateUrl = selectedCertificateUrl?.certificate_url

    if (!certificateUrl) {
      toast.error("Certificate not ready for printing")
      return
    }

    const separator = certificateUrl.includes("?") ? "&" : "?"
    const certificateUrlWithoutHeader = `${certificateUrl}${separator}show_header=true`
    setIsPrinting(true)

    try {
      const printWindow = window.open(certificateUrlWithoutHeader, "_blank", "width=800,height=600")

      if (!printWindow) {
        toast.error("Please allow popups to print certificate")
        setIsPrinting(false)
        return
      }

      printWindow.onload = () => {
        setTimeout(() => {
          try {
            printWindow.focus()
            printWindow.print()
            setIsPrinting(false)
          } catch (err) {
            console.error("Print error:", err)
            setIsPrinting(false)
            toast.info("Certificate opened. Use Ctrl+P (Cmd+P on Mac) to print.")
          }
        }, 500)
      }

      setTimeout(() => {
        setIsPrinting(false)
      }, 3000)
    } catch (err) {
      console.error("Print error:", err)
      toast.error("Failed to open print dialog")
      setIsPrinting(false)
    }
  }, [selectedCertificateUrl])

  return (
    <>
      {isLoading ? (
        <Card className="w-full border-border/60 shadow-sm">
          <CardHeader>
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="aspect-video w-full" />
          </CardContent>
        </Card>
      ) : (
        <div className="w-full space-y-6">
          <div className="flex items-start justify-between gap-4 rounded-xl border border-border/50 bg-card p-4 shadow-sm sm:items-center sm:p-5">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild>
                <Link to="/gauge-list">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <div className="space-y-1">
                <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{gauge?.master_gauge}</h2>
                <p className="text-sm text-muted-foreground">
                  Gauge ID: <span className="font-medium text-foreground">{gauge?.identification_number || "N/A"}</span>
                </p>
              </div>
            </div>
          </div>

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-lg bg-muted/60 p-1">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="history">Calibration History</TabsTrigger>
              <TabsTrigger value="report">Report Analysis</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 xl:grid-cols-1">
                <Card className="border-border/60 shadow-sm">
                  <CardHeader className="space-y-1 pb-3">
                    <CardTitle className="text-base font-semibold">Gauge Overview</CardTitle>
                    <CardDescription>Primary details and operational metadata.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-3 sm:grid-cols-2">
                    {gaugeOverviewItems.map((item) => (
                      <div
                        key={item.label}
                        className="rounded-lg border border-border/50 bg-muted/20 px-3 py-2.5"
                      >
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">{item.label}</p>
                        <p className="mt-1 text-sm font-medium text-foreground break-words">{item.value}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <Card className="border-border/60 shadow-sm">
                <CardHeader className="space-y-1 pb-3">
                  <CardTitle>Calibration History</CardTitle>
                  <CardDescription>Complete calibration records for this gauge.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto rounded-xl border border-border/60 bg-background">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/40 hover:bg-muted/40">
                          <TableHead className="h-11 whitespace-nowrap px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Calibration Date
                          </TableHead>
                          <TableHead className="h-11 whitespace-nowrap px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Due Date
                          </TableHead>
                          <TableHead className="h-11 whitespace-nowrap px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Lab ID
                          </TableHead>
                          <TableHead className="h-11 whitespace-nowrap px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Status
                          </TableHead>
                          <TableHead className="h-11 whitespace-nowrap px-4 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {gaugeHistory?.length ? (
                          gaugeHistory.map((record, index) => (
                            <TableRow key={index} className="hover:bg-muted/20">
                              <TableCell className="px-4 py-3 text-sm">
                                {record.certificate_issue_date || "N/A"}
                              </TableCell>
                              <TableCell className="px-4 py-3 text-sm">
                                {record.next_calibration_date || "N/A"}
                              </TableCell>
                              <TableCell className="px-4 py-3 text-sm">
                                {record.inward_gauge_lab_id || "N/A"}
                              </TableCell>
                              <TableCell className="px-4 py-3 text-sm">
                                <Badge
                                  variant="outline"
                                  className={
                                    record.status === "calibration_completed"
                                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                      : "border-amber-200 bg-amber-50 text-amber-700"
                                  }
                                >
                                  {record.status === "calibration_completed" ? "Completed" : "Pending"}
                                </Badge>
                              </TableCell>
                              <TableCell className="px-4 py-3 text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => record.certificate_url && openPreviewModal(record)}
                                  disabled={!record.certificate_url}
                                  title="Preview Certificate"
                                  className="h-8 w-8 p-0"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                              No calibration history available for this gauge.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="report" className="space-y-4">
              <Card className="border-border/60 shadow-sm">
                        
                <CardContent className="pt-0">
                  <CalibrationHistoryReport gauge={gauge} history={gaugeHistory} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}

      <Dialog open={isPreviewModalOpen} onOpenChange={setIsPreviewModalOpen}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
          <DialogHeader className="flex flex-row justify-between items-center border-b bg-white py-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-lg">Certificate Preview</span>
            </div>

            <div className="flex items-center gap-3">
              {selectedCertificateUrl && (
                <Button
                  size="sm"
                  onClick={handlePrint}
                  disabled={isPrinting}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  {isPrinting ? "Printing..." : "Print"}
                </Button>
              )}

              {selectedCertificateUrl && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    handleDownloadCertificate(
                      selectedCertificateUrl.certificate_url,
                      selectedCertificateUrl.gauge_name,
                      selectedCertificateUrl.inward_gauge_lab_id
                    )
                  }}
                  className="font-medium"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              )}
            </div>
          </DialogHeader>

          <div className="bg-gray-50 p-0 overflow-hidden">
            {selectedCertificateUrl ? (
              <div className="relative w-full h-[calc(95vh-80px)] flex items-center justify-center bg-gray-100">
                {!iframeLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <p className="mt-2 text-sm text-gray-600">Loading certificate...</p>
                    </div>
                  </div>
                )}

                <div className="w-full h-full flex items-center justify-center p-2">
                  <iframe
                    ref={iframeRef}
                    src={selectedCertificateUrl.certificate_url}
                    title="Certificate Preview"
                    className="w-full max-w-4xl h-full bg-white shadow-lg rounded-lg border border-gray-200"
                    style={{ border: "none" }}
                    onLoad={() => setIframeLoaded(true)}
                  />
                </div>
              </div>
            ) : (
              <div className="min-h-[600px] flex items-center justify-center text-gray-500">
                <p className="text-lg">No certificate available</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
