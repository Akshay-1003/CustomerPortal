import { useMemo } from "react"
import { authService } from "@/services/auth.service"
import { useOrganizationById } from "@/hooks/useOrganizations"
import { formatOrganizationAddress } from "@/lib/organization"

type UseCurrentOrganizationPrintInfoOptions = {
  fallbackName?: string
  fallbackAddress?: string
}

export function useCurrentOrganizationPrintInfo(options: UseCurrentOrganizationPrintInfoOptions = {}) {
  const organizationId = authService.getOrganizationId()
  const { data: organization } = useOrganizationById(organizationId || "")

  return useMemo(() => {
    return {
      organization,
      organizationName: organization?.name || options.fallbackName || "Company",
      organizationAddress: formatOrganizationAddress(organization) || options.fallbackAddress || "Address not available",
    }
  }, [organization, options.fallbackAddress, options.fallbackName])
}
