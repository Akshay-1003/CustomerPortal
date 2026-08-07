import type { Organization, OutwardAddress } from "@/types/api"

function normalizePart(value?: string | null): string | null {
  const trimmed = value?.trim()
  if (!trimmed) return null
  if (trimmed.toLowerCase() === "n/a") return null
  return trimmed
}

export function formatAddressWithOptionalEmail(
  address?: OutwardAddress | Organization["address"] | null,
  email?: string | null
): string {
  const addressParts = [
    normalizePart(address?.address_line_1),
    normalizePart(address?.address_line_2),
    normalizePart(address?.city),
    normalizePart(address?.state),
    normalizePart(address?.zip_code),
    normalizePart(address?.country),
  ].filter(Boolean)

  const formattedAddress = addressParts.join(", ")
  const formattedEmail = normalizePart(email)

  if (formattedAddress && formattedEmail) {
    return `${formattedAddress} | ${formattedEmail}`
  }

  return formattedAddress || formattedEmail || "Address not available"
}

export function formatOrganizationAddress(organization?: Organization | null): string {
  const primaryEmail =
    organization?.contacts?.find((contact) => normalizePart(contact?.email))?.email ?? null

  return formatAddressWithOptionalEmail(organization?.address, primaryEmail)
}
