import { adminCustomerRepository } from './adminCustomer.repository'

export class AdminCustomerService {
  async adminGetCustomers(page = 1, limit = 20) {
    return adminCustomerRepository.adminGetCustomers(page, limit)
  }

  async adminToggleCustomerStatus(customerId: string, isActive: boolean) {
    return adminCustomerRepository.adminToggleCustomerStatus(customerId, isActive)
  }

  async adminGetCustomerDetail(customerId: string) {
    return adminCustomerRepository.adminGetCustomerDetail(customerId)
  }
}

export const adminCustomerService = new AdminCustomerService()
