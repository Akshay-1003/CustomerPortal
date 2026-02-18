import { useNavigate } from "react-router-dom"
import { useMemo, useState } from "react"
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
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, FileText, ArrowLeft } from "lucide-react"
import { gaugeService } from "@/services/gauge.service"
import { GaugeListPrintPreview, type GaugeListPrintRow } from "./GaugeListPrintPreview"

interface Props {
    gauges: any[]
    currentPage: number
    setCurrentPage: (page: number) => void
    itemsPerPage: number
    onGaugeUpdate?: () => void // Add callback for refresh
}

export function GaugeListTable({
    gauges,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    onGaugeUpdate
}: Props) {

    const navigate = useNavigate()
    const [isUpdating, setIsUpdating] = useState<string | null>(null)
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false)
    const totalPages = Math.ceil(gauges.length / itemsPerPage)
    const start = (currentPage - 1) * itemsPerPage
    const current = gauges.slice(start, start + itemsPerPage)
    const allSelected = gauges.length > 0 && selectedIds.size === gauges.length
    const someSelected = selectedIds.size > 0 && !allSelected
    const selectedRows = useMemo(() => gauges.filter((g) => selectedIds.has(g.id)), [gauges, selectedIds])
    const printSourceRows = selectedRows.length > 0 ? selectedRows : gauges

    const printRows = useMemo<GaugeListPrintRow[]>(
        () =>
            printSourceRows.map((gauge, i) => ({
                serialNo: i + 1,
                name: gauge.master_gauge || "N/A",
                identification: gauge.identification_number || "N/A",
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

    function getPageNumbers(current: number, total: number) {
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

        for (let i of range) {
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
    }
    const pages = getPageNumbers(currentPage, totalPages)

    const handleViewHistory = (gaugeId: string) => {
        navigate(`/reports/history-card/${gaugeId}`)
    }

    const handleOutward = async (gaugeId: string) => {
        try {
            setIsUpdating(gaugeId)
            await gaugeService.updateGaugeStatus(gaugeId, 'inward_pending')
            toast.success('Gauge status updated to outward processing')
            onGaugeUpdate?.() // Refresh the data
        } catch (error) {
            console.error('Error updating gauge status:', error)
            toast.error('Failed to update gauge status')
        } finally {
            setIsUpdating(null)
        }
    }

    const toggleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(new Set(gauges.map((gauge) => gauge.id)))
            return
        }
        setSelectedIds(new Set())
    }

    const toggleSelectRow = (id: string, checked: boolean) => {
        setSelectedIds((prev) => {
            const next = new Set(prev)
            if (checked) next.add(id)
            else next.delete(id)
            return next
        })
    }

    const onOpenPrintPreview = () => {
        if (printRows.length === 0) {
            toast.error("No gauge rows available to print")
            return
        }
        setIsPrintPreviewOpen(true)
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Button variant="outline" onClick={onOpenPrintPreview}>
                    Print A4 ({selectedRows.length > 0 ? `Selected ${selectedRows.length}` : `All ${gauges.length}`})
                </Button>
            </div>
            <div className="rounded-md border overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>
                                <Checkbox
                                    checked={allSelected ? true : someSelected ? "indeterminate" : false}
                                    onCheckedChange={(value) => toggleSelectAll(value === true)}
                                    aria-label="Select all gauge rows"
                                />
                            </TableHead>
                            <TableHead>Sr</TableHead>
                            <TableHead>Client Organization</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Identification</TableHead>
                            <TableHead>Serial</TableHead>
                            <TableHead>Calibration Frequency</TableHead>
                            <TableHead>Remark</TableHead>
                            <TableHead>Make</TableHead>
                            <TableHead>Actions</TableHead>
                            <TableHead />
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {gauges.length > 0 ? (
                            current.map((gauge, i) => (
                                <TableRow key={gauge.id}>
                                    <TableCell>
                                        <Checkbox
                                            checked={selectedIds.has(gauge.id)}
                                            onCheckedChange={(value) => toggleSelectRow(gauge.id, value === true)}
                                            aria-label={`Select gauge ${gauge.identification_number || gauge.id}`}
                                        />
                                    </TableCell>
                                    <TableCell>{start + i + 1}</TableCell>
                                    <TableCell>{gauge.client_organization}</TableCell>
                                    <TableCell>{gauge.master_gauge}</TableCell>
                                    <TableCell>{gauge.identification_number}</TableCell>
                                    <TableCell>{gauge.manf_serial_number}</TableCell>
                                    <TableCell>
                                        {gauge.calibration_frequency} {gauge.calibration_frequency_unit}
                                    </TableCell>
                                    <TableCell>{gauge.gauge_condition}</TableCell>
                                    <TableCell>{gauge.make}</TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button size="icon" variant="ghost">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>

                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>

                                                <DropdownMenuItem onClick={() => handleViewHistory(gauge.id)}>
                                                    <FileText className="mr-2 h-4 w-4" />
                                                    View History
                                                </DropdownMenuItem>

                                                <DropdownMenuSeparator />

                                                <DropdownMenuItem
                                                    onClick={() => handleOutward(gauge.id)}
                                                    disabled={
                                                        isUpdating === gauge.id ||
                                                        gauge.status === "inward_pending"
                                                    }
                                                    className="text-blue-600 focus:text-blue-600"
                                                >
                                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                                    {isUpdating === gauge.id
                                                        ? "Updating..."
                                                        : "Mark for Outward"}
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={11} className="text-center py-6 text-gray-500">
                                    No gauges found
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>

                </Table>
            </div>

            {totalPages > 1 && (
                <Pagination>
                    <PaginationContent>

                        <PaginationItem>
                            <PaginationPrevious
                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            />
                        </PaginationItem>

                        {pages.map((page, i) => (
                            <PaginationItem key={i}>
                                {page === "..." ? (
                                    <span className="px-3 text-muted-foreground">…</span>
                                ) : (
                                    <PaginationLink
                                        isActive={currentPage === page}
                                        onClick={() => setCurrentPage(Number(page))}
                                    >
                                        {page}
                                    </PaginationLink>
                                )}
                            </PaginationItem>
                        ))}

                        <PaginationItem>
                            <PaginationNext
                                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                            />
                        </PaginationItem>

                    </PaginationContent>
                </Pagination>
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
}
