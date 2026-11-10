import React, { useState } from 'react'
import { cn } from '../../lib/utils'
import { formatCurrency } from '../../lib/utils'
import { CreditCard, Smartphone, Wallet, Check, Lock } from 'lucide-react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import type { Booking } from '../../types/api'

type PaymentMethod = 'card' | 'upi' | 'wallet'

interface PaymentFormProps {
  booking: Booking
  onPayment: (method: PaymentMethod, details?: Record<string, string>) => Promise<void>
  isLoading: boolean
}

const paymentMethods: { id: PaymentMethod; label: string; icon: React.ReactNode; description: string }[] = [
  { id: 'card', label: 'Credit/Debit Card', icon: <CreditCard className="w-5 h-5" />, description: 'Visa, Mastercard, RuPay' },
  { id: 'upi', label: 'UPI', icon: <Smartphone className="w-5 h-5" />, description: 'PhonePe, Google Pay, Paytm' },
  { id: 'wallet', label: 'Wallet', icon: <Wallet className="w-5 h-5" />, description: 'CineLock Wallet balance' },
]

export function PaymentForm({ booking, onPayment, isLoading }: PaymentFormProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('card')
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvv, setCardCvv] = useState('')
  const [upiId, setUpiId] = useState('')
  const [walletPin, setWalletPin] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    let details: Record<string, string> = {}

    if (selectedMethod === 'card') {
      if (!cardNumber || !cardExpiry || !cardCvv) return
      details = { cardNumber, cardExpiry, cardCvv }
    } else if (selectedMethod === 'upi') {
      if (!upiId) return
      details = { upiId }
    } else if (selectedMethod === 'wallet') {
      if (!walletPin) return
      details = { walletPin }
    }

    await onPayment(selectedMethod, details)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Amount summary */}
      <div className="card p-4 bg-brand-light border-brand-primary/20">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-body-sm text-text-secondary">Total Payable</p>
            <p className="text-h2 font-bold text-brand-primary">{formatCurrency(booking.total_amount)}</p>
          </div>
          <div className="flex items-center gap-2 text-brand-primary">
            <Lock className="w-5 h-5" aria-hidden="true" />
            <span className="text-body-sm font-medium">Secure Payment</span>
          </div>
        </div>
      </div>

      {/* Payment methods */}
      <fieldset className="space-y-3">
        <legend className="text-body font-medium text-text-primary">Payment Method</legend>
        <div className="grid gap-3" role="radiogroup" aria-label="Select payment method">
          {paymentMethods.map((method) => (
            <label
              key={method.id}
              className={cn(
                'relative cursor-pointer',
                selectedMethod === method.id ? 'ring-2 ring-brand-primary' : 'ring-1 ring-border'
              )}
            >
              <input
                type="radio"
                name="paymentMethod"
                value={method.id}
                checked={selectedMethod === method.id}
                onChange={() => setSelectedMethod(method.id)}
                className="sr-only"
                aria-label={method.label}
              />
              <div className="p-4 rounded-lg border transition-all hover:bg-bg-tertiary">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'p-2 rounded-lg flex-shrink-0',
                    selectedMethod === method.id ? 'bg-brand-light text-brand-primary' : 'bg-bg-tertiary text-text-secondary'
                  )}>
                    {method.icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-text-primary">{method.label}</p>
                    <p className="text-caption text-text-secondary">{method.description}</p>
                  </div>
                  {selectedMethod === method.id && (
                    <Check className="w-5 h-5 text-brand-primary flex-shrink-0" aria-hidden="true" />
                  )}
                </div>
              </div>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Payment details */}
      <div className="space-y-4">
        {selectedMethod === 'card' && (
          <fieldset className="space-y-4">
            <legend className="text-body font-medium text-text-primary">Card Details</legend>
            <Input
              label="Card Number"
              placeholder="1234 5678 9012 3456"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value.replace(/\s/g, '').slice(0, 16))}
              type="tel"
              inputMode="numeric"
              maxLength={19}
              required
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Expiry (MM/YY)"
                placeholder="12/25"
                value={cardExpiry}
                onChange={(e) => setCardExpiry(e.target.value.replace(/[^\d]/g, '').slice(0, 4))}
                type="tel"
                inputMode="numeric"
                maxLength={5}
                required
              />
              <Input
                label="CVV"
                placeholder="123"
                value={cardCvv}
                onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                type="tel"
                inputMode="numeric"
                maxLength={3}
                required
              />
            </div>
          </fieldset>
        )}

        {selectedMethod === 'upi' && (
          <fieldset className="space-y-4">
            <legend className="text-body font-medium text-text-primary">UPI Details</legend>
            <Input
              label="UPI ID"
              placeholder="yourname@upi"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              type="email"
              required
            />
            <p className="text-caption text-text-secondary">
              You will receive a payment request on your UPI app
            </p>
          </fieldset>
        )}

        {selectedMethod === 'wallet' && (
          <fieldset className="space-y-4">
            <legend className="text-body font-medium text-text-primary">Wallet PIN</legend>
            <Input
              label="4-Digit PIN"
              placeholder="••••"
              value={walletPin}
              onChange={(e) => setWalletPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              type="password"
              inputMode="numeric"
              maxLength={4}
              required
            />
            <p className="text-caption text-text-secondary">
              Your CineLock Wallet balance will be used
            </p>
          </fieldset>
        )}
      </div>

      {/* Pay button */}
      <Button type="submit" className="w-full btn-lg" isLoading={isLoading} disabled={isLoading}>
        Pay {formatCurrency(booking.total_amount)}
      </Button>

      <p className="text-center text-caption text-text-secondary">
        By paying, you agree to our Terms of Service and Privacy Policy
      </p>
    </form>
  )
}