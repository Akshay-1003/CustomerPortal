import type {
  CustomerPermissionMap,
  CustomerPermissionModule,
  PermissionAction,
  User,
  UserPermissionScope,
} from "@/types/api"

export const CUSTOMER_PERMISSION_MODULES = [
  "customer_dashboard",
  "customer_calibration",
  "customer_gauge_life_prediction",
  "customer_transactions",
  "customer_gauge_management",
  "customer_reports",
  "customer_notifications",
  "customer_settings",
] as const satisfies readonly CustomerPermissionModule[]

export const CUSTOMER_PERMISSION_PATHS: Array<{
  module: CustomerPermissionModule
  action: PermissionAction
  path: string
}> = [
  { module: "customer_dashboard", action: "view", path: "/" },
  { module: "customer_calibration", action: "view", path: "/calibration-overview" },
  { module: "customer_gauge_life_prediction", action: "view", path: "/gauge-life-prediction" },
  { module: "customer_transactions", action: "view", path: "/transactions/inward" },
  { module: "customer_gauge_management", action: "view", path: "/gauge-list" },
  { module: "customer_reports", action: "view", path: "/reports/history-card" },
  { module: "customer_notifications", action: "view", path: "/notifications" },
  { module: "customer_settings", action: "view", path: "/settings" },
]

const PERMISSION_ACTIONS = ["view", "edit"] as const satisfies readonly PermissionAction[]
const CUSTOMER_PERMISSION_MODULE_SET = new Set<string>(CUSTOMER_PERMISSION_MODULES)
const PERMISSION_ACTION_SET = new Set<string>(PERMISSION_ACTIONS)

const FULL_ACCESS_ROLES = new Set(["super_admin", "superadmin", "org_admin"])
const MANAGER_ROLES = new Set(["org_manager", "lab_admin", "lab_manager"])
const VIEW_ONLY_ROLES = new Set(["org_viewer", "lab_viewer", "lab_engineer"])
const CUSTOMER_USER_ROLES = new Set(["org_user"])

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value)

const isPermissionAction = (value: unknown): value is PermissionAction =>
  typeof value === "string" && PERMISSION_ACTION_SET.has(value)

const isCustomerPermissionModule = (value: string): value is CustomerPermissionModule =>
  CUSTOMER_PERMISSION_MODULE_SET.has(value)

const unwrapPermissionScope = (value: unknown): unknown => {
  let currentValue = value

  for (let depth = 0; depth < 3; depth += 1) {
    if (!isRecord(currentValue)) return currentValue

    const permissionsCandidate = currentValue.permissions
    if (!isRecord(permissionsCandidate)) return currentValue

    const hasNestedPermissionsObject = isRecord(permissionsCandidate.permissions)
    const hasModuleArrayValues = Object.entries(permissionsCandidate).some(
      ([key, candidateValue]) => isCustomerPermissionModule(key) && Array.isArray(candidateValue)
    )
    const looksLikeEnvelope =
      "user_id" in currentValue ||
      "status" in currentValue ||
      "message" in currentValue ||
      "entity" in currentValue ||
      "actions" in currentValue

    if (hasNestedPermissionsObject || (looksLikeEnvelope && !hasModuleArrayValues)) {
      currentValue = permissionsCandidate
      continue
    }

    return currentValue
  }

  return currentValue
}

export const normalizeCustomerPermissionScope = (value: unknown): UserPermissionScope => {
  const normalizedValue = unwrapPermissionScope(value)

  if (!isRecord(normalizedValue)) {
    return { permissions: {}, scope: "organization", organization_id: null, lab_id: null }
  }

  const rawPermissions = isRecord(normalizedValue.permissions)
    ? normalizedValue.permissions
    : {}

  const permissions = Object.entries(rawPermissions).reduce<CustomerPermissionMap>(
    (accumulator, [moduleKey, actions]) => {
      if (!isCustomerPermissionModule(moduleKey) || !Array.isArray(actions)) {
        return accumulator
      }

      accumulator[moduleKey] = Array.from(new Set(actions.filter(isPermissionAction)))
      return accumulator
    },
    {}
  )

  return {
    permissions,
    scope: typeof normalizedValue.scope === "string" ? normalizedValue.scope : "organization",
    organization_id:
      typeof normalizedValue.organization_id === "string" ? normalizedValue.organization_id : null,
    lab_id: typeof normalizedValue.lab_id === "string" ? normalizedValue.lab_id : null,
  }
}

export const hasExplicitCustomerPermissionConfig = (
  permissionScope: UserPermissionScope | null | undefined
) => {
  const normalizedScope = normalizeCustomerPermissionScope(permissionScope)
  const permissions = normalizedScope.permissions ?? {}

  return CUSTOMER_PERMISSION_MODULES.some((module) =>
    Object.prototype.hasOwnProperty.call(permissions, module)
  )
}

const getPrimaryRole = (user: User | null | undefined, roles?: readonly string[] | null) =>
  (user?.role || roles?.[0] || "").trim().toLowerCase()

const getDefaultActionsForRole = (
  role: string,
  module: CustomerPermissionModule
): PermissionAction[] => {
  if (FULL_ACCESS_ROLES.has(role) || MANAGER_ROLES.has(role)) {
    return module === "customer_settings" ? ["view"] : ["view", "edit"]
  }

  if (CUSTOMER_USER_ROLES.has(role)) {
    return module === "customer_transactions" ||
      module === "customer_gauge_management" ||
      module === "customer_notifications"
      ? ["view", "edit"]
      : ["view"]
  }

  if (VIEW_ONLY_ROLES.has(role)) {
    return ["view"]
  }

  return []
}

export const hasCustomerPermission = (
  user: User | null | undefined,
  module: CustomerPermissionModule,
  action: PermissionAction,
  roles?: readonly string[] | null
) => {
  const permissionScope = normalizeCustomerPermissionScope(user?.permissions)

  if (!hasExplicitCustomerPermissionConfig(permissionScope)) {
    return getDefaultActionsForRole(getPrimaryRole(user, roles), module).includes(action)
  }

  return (permissionScope.permissions?.[module] ?? []).includes(action)
}

export const canViewCustomerModule = (
  user: User | null | undefined,
  module: CustomerPermissionModule,
  roles?: readonly string[] | null
) => hasCustomerPermission(user, module, "view", roles)

export const canEditCustomerModule = (
  user: User | null | undefined,
  module: CustomerPermissionModule,
  roles?: readonly string[] | null
) => hasCustomerPermission(user, module, "edit", roles)

export const getFirstAccessibleCustomerPath = (
  user: User | null | undefined,
  roles?: readonly string[] | null
) =>
  CUSTOMER_PERMISSION_PATHS.find((item) =>
    hasCustomerPermission(user, item.module, item.action, roles)
  )?.path ?? null
