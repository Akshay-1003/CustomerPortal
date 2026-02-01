import { useQuery } from '@tanstack/react-query'
import { authService } from '@/services/auth.service'

export function useOrganizations() {
  return useQuery({
    queryKey: ['organizations'],
    queryFn: () => authService.getOrganizations(),
    staleTime: 1000 * 60 * 10, // 10 minutes - organizations rarely change
    retry: 1,
  })
}

export function useOrganizationById(id: string) {
  return useQuery({
    queryKey: ['organization', id],
    queryFn: () => authService.getOrganizationById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 10, // 10 minutes
    retry: 1,
  })
}