import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/hooks/useAuth"
import { useOrganizationById } from "@/hooks/useOrganizations"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { canEditCustomerModule } from "@/lib/permissions"
import { ReminderPreferences } from "@/components/notifications/ReminderPreferences"

export function Settings() {
  const { user } = useAuth()
  const profile = user?.user
  const canManageReminders = profile?.role === "org_admin" && canEditCustomerModule(profile, "customer_notifications", user?.roles)
  const { data: organization, isLoading: isLoadingOrganization } = useOrganizationById(profile?.organization_id || "")

  const displayValue = (value: unknown, fallback = "Not Available") => {
    if (!value || value === "None") return fallback
    return String(value)
  }
const roles = [
  { value: "org_admin", label: "Organization Admin" },
  { value: "user", label: "User" },
]


  return (
    <div className="space-y-6 w-full max-w-5xl">
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          {canManageReminders && <TabsTrigger value="reminders">Calibration Reminder Preferences</TabsTrigger>}
        </TabsList>
        <TabsContent value="profile" className="space-y-6">
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
                <Info label="Organization Name" value={ isLoadingOrganization ? "Loading..." : organization?.name || "Not Assigned"} />

                {/* Lab */}
                <Info label="Lab ID" value={displayValue(profile?.lab_id, "Not Assigned")} />

              </div>

            </CardContent>
          </Card>
        </TabsContent>
        {canManageReminders && (
          <TabsContent value="reminders">
            <ReminderPreferences />
          </TabsContent>
        )}
      </Tabs>
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
