import { useNavigate } from "react-router-dom"
import { useState, useMemo, useCallback, memo, forwardRef, useImperativeHandle } from "react"
import { FileText, ArrowLeft } from "lucide-react"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import {
    Pagination, PaginationContent, PaginationItem,
    PaginationLink, PaginationNext, PaginationPrevious
} from "@/components/ui/pagination"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { gaugeService } from "@/services/gauge.service"
import { GaugeListPrintPreview, type GaugeListPrintRow } from "./GaugeListPrintPreview"
import { formatSpecificationForPrint } from "@/components/reports/helpers/specificationFormatter"
import type { HistoryCardGauge } from "@/types/api"

interface Props {
    gauges: HistoryCardGauge[]
    currentPage: number
    setCurrentPage: (page: number) => void
    itemsPerPage: number
    setItemsPerPage?: (itemsPerPage: number) => void
    totalItems: number
    totalPages: number
    isLoading?: boolean
    onGaugeUpdate?: () => void
}

const GaugeListTableComponent = forwardRef<{
    onOpenPrintPreview: () => void
}, Props>(function GaugeListTable({
    gauges,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    totalItems,
    totalPages,
    isLoading = false,
    onGaugeUpdate
}, ref) {
    const navigate = useNavigate()
    const [isUpdating, setIsUpdating] = useState<string | null>(null)
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false)
    
    // Backend pagination - no need for client-side slicing
    const allSelected = useMemo(() => gauges.length > 0 && selectedIds.size === gauges.length, [gauges.length, selectedIds.size])
    const someSelected = useMemo(() => selectedIds.size > 0 && !allSelected, [selectedIds.size, allSelected])
    const selectedRows = useMemo(() => gauges.filter((g) => selectedIds.has(g.id)), [gauges, selectedIds])
    const printSourceRows = useMemo(() => selectedRows.length > 0 ? selectedRows : gauges, [selectedRows, gauges])

    const printRows = useMemo<GaugeListPrintRow[]>(
        () =>
            printSourceRows.map((gauge, i) => ({
                serialNo: i + 1,
                name: gauge.master_gauge || "N/A",
                identification: gauge.identification_number || "N/A",
                specifications: formatSpecificationForPrint(gauge.specifications, gauge.unit || "mm"),
                serial: gauge.manf_serial_number || "N/A",
                frequency: gauge.calibration_frequency
                    ? `${gauge.calibration_frequency} ${gauge.calibration_frequency_unit || ""}`
                    : "N/A",
                make: gauge.make || "N/A",
                clientOrganization: gauge.client_organization || "N/A",
                remark: gauge.gauge_condition || "N/A",
            })),
        [printSourceRows]
    )

    // Expose print function via ref
    const onOpenPrintPreview = useCallback(() => {
        if (printRows.length === 0) {
            toast.error("No gauge rows available to print")
            return
        }
        setIsPrintPreviewOpen(true)
    }, [printRows.length])

    // Use useImperativeHandle to expose the function
    useImperativeHandle(ref, () => ({
        onOpenPrintPreview
    }), [onOpenPrintPreview])

    const getPageNumbers = useCallback((current: number, total: number) => {
        const delta = 2
        const range = []
        const rangeWithDots: (number | string)[] = []
        let l: number | undefined

        for (let i = 1; i <= total; i++) {
            if (
                i === 1 ||
                i === total ||
                (i >= current - delta && i <= current + delta)
            ) {
                range.push(i)
            }
        }

        for (const i of range) {
            if (l) {
                if (i - l === 2) {
                    rangeWithDots.push(l + 1)
                } else if (i - l !== 1) {
                    rangeWithDots.push("...")
                }
            }
            rangeWithDots.push(i)
            l = i
        }

        return rangeWithDots
    }, [])

    const pages = useMemo(() => getPageNumbers(currentPage, totalPages), [currentPage, totalPages, getPageNumbers])

    // Debug pagination values
    console.log('Pagination Debug:', { currentPage, totalPages, pages })

    const handleViewHistory = useCallback((gaugeId: string) => {
        navigate(`/reports/history-card/${gaugeId}`)
    }, [navigate])

    const handleMarkForOutward = useCallback(async (id: string) => {
        try {
            setIsUpdating(id)
            await gaugeService.updateGaugeStatus(id, 'inward_pending')
            toast.success('Gauge status updated to outward processing')
            onGaugeUpdate?.()
        } catch (error) {
            console.error('Error updating gauge status:', error)
            toast.error('Failed to update gauge status')
        } finally {
            setIsUpdating(null)
        }
    }, [onGaugeUpdate])

    const toggleSelectAll = useCallback((checked: boolean) => {
        if (checked) {
            setSelectedIds(new Set(gauges.map((gauge) => gauge.id)))
            return
        }
        setSelectedIds(new Set())
    }, [gauges])

    const toggleSelectRow = useCallback((id: string, checked: boolean) => {
        setSelectedIds((prev) => {
            const next = new Set(prev)
            if (checked) next.add(id)
            else next.delete(id)
            return next
        })
    }, [])

    return (
        <div className="space-y-4">
            <div className="rounded-md border">
                <div className="overflow-x-auto">
                    <Table className="min-w-[1350px]">
                        <TableHeader>
                            <TableRow>
                                <TableHead>
                                    <Checkbox
                                        checked={allSelected ? true : someSelected ? "indeterminate" : false}
                                        onCheckedChange={(value) => toggleSelectAll(value === true)}
                                        aria-label="Select all gauge rows"
                                    />
                                </TableHead>
                                <TableHead>Serial No</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Identification Number</TableHead>
                                <TableHead>Serial Number</TableHead>
                                <TableHead>Make</TableHead>
                                <TableHead>Specifications</TableHead>
                                <TableHead>Least Count</TableHead>
                                <TableHead>Frequency</TableHead>
                                <TableHead>Condition</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={11} className="text-center py-8">
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                                            <span className="text-sm text-muted-foreground">Loading...</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : gauges.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={11} className="text-center py-6 text-gray-500">
                                        No gauges found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                gauges.map((gauge, index) => {
                                    const serialNumber = ((currentPage - 1) * itemsPerPage) + index + 1
                                    const specification = formatSpecificationForPrint(gauge.specifications, gauge.unit || "mm")

                                    return (
                                        <TableRow key={gauge.id}>
                                            <TableCell>
                                                <Checkbox
                                                    checked={selectedIds.has(gauge.id)}
                                                    onCheckedChange={(value) => toggleSelectRow(gauge.id, value === true)}
                                                    aria-label={`Select gauge ${gauge.master_gauge}`}
                                                />
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap font-medium">{serialNumber}</TableCell>
                                            <TableCell className="whitespace-nowrap">{gauge.master_gauge || "N/A"}</TableCell>
                                            <TableCell className="whitespace-nowrap">{gauge.identification_number || "N/A"}</TableCell>
                                            <TableCell className="whitespace-nowrap">{gauge.manf_serial_number || "N/A"}</TableCell>
                                            <TableCell className="whitespace-nowrap">{gauge.make || "N/A"}</TableCell>
                                            <TableCell className="whitespace-nowrap" title={specification}>
                                                <Badge
                                                    variant="outline"
                                                    className="border-blue-200 bg-blue-50 text-blue-700"
                                                >
                                                    {specification}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap">{gauge.least_count || "N/A"}</TableCell>
                                            <TableCell className="whitespace-nowrap">
                                                {gauge.calibration_frequency
                                                    ? `${gauge.calibration_frequency} ${gauge.calibration_frequency_unit || ""}`
                                                    : "N/A"}
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap">
                                                <Badge variant={gauge.gauge_condition === "Good" ? "default" : "secondary"}>
                                                    {gauge.gauge_condition || "N/A"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap">
                                                <div className="flex gap-1">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="bg-blue-100 hover:bg-blue-200 text-blue-700 border-blue-300 px-2 py-1 h-7 text-xs"
                                                        onClick={() => handleViewHistory(gauge.id)}
                                                    >
                                                        <FileText className="h-3 w-3" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="bg-orange-100 hover:bg-orange-200 text-orange-700 border-orange-300 px-2 py-1 h-7 text-xs"
                                                        onClick={() => handleMarkForOutward(gauge.id)}
                                                        disabled={isUpdating === gauge.id}
                                                    >
                                                        <ArrowLeft className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
            
            {/* Results Summary */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-sm text-muted-foreground mb-4">
                <span>
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} results
                </span>
                {setItemsPerPage && (
                    <div className="flex items-center gap-2">
                        <span>Rows per page:</span>
                        <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
                            <SelectTrigger className="w-20 h-8">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="5">5</SelectItem>
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="25">25</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                                <SelectItem value="100">100</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                )}
            </div>
            
            {/* Centered Pagination */}
            {totalPages >= 1 && (
                <div className={`flex flex-col items-center gap-4 ${isLoading ? "opacity-70" : ""}`}>
                    <Pagination>
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                    className={currentPage === 1 || isLoading ? "pointer-events-none opacity-50" : ""}
                                />
                            </PaginationItem>

                            {pages.map((page, i) => (
                                <PaginationItem key={i}>
                                    {page === "..." ? (
                                        <span className="px-3 text-muted-foreground">...</span>
                                    ) : (
                                        <PaginationLink
                                            isActive={currentPage === page}
                                            onClick={() => {
                                                if (!isLoading) setCurrentPage(Number(page))
                                            }}
                                            className={`${currentPage === page ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""} ${isLoading ? "pointer-events-none opacity-50" : ""}`}
                                        >
                                            {page}
                                        </PaginationLink>
                                    )}
                                </PaginationItem>
                            ))}

                            <PaginationItem>
                                <PaginationNext
                                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                    className={currentPage === totalPages || isLoading ? "pointer-events-none opacity-50" : ""}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                    {totalItems > 0 && (
                        <span className="text-xs text-muted-foreground">
                            Page {currentPage} of {totalPages}
                        </span>
                    )}
                </div>
            )}
          

            <GaugeListPrintPreview
                open={isPrintPreviewOpen}
                onOpenChange={setIsPrintPreviewOpen}
                rows={printRows}
                companyName={printSourceRows[0]?.client_organization || "Company"}
                companyAddress="151/1, Kalappanna Awade Textile Park, Kolhapur-416121 | calibration@company.com"
            />

        </div>
    )
})

GaugeListTableComponent.displayName = 'GaugeListTable'

export const GaugeListTable = memo(GaugeListTableComponent)
