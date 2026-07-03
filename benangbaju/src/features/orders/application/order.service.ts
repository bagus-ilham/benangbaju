import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/shared/types/database'
import * as repo from '../infrastructure/order.repository'
import { CreateOrderParams } from '../domain/order.types'

export class OrderService {
  constructor(private supabase: SupabaseClient<Database>) {}

  async getOrders(userId: string, status?: string, page = 1, limit = 10) {
    return repo.getOrders(this.supabase, userId, status, page, limit)
  }

  async getOrderDetail(orderNumber: string, userId?: string) {
    return repo.getOrderDetail(this.supabase, orderNumber, userId)
  }

  async createOrder(params: CreateOrderParams) {
    return repo.createOrder(this.supabase, params)
  }

  async cancelOrder(orderId: string, reason = 'Dibatalkan oleh customer') {
    return repo.cancelOrder(this.supabase, orderId, reason)
  }

  async confirmDelivery(orderId: string) {
    return repo.confirmDelivery(this.supabase, orderId)
  }

  async lazyCancelExpiredOrders(userId: string) {
    return repo.lazyCancelExpiredOrders(this.supabase, userId)
  }

  async generatePaymentToken(orderNumber: string) {
    return repo.generatePaymentToken(this.supabase, orderNumber)
  }

  async checkPaymentStatus(orderNumber: string) {
    return repo.checkPaymentStatus(this.supabase, orderNumber)
  }

  async adminGetOrders(
    params: { status?: string; search?: string; page?: number; limit?: number } = {}
  ) {
    return repo.adminGetOrders(this.supabase, params)
  }

  async adminUpdateOrderStatus(
    orderId: string,
    status: 'pending_payment' | 'processing' | 'shipped' | 'completed' | 'cancelled',
    trackingNumber?: string
  ) {
    return repo.adminUpdateOrderStatus(this.supabase, orderId, status, trackingNumber)
  }

  async adminGetReturnRequests() {
    return repo.adminGetReturnRequests(this.supabase)
  }

  async adminUpdateReturnRequest(
    requestId: string,
    params: {
      status: 'pending' | 'approved' | 'rejected' | 'completed'
      adminNotes?: string | null
      refundAmount?: number | null
    }
  ) {
    return repo.adminUpdateReturnRequest(this.supabase, requestId, params)
  }

  async adminUpdateTrackingNumber(orderId: string, trackingNumber: string) {
    return repo.adminUpdateTrackingNumber(this.supabase, orderId, trackingNumber)
  }
}
