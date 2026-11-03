import { apiService } from "./api.service"
import type { CustomerTransactionList, CustomerTransactionDetail, TransactionDirection, TransactionFilters } from "@/types/customerTransactions"

function path(direction: TransactionDirection) {
  return `/customer/transactions/${direction === "sent" ? "inwards" : "outwards"}`
}
export const customerTransactionsService = {
  list: (direction: TransactionDirection, filters: TransactionFilters) => apiService.get<CustomerTransactionList>(path(direction), { params: filters }),
  detail: (direction: TransactionDirection, id: string, through_group?: string) => apiService.get<CustomerTransactionDetail>(`${path(direction)}/${id}`, { params: { through_group } }),
}
