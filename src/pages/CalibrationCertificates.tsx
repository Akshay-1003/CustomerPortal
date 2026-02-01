import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

// Mock data for demonstration
const generateMockCertificates = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `CERT-${String(i + 1).padStart(4, "0")}`,
    gaugeId: `G${String((i % 20) + 1).padStart(4, "0")}`,
    certificateNumber: `CERT-${String(i + 1).padStart(6, "0")}`,
    issueDate: new Date(2024, 0, 1 + i).toLocaleDateString(),
    expiryDate: new Date(2025, 0, 1 + i).toLocaleDateString(),
    status: ["Valid", "Expired", "Expiring Soon"][i % 3],
    issuedBy: `Lab ${(i % 3) + 1}`,
    calibrationStandard: `ISO/IEC 17025:2017`,
  }))
}

const ITEMS_PER_PAGE = 10

export function CalibrationCertificates() {
  const [currentPage, setCurrentPage] = useState(1)
  const allCertificates = generateMockCertificates(38) // Total items
  const totalPages = Math.ceil(allCertificates.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentCertificates = allCertificates.slice(startIndex, endIndex)

  return (
    <div className="space-y-6 w-full">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Calibration Certificates</h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          View and manage calibration certificates
        </p>
      </div>
      <div className="rounded-md border w-full overflow-x-auto -mx-3 sm:mx-0">
        <div className="min-w-[900px]">
          <Table className="w-full">
          <TableHeader>
            <TableRow>
              <TableHead>Certificate ID</TableHead>
              <TableHead>Gauge ID</TableHead>
              <TableHead>Certificate Number</TableHead>
              <TableHead>Issue Date</TableHead>
              <TableHead>Expiry Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Issued By</TableHead>
              <TableHead>Standard</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentCertificates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  No certificates found.
                </TableCell>
              </TableRow>
            ) : (
              currentCertificates.map((certificate) => (
                <TableRow key={certificate.id}>
                  <TableCell className="font-medium">{certificate.id}</TableCell>
                  <TableCell>{certificate.gaugeId}</TableCell>
                  <TableCell>{certificate.certificateNumber}</TableCell>
                  <TableCell>{certificate.issueDate}</TableCell>
                  <TableCell>{certificate.expiryDate}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        certificate.status === "Valid"
                          ? "bg-green-100 text-green-800"
                          : certificate.status === "Expired"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {certificate.status}
                    </span>
                  </TableCell>
                  <TableCell>{certificate.issuedBy}</TableCell>
                  <TableCell className="text-xs">{certificate.calibrationStandard}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        </div>
      </div>
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  if (currentPage > 1) setCurrentPage(currentPage - 1)
                }}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <PaginationItem key={page}>
                <PaginationLink
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    setCurrentPage(page)
                  }}
                  isActive={currentPage === page}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  if (currentPage < totalPages) setCurrentPage(currentPage + 1)
                }}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
      <div className="text-sm text-muted-foreground">
        Showing {startIndex + 1} to {Math.min(endIndex, allCertificates.length)} of{" "}
        {allCertificates.length} certificates
      </div>
    </div>
  )
}

