import React, { useCallback, useEffect, useState } from 'react'
import type { AxiosError } from 'axios'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AlertCircle, ArrowLeft, CheckCircle, Clock, Lock, Smartphone } from 'lucide-react'
import { formatCurrency } from '../lib/utils'
import { PageContainer, Section } from '../components/layout'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Skeleton } from '../components/ui/Skeleton'
import { bookingApi, paymentApi } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import type { Booking } from '../types/api'
import { BookingProgress } from '../components/booking/BookingProgress'

const youpiScriptUrl = import.meta.env.VITE_YOUPI_SCRIPT_URL as string | undefined
const youpiPublicKey = import.meta.env.VITE_YOUPI_PUBLIC_KEY as string | undefined
const gatewayConfigured = Boolean(youpiScriptUrl && youpiPublicKey)

declare global {
  interface Window {
    Youpi?: {
      pay: (options: {
        paymentId: string
        checkoutUrl: string
        order_id: string
        amount: number
        currency: 'INR'
        name: string
        description: string
        handler: (response: { status?: string; utr?: string; order_id?: string }) => void
        onClose: () => void
      }) => Promise<unknown> | unknown
    }
  }
}

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms))

export function PaymentPage() {
  const { bookingId } = useParams<{ bookingId: string }>()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [awaitingVerification, setAwaitingVerification] = useState(false)
  const [gatewayReady, setGatewayReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!gatewayConfigured || !youpiScriptUrl || !youpiPublicKey) return
    if (window.Youpi) {
      setGatewayReady(true)
      return
    }

    let script = document.querySelector<HTMLScriptElement>('script[data-cinelock-youpi]')
    const handleLoad = () => setGatewayReady(Boolean(window.Youpi))
    const handleError = () => setError('Could not load YouPI checkout. Check the gateway URL and try again.')
    if (!script) {
      script = document.createElement('script')
      script.src = youpiScriptUrl
      script.async = true
      script.dataset.cinelockYoupi = 'true'
      script.dataset.youpiKey = youpiPublicKey
      script.dataset.currency = 'INR'
      document.head.appendChild(script)
    }
    script.addEventListener('load', handleLoad)
    script.addEventListener('error', handleError)
    if (window.Youpi) handleLoad()
    return () => {
      script?.removeEventListener('load', handleLoad)
      script?.removeEventListener('error', handleError)
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: window.location.pathname }, replace: true })
      return
    }
    if (!bookingId) {
      setError('No booking was found.')
      setIsLoading(false)
      return
    }
    let active = true
    bookingApi.getBooking(bookingId)
      .then((response) => { if (active) setBooking(response.data) })
      .catch(() => { if (active) setError('Could not load booking details.') })
      .finally(() => { if (active) setIsLoading(false) })
    return () => { active = false }
  }, [bookingId, isAuthenticated, navigate])

  const waitForReconciliation = useCallback(async () => {
    if (!bookingId) return
    setAwaitingVerification(true)
    setIsProcessing(false)
    for (let attempt = 0; attempt < 120; attempt += 1) {
      try {
        const response = await bookingApi.getBooking(bookingId)
        setBooking(response.data)
        if (response.data.payment_status === 'paid') {
          navigate(`/ticket/${bookingId}`, { replace: true })
          return
        }
        if (response.data.payment_status === 'failed') {
          setAwaitingVerification(false)
          setError('The gateway did not confirm this payment. You can try again.')
          return
        }
      } catch {
        // Keep polling through brief network interruptions while the checkout is open.
      }
      await wait(5000)
    }
    setAwaitingVerification(false)
    setError('Payment is still awaiting verification. You can return here later to check again.')
  }, [bookingId, navigate])

  const startPayment = async () => {
    if (!booking || !window.Youpi) {
      setError('YouPI checkout is not ready. Check the gateway settings and reload this page.')
      return
    }
    setError(null)
    setIsProcessing(true)
    try {
      const session = await paymentApi.createYoupiCheckout(booking.id)
      await window.Youpi.pay({
        paymentId: session.data.payment_id,
        checkoutUrl: session.data.checkout_url,
        order_id: booking.id,
        amount: booking.total_amount,
        currency: 'INR',
        name: 'CineLock',
        description: `${booking.show?.movie?.title || 'Movie tickets'} · ${booking.seats.join(', ')}`,
        // A browser callback is only an observation. Server reconciliation via
        // the signed webhook remains the source of truth before ticket issue.
        handler: () => { void waitForReconciliation() },
        onClose: () => setIsProcessing(false),
      })
    } catch (cause) {
      const error = cause as AxiosError<{ detail?: string }>
      setError(error.response?.data?.detail || (cause instanceof Error ? cause.message : 'Could not open YouPI checkout. Please try again.'))
    } finally {
      setIsProcessing(false)
    }
  }

  if (isLoading) {
    return <PageContainer><div className="max-w-2xl mx-auto py-12"><Skeleton variant="text" className="h-8 w-64 mx-auto mb-8" /><div className="card p-8"><Skeleton variant="rectangular" className="w-full aspect-[4/3] rounded-lg" /></div></div></PageContainer>
  }

  if (error && !booking) {
    return <PageContainer><div className="max-w-md mx-auto card p-12 text-center"><AlertCircle className="w-12 h-12 mx-auto text-text-muted mb-4" /><h2 className="text-h2 font-semibold mb-2">Unable to load booking</h2><p className="text-text-secondary mb-6">{error}</p><Link to="/bookings" className="btn-primary">My Bookings</Link></div></PageContainer>
  }
  if (!booking) return null

  const posterUrl = booking.show?.movie?.poster_url || `https://via.placeholder.com/200x300/1a1a2e/e50914?text=${encodeURIComponent(booking.show?.movie?.title || 'Movie')}`
  const payable = booking.payment_status !== 'paid'

  return (
    <PageContainer>
      <BookingProgress current={4} />
      <Section className="mb-8">
        <div className="max-w-2xl mx-auto">
          <Link to="/bookings" className="btn-ghost btn-sm mb-6 inline-flex"><ArrowLeft className="w-4 h-4 mr-1" aria-hidden="true" />Back to Bookings</Link>
          <Card className="mb-6" padding="lg">
            <div className="flex gap-5">
              <img src={posterUrl} alt={`${booking.show?.movie?.title || 'Movie'} poster`} className="w-24 h-36 object-cover rounded-lg flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <h1 className="text-h2 font-bold text-text-primary truncate">{booking.show?.movie?.title || 'Movie tickets'}</h1>
                <p className="mt-2 text-body-sm text-text-secondary">{booking.show?.theater?.name} · {booking.show?.screen?.name}</p>
                <p className="mt-1 text-body-sm text-text-secondary">Seats: {booking.seats.join(', ')}</p>
                <Badge className="mt-3" variant={booking.payment_status === 'paid' ? 'success' : 'warning'}>Payment {booking.payment_status || 'pending'}</Badge>
              </div>
            </div>
          </Card>

          <Card className="mb-6 bg-brand-light border-brand-primary/20" padding="lg">
            <div className="flex items-center justify-between gap-4">
              <div><p className="text-body-sm text-text-secondary">Total payable</p><p className="text-h2 font-bold text-brand-primary">{formatCurrency(booking.total_amount)}</p></div>
              <div className="flex items-center gap-2 text-brand-primary"><Lock className="w-5 h-5" aria-hidden="true" /><span className="text-body-sm font-medium">YouPI UPI checkout</span></div>
            </div>
          </Card>

          {awaitingVerification ? (
            <div className="rounded-lg border border-warning bg-warning-light p-4 mb-5" role="status">
              <div className="flex items-start gap-3"><Clock className="w-5 h-5 text-warning mt-0.5" /><div><p className="font-medium text-text-primary">Waiting for payment verification</p><p className="text-body-sm text-text-secondary">The gateway callback alone does not confirm payment. CineLock is waiting for its signed reconciliation event.</p></div></div>
            </div>
          ) : null}
          {error && booking ? <p className="mb-4 rounded-lg bg-danger-light p-3 text-body-sm text-danger" role="alert">{error}</p> : null}
          {booking.payment_status === 'paid' ? (
            <Button className="w-full" size="lg" onClick={() => navigate(`/ticket/${booking.id}`, { replace: true })}><CheckCircle className="w-5 h-5" />View ticket</Button>
          ) : (
            <Button type="button" size="lg" className="w-full flex-nowrap whitespace-nowrap" onClick={startPayment} isLoading={isProcessing} disabled={!gatewayReady || !gatewayConfigured || isProcessing || awaitingVerification || !payable}>
              <Smartphone className="w-5 h-5 flex-shrink-0" />
              {!gatewayConfigured ? 'Configure YouPI to pay' : !gatewayReady ? 'Loading secure checkout…' : `Pay ${formatCurrency(booking.total_amount)} with UPI`}
            </Button>
          )}
          {!gatewayConfigured ? <p className="mt-3 text-center text-caption text-text-secondary">Set VITE_YOUPI_SCRIPT_URL and VITE_YOUPI_PUBLIC_KEY in frontend/.env to enable checkout.</p> : null}
          <Card className="mt-6" padding="md"><div className="flex items-start gap-3 text-body-sm text-text-secondary"><Lock className="w-5 h-5 flex-shrink-0 mt-0.5 text-brand-primary" /><div><p className="font-medium text-text-primary mb-1">Payment verification</p><p>CineLock issues the ticket only after the gateway sends a valid, reconciled payment event. The gateway callback by itself does not mark a payment complete.</p></div></div></Card>
        </div>
      </Section>
    </PageContainer>
  )
}
