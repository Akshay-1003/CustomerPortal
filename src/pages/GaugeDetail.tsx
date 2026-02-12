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
import {
  ArrowLeft,
  Download,
  FileText,
  Eye,
  Printer,
  X
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog"
import { toast } from "sonner"
import { useState, useCallback, useRef, useEffect } from "react"


export function GaugeDetail() {
  usePageTitle()
  const { id } = useParams()

  // Certificate preview modal state
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false)
  const [selectedCertificateUrl, setSelectedCertificateUrl] = useState<any | null>(null)
  const [isPrinting, setIsPrinting] = useState(false)
  const [iframeLoaded, setIframeLoaded] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // ✅ Optimized: Fetch only specific gauge instead of all gauges
  const { data: gauge, isLoading: isLoadingGauge } = useGaugeDetail(id as string);
  const { data: gaugeHistory, isLoading: isLoadingGaugeHistory } = useGaugeHistory(id as string);

  const isLoading = isLoadingGauge || isLoadingGaugeHistory;

  // Handle iframe loading
  useEffect(() => {
    if (selectedCertificateUrl) {
      setIframeLoaded(false);
    }
  }, [selectedCertificateUrl]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isPreviewModalOpen) {
      setIframeLoaded(false);
      setIsPrinting(false);
    }
  }, [isPreviewModalOpen]);

  // Open preview modal
  const openPreviewModal = useCallback((certificateData: any) => {
    setSelectedCertificateUrl(certificateData);
    setIsPreviewModalOpen(true);
  }, []);

  
const handleDownloadCertificate = useCallback(
  async (
    certificateUrl?: string,
    gaugeName?: string,
    gaugeLabId?: string
  ) => {
    if (!certificateUrl) {
      toast.error("Certificate URL not available");
      return;
    }

    try {
      const response = await fetch(certificateUrl, {
        credentials: "include", // VERY important if cookies are used
      });

      if (!response.ok) {
        throw new Error("Download failed");
      }

      const blob = await response.blob();

      const safeName = `${gaugeName ?? "certificate"}_${gaugeLabId ?? ""}`
        .replace(/[^\w\d_-]/g, "_");

      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `${safeName}.pdf`;

      link.click();

      window.URL.revokeObjectURL(blobUrl);

      toast.success("Certificate downloaded successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to download certificate");
    }
  },
  []
);



  const handlePrint = useCallback(() => {
    if (!selectedCertificateUrl) {
      toast.error('Certificate not ready for printing');
      return;
    }

    const certificateUrlWithoutHeader = `${selectedCertificateUrl}?show_header=true`;
    setIsPrinting(true);
    try {
      // Open certificate in new window for printing
      const printWindow = window.open(certificateUrlWithoutHeader, '_blank', 'width=800,height=600');

      if (!printWindow) {
        toast.error('Please allow popups to print certificate');
        setIsPrinting(false);
        return;
      }

      // Wait for PDF to load, then trigger print dialog automatically
      printWindow.onload = () => {
        setTimeout(() => {
          try {
            printWindow.focus();
            printWindow.print();
            setIsPrinting(false);
          } catch (err) {
            console.error('Print error:', err);
            setIsPrinting(false);
            toast.info('Certificate opened. Use Ctrl+P (Cmd+P on Mac) to print.');
          }
        }, 500);
      };

      // Fallback timeout in case onload doesn't fire
      setTimeout(() => {
        setIsPrinting(false);
      }, 3000);

    } catch (err) {
      console.error('Print error:', err);
      toast.error('Failed to open print dialog');
      setIsPrinting(false);
    }
  }, [selectedCertificateUrl]);

  console.log(gaugeHistory)
  return (
    <>
      {isLoading ? (
        <Card className="w-full ">
          <CardHeader>
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="aspect-video w-full" />
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-6 w-full">

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                  <Link to="/gauge-list">
                    <ArrowLeft className="h-4 w-4" />
                  </Link>
                </Button>
                <div>
                  <h2 className="text-3xl font-bold tracking-tight">{gauge?.master_gauge}</h2>
                </div>
              </div>

            </div>
            {/* Main Content */}
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="history">Calibration History</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">Basic Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">

                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Serial Number:</span>
                        <span className="text-sm font-medium">{gauge?.manf_serial_number}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Identification Number:</span>
                        <span className="text-sm font-medium">{gauge?.identification_number}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Make:</span>
                        <span className="text-sm font-medium">{gauge?.make}</span>
                      </div>

                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="history" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Calibration History</CardTitle>
                    <CardDescription>Complete calibration record for this gaugeHistory</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Calibration Date</TableHead>
                          <TableHead>Calibration Due Date</TableHead>
                          <TableHead>Lab Id</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {gaugeHistory?.map((record, index) => (
                          <TableRow key={index}>
                            <TableCell>{record.certificate_issue_date}</TableCell>
                            <TableCell>{record.next_calibration_date}</TableCell>
                            <TableCell>{record.inward_gauge_lab_id}</TableCell>
                            <TableCell>
                              <Badge variant={record.status === "calibration_completed" ? "default" : "destructive"} className="capitalize text-center bg-green-600 text-white hover:bg-green-700">
                                {record.status === "calibration_completed" ? "Completed" : "Pending"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => record.certificate_url && openPreviewModal(record)}
                                disabled={!record.certificate_url}
                                title="Preview Certificate"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
             
            </Tabs>
          </div>
        </>
      )}

      {/* Certificate Preview Modal */}
      <Dialog open={isPreviewModalOpen} onOpenChange={setIsPreviewModalOpen}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
          <DialogHeader className="flex flex-row justify-between items-center border-b bg-white py-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-lg">Certificate Preview</span>
            </div>

            <div className="flex items-center gap-3">
              {/* Print Button */}
              {selectedCertificateUrl && (
                <Button
                  size="sm"
                  onClick={handlePrint}
                  disabled={isPrinting}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  {isPrinting ? 'Printing...' : 'Print'}
                </Button>
              )}

              {/* Download Button */}
              {selectedCertificateUrl && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    handleDownloadCertificate(selectedCertificateUrl.certificate_url, selectedCertificateUrl.gauge_name ,selectedCertificateUrl.inward_gauge_lab_id);
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

