'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { AddressModal } from '@/modules/users/components/AddressModal'
import { AuthLoading, PageContainer, PageHero, HandDrawnIcon } from '@/shared/components'
import {
  CheckoutAddressForm,
  CheckoutSummaryCard,
  CheckoutProgressBar,
  PaymentMethodSelector,
} from './components'
import { useCheckoutFlow } from './hooks/useCheckoutFlow'

export default function CheckoutPage(): React.JSX.Element {
  const flow = useCheckoutFlow()

  if (flow.isLoading) {
    return <AuthLoading message="Memuat Checkout..." />
  }

  const isMYUI = flow.market === 'MY' || flow.isMalaysia

  return (
    <div className="min-h-screen bg-brand-cream font-sans">
      <PageHero
        eyebrow={isMYUI ? 'Checkout' : 'Pembelian'}
        title="Checkout"
        subtitle={
          isMYUI
            ? 'Complete your delivery address and choose a payment method.'
            : 'Lengkapi alamat pengiriman dan pilih metode pembayaran.'
        }
      />
      <PageContainer size="lg" className="pt-10 pb-20 md:pb-24 page-content">
        <CheckoutProgressBar checkoutStep={flow.checkoutStep} />

        {flow.isMalaysia && !flow.isMalaysiaShippingEnabled && (
          <div className="mb-6 p-4 rounded-xl border border-red-200 bg-red-50 text-red-700 flex items-start gap-3">
            <HandDrawnIcon name="alert-triangle" className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-red-800">
                {isMYUI ? 'International Shipping Disabled' : 'Pengiriman Internasional Dinonaktifkan'}
              </p>
              <p className="mt-0.5 text-red-700">
                {isMYUI
                  ? 'Shipping to Malaysia is currently paused by the system. Please select an Indonesian delivery address or contact Customer Care.'
                  : 'Pengiriman ke Malaysia saat ini sedang dinonaktifkan sementara oleh sistem. Silakan pilih alamat pengiriman di Indonesia atau hubungi Customer Service kami.'}
              </p>
            </div>
          </div>
        )}

        {flow.isMalaysia && flow.hasMyCartIssue && (
          <div className="mb-6 p-4 rounded-xl border border-brand-gold-stroke/80 bg-brand-gold/70 text-brand-plum flex items-start gap-3">
            <HandDrawnIcon name="alert-triangle" className="h-5 w-5 text-brand-plum/80 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-brand-plum">Action Required for Malaysia Shipping</p>
              {flow.unavailableMyItems.length > 0 && (
                <p className="mt-0.5 text-xs">
                  {flow.unavailableMyItems.length} item(s) in your bag are not available for Malaysia shipping. Please remove them in your shopping bag first.
                </p>
              )}
              {flow.outOfStockMyItems.length > 0 && (
                <p className="mt-0.5 text-xs">
                  {flow.outOfStockMyItems.length} item(s) exceed available Malaysia stock. Please reduce quantity in your shopping bag.
                </p>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 space-y-8"
          >
            <CheckoutAddressForm
              addresses={flow.addresses}
              selectedAddress={flow.selectedAddress}
              onSelectAddress={flow.setSelectedAddress}
              onAddNewAddress={() => flow.setAddressModalOpen(true)}
              addressesLoading={flow.addressesLoading}
              shippingOptions={flow.shippingOptions}
              selectedCourier={flow.selectedCourier}
              onSelectCourier={flow.setSelectedCourier}
              shippingLoading={flow.shippingLoading}
              notes={flow.notes}
              onNotesChange={flow.setNotes}
              totalWeightGram={flow.totalWeight}
              myrExchangeRate={flow.myrExchangeRate}
            />

            <div className="bg-brand-cream border border-neutral-200/80 p-6 rounded-2xl shadow-xs">
              <PaymentMethodSelector
                feeConfigs={flow.feeConfigs}
                selectedChannelCode={flow.selectedChannel?.channel_code || null}
                onSelectChannel={(channel) => flow.setSelectedChannel(channel)}
                subtotal={flow.subtotal}
                shippingCost={flow.shippingCost}
                discountAmount={flow.discountAmount}
                baseAmountMyr={flow.baseAmountMyr}
                myrExchangeRate={flow.myrExchangeRate}
                loading={flow.feeConfigsLoading}
                countryCode={flow.currentCountryCode}
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 space-y-6"
          >
            <CheckoutSummaryCard
              displayItems={flow.displayItems}
              subtotal={flow.subtotal}
              shippingCost={flow.shippingCost}
              paymentFee={flow.paymentFee}
              discountAmount={flow.discountAmount}
              totalAmount={flow.totalAmount}
              subtotalMyr={flow.subtotalMyr}
              shippingCostMyr={flow.shippingCostMyr}
              paymentFeeMyr={flow.paymentFeeMyr}
              discountAmountMyr={flow.discountAmountMyr}
              totalMyr={flow.totalMyr}
              voucherCodeInput={flow.voucherCodeInput}
              onVoucherInputChange={flow.setVoucherCodeInput}
              appliedVoucher={flow.appliedVoucher}
              onApplyVoucher={flow.handleApplyVoucher}
              onApplyVoucherDirectly={flow.handleApplyVoucherDirectly}
              onRemoveVoucher={flow.handleRemoveVoucher}
              availableVouchers={flow.filteredAvailableVouchers}
              voucherLoading={flow.voucherLoading}
              onPaymentSubmit={flow.handlePlaceOrder}
              isCheckoutProcessing={flow.isCheckoutProcessing}
              isPaymentTokenLoading={flow.isPaymentTokenLoading}
              canSubmit={flow.canSubmit}
              selectedChannelCode={flow.selectedChannel?.channel_code || null}
              isMalaysia={flow.isMalaysia}
              myrExchangeRate={flow.myrExchangeRate}
            />
          </motion.div>
        </div>
      </PageContainer>

      <AddressModal
        isOpen={flow.addressModalOpen}
        onClose={() => flow.setAddressModalOpen(false)}
        userId={flow.user?.id || ''}
      />
    </div>
  )
}
