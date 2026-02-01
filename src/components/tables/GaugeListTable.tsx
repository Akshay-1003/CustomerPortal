import { useNavigate } from "react-router-dom"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import {
    Pagination, PaginationContent, PaginationItem,
    PaginationLink, PaginationNext, PaginationPrevious
} from "@/components/ui/pagination"
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, FileText } from "lucide-react"

interface Props {
    gauges: any[]
    currentPage: number
    setCurrentPage: (page: number) => void
    itemsPerPage: number
}

export function GaugeListTable({
    gauges,
    currentPage,
    setCurrentPage,
    itemsPerPage
}: Props) {

    const navigate = useNavigate()
    const totalPages = Math.ceil(gauges.length / itemsPerPage)
    const start = (currentPage - 1) * itemsPerPage
    const current = gauges.slice(start, start + itemsPerPage);
    
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
        navigate(`/gauge-list/history/${gaugeId}`)
    }

    return (
        <div className="space-y-4">
            <div className="rounded-md border overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead />
                            <TableHead>Sr</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Identification</TableHead>
                            <TableHead>Serial</TableHead>
                            <TableHead>Calibration Frequency</TableHead>
                            <TableHead>Make</TableHead>
                            <TableHead>Actions</TableHead>
                            <TableHead />
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {current.map((gauge, i) => (
                            <TableRow key={gauge.id}>
                                <TableCell>
                                    <Checkbox />
                                </TableCell>
                                <TableCell>{start + i + 1}</TableCell>
                                <TableCell>{gauge.master_gauge}</TableCell>
                                <TableCell>{gauge.identification_number}</TableCell>
                                <TableCell>{gauge.manf_serial_number}</TableCell>
                                <TableCell>{gauge.calibration_frequency} {gauge.calibration_frequency_unit}</TableCell>
                                <TableCell>
                                    {gauge.make}
                                </TableCell>
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
                                                <FileText className="mr-2 h-4 w-4" /> View History
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
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

        </div>
    )
}
