import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/contexts/AuthContext"
import { useOrganizations } from "@/hooks/useOrganizations"

export function Settings() {
  const { user } = useAuth()
  const profile = user?.user
  const { data: organizations, isLoading: isLoadingOrgs } = useOrganizations()

  const displayValue = (value: any, fallback = "Not Available") => {
    if (!value || value === "None") return fallback
    return value
  }
const roles = [
  { value: "org_admin", label: "Organization Admin" },
  { value: "user", label: "User" },
]


  return (
    <div className="space-y-6 w-full max-w-5xl">

      {/* Header */}
      <div>
        <h2 className="text-3xl font-semibold tracking-tight">
          Profile Information
        </h2>

        <p className="text-muted-foreground mt-1">
          View your personal and organization details.
        </p>
      </div>

      {/* Card */}
      <Card className="">

        <CardContent className="py-6">

          <div className="grid md:grid-cols-2 gap-x-12 gap-y-8">

            {/* Username */}
            <Info label="Username" value={displayValue(profile?.username)} />

            {/* Role */}
            <Info label="Role" value={roles.find(role => role.value === profile?.role)?.label || displayValue(profile?.role)} />

            {/* First Name */}
            <Info label="First Name" value={displayValue(profile?.first_name)} />

            {/* Last Name */}
            <Info label="Last Name" value={displayValue(profile?.last_name)} />

            {/* Email */}
            <Info label="Email Address" value={displayValue(profile?.email)} />

            {/* Department */}
            <Info label="Department" value={displayValue(profile?.department, "Not Assigned")} />

            {/* Organization */}
            <Info label="Organization Name" value={ isLoadingOrgs ? "Loading..." : organizations?.find(org => org.id === profile?.organization_id)?.name || "Not Assigned"} />

            {/* Lab */}
            <Info label="Lab ID" value={displayValue(profile?.lab_id, "Not Assigned")} />

          </div>

        </CardContent>
      </Card>
    </div>
  )
}

/* Reusable Field Component */
function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-sm text-muted-foreground">
        {label}
      </p>

      <p className="text-base font-medium text-gray-900">
        {value}
      </p>
    </div>
  )
}
