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
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"


export function GaugeDetail() {
  usePageTitle()
  const { id } = useParams()
  
  // ✅ Optimized: Fetch only the specific gauge instead of all gauges
  const { data: gauge, isLoading: isLoadingGauge } = useGaugeDetail(id as string);
  const { data: gaugeHistory, isLoading: isLoadingGaugeHistory } = useGaugeHistory(id as string);
  
  const isLoading = isLoadingGauge || isLoadingGaugeHistory;

  return (
    <>
    { isLoading ? (
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
          <TabsTrigger value="documents">Documents</TabsTrigger>
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
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
              <CardDescription>Calibration accuracy over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={gaugeHistory?.performance_data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="Accuracy %"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent> */}

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Documents & Certificates</CardTitle>
              <CardDescription>All related documents for this gaugeHistory</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {gaugeHistory?.map((record, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{record.certificate}</p>
                        <p className="text-sm text-muted-foreground">
                          Calibration Date: {record.date}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
      </>
    )}
    
    </>
   
  )
}

