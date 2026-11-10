import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Lock, AlertCircle, Clock } from 'lucide-react'
import { formatDate, formatTime, formatCurrency } from '../lib/utils'
import { PageContainer, Section } from '../components/layout'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Card } from '../components/ui/Card'
import { Skeleton } from '../components/ui/Skeleton'
import { showApi, bookingApi } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import { LockCountdown } from '../components/seatmap/LockCountdown'
import type { Show } from '../types/api'
import { BookingProgress } from '../components/booking/BookingProgress'

export function BookingConfirm() {
  const { showId } = useParams<{ showId: string }>()
  const navigate = useNavigate()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const { showToast } = useToast()

  const [show, setShow] = useState<Show | null>(null)
  const [selectedSeats, setSelectedSeats] = useState<string[]>(() => {
    const querySeats = new URLSearchParams(window.location.search).get('seats')
    return querySeats?.split(',').filter(Boolean) || sessionStorage.getItem(`selected_seats_${showId}`)?.split(',').filter(Boolean) || []
  })
  const [lockToken, setLockToken] = useState<string | null>(() => new URLSearchParams(window.location.search).get('lock_token') || sessionStorage.getItem(`lock_token_${showId}`))
  const [lockExpiresAt] = useState<string | null>(() => new URLSearchParams(window.location.search).get('expires_at') || sessionStorage.getItem(`lock_expires_at_${showId}`))
  const [isLoading, setIsLoading] = useState(true)
  const [isConfirming, setIsConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/booking/${showId}/confirm` }, replace: true })
      return
    }

    if (!lockToken || selectedSeats.length === 0) {
      navigate(`/booking/${showId}`, { replace: true })
      return
    }

    fetchShow()
  }, [authLoading, isAuthenticated, lockToken, selectedSeats.length, showId, navigate])

  const fetchShow = async () => {
    if (!showId) return
    try {
      setIsLoading(true)
      const response = await showApi.get(showId)
      setShow(response.data)
      setError(null)
    } catch (err) {
      setError('Failed to load show details')
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirm = async () => {
    if (!user || !lockToken || !showId) return

    setIsConfirming(true)
    try {
      const response = await bookingApi.confirm({
        show_id: showId,
        seats: selectedSeats,
        lock_token: lockToken,
      })

      // Clear session storage
      sessionStorage.removeItem(`lock_token_${showId}`)
      sessionStorage.removeItem(`selected_seats_${showId}`)
      sessionStorage.removeItem(`lock_expires_at_${showId}`)

      showToast({
        type: 'success',
        title: 'Seats reserved',
        message: 'Continue to payment. Your ticket will be available after payment is verified.',
      })

      // Navigate to payment page - would need booking ID from response
      if (!response.data.booking_id) throw new Error('The booking was confirmed, but the booking reference was missing.')
      navigate(`/payment/${response.data.booking_id}`, { replace: true })
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } }
      showToast({
        type: 'danger',
        title: 'Booking failed',
        message: error.response?.data?.detail || 'Could not confirm booking. Lock may have expired.',
      })
      // Redirect back to seat map
      navigate(`/booking/${showId}`, { replace: true })
    } finally {
      setIsConfirming(false)
    }
  }

  if (isLoading) {
    return (
      <PageContainer>
        <div className="max-w-2xl mx-auto text-center py-12">
          <Skeleton variant="text" className="h-8 w-64 mx-auto mb-8" />
          <div className="card p-8">
            <Skeleton variant="rectangular" className="w-full aspect-[4/3] rounded-lg" />
          </div>
        </div>
      </PageContainer>
    )
  }

  if (error || !show) {
    return (
      <PageContainer>
        <div className="max-w-md mx-auto card p-12 text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-text-muted mb-4" aria-hidden="true" />
          <h2 className="text-h2 font-semibold text-text-primary mb-2">Unable to confirm booking</h2>
          <p className="text-text-secondary mb-6">{error || 'Show not found'}</p>
          <Link to="/" className="btn-primary">Browse Movies</Link>
        </div>
      </PageContainer>
    )
  }

  if (!lockToken || selectedSeats.length === 0) {
    return (
      <PageContainer>
        <div className="max-w-md mx-auto card p-12 text-center">
          <Lock className="w-12 h-12 mx-auto text-text-muted mb-4" aria-hidden="true" />
          <h2 className="text-h2 font-semibold text-text-primary mb-2">No active seat lock</h2>
          <p className="text-text-secondary mb-6">Your seat lock has expired or is missing. Please select seats again.</p>
          <Link to={`/booking/${showId}`} className="btn-primary">Select Seats</Link>
        </div>
      </PageContainer>
    )
  }

  const posterUrl = show.movie?.poster_url || `https://via.placeholder.com/200x300/1a1a2e/e50914?text=${encodeURIComponent(show.movie?.title || 'Movie')}`

  return (
    <PageContainer>
      <BookingProgress current={3} />
      <Section className="mb-8">
        <div className="max-w-3xl mx-auto">
          <Link to={`/booking/${showId}`} className="btn-ghost btn-sm mb-6 inline-flex">
            <ArrowLeft className="w-4 h-4 mr-1" aria-hidden="true" />
            Back to Seats
          </Link>

          <Card className="mb-6" padding="lg">
            <div className="flex flex-col sm:flex-row gap-6">
              <img
                src={posterUrl}
                alt={`${show.movie?.title || 'Movie'} poster`}
                className="w-32 h-48 object-cover rounded-lg flex-shrink-0"
              />
              <div className="flex-1">
                <h1 className="text-h2 font-bold text-text-primary">{show.movie?.title || 'Movie'}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-body-sm text-text-secondary">
                  <Badge variant="primary">{show.movie?.genre}</Badge>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                    {formatDate(show.start_time)} at {formatTime(show.start_time)}
                  </span>
                  <span className="flex items-center gap-1">
                    <span aria-hidden="true">🎭</span>
                    {show.screen?.name}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Seat Confirmation */}
          <Card className="mb-6" padding="lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-h3 font-semibold text-text-primary">Confirm Your Seats</h2>
              <Lock className="w-5 h-5 text-brand-primary" aria-hidden="true" />
            </div>

            <div className="flex flex-wrap gap-2 mb-4" aria-label="Selected seats">
              {selectedSeats.map((seat) => (
                <Badge key={seat} variant="selected" className="gap-1">
                  {seat}
                </Badge>
              ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="p-3 bg-bg-secondary rounded-lg">
                <p className="text-body-sm text-text-secondary">Seats</p>
                <p className="font-medium text-text-primary">{selectedSeats.length}</p>
              </div>
              <div className="p-3 bg-bg-secondary rounded-lg">
                <p className="text-body-sm text-text-secondary">Price per seat</p>
                <p className="font-medium text-text-primary">{formatCurrency(show.price)}</p>
              </div>
              <div className="p-3 bg-bg-secondary rounded-lg">
                <p className="text-body-sm text-text-secondary">Total</p>
                <p className="font-bold text-h3 text-brand-primary">{formatCurrency(selectedSeats.length * show.price)}</p>
              </div>
              <div className="p-3 bg-brand-light border border-brand-primary/20 rounded-lg">
                <p className="text-body-sm text-text-secondary">Lock Token</p>
                <p className="font-mono text-body-sm text-text-primary truncate">{lockToken.slice(0, 16)}...</p>
              </div>
            </div>
          </Card>

          {/* Lock Countdown */}
          <div className="mb-6 p-4 bg-warning-light border border-warning rounded-lg">
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-warning flex-shrink-0" aria-hidden="true" />
              <div className="flex-1">
                <p className="font-medium text-text-primary">Complete booking before lock expires</p>
                <p className="text-body-sm text-text-secondary">You have 5 minutes to confirm. After that, seats will be released.</p>
              </div>
              <div id="confirm-timer"><LockCountdown expiresAt={lockExpiresAt} size="lg" /></div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Button
              variant="secondary"
              className="w-full whitespace-nowrap"
              onClick={() => navigate(`/booking/${showId}`)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
              Change Seats
            </Button>
            <Button
              size="lg"
              className="w-full whitespace-nowrap"
              onClick={handleConfirm}
              isLoading={isConfirming}
              disabled={isConfirming}
            >
              Continue to Payment
            </Button>
          </div>

          {/* Security Notice */}
          <Card className="mt-6" padding="md" variant="default">
            <div className="flex items-start gap-3 text-body-sm text-text-secondary">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-brand-primary" aria-hidden="true" />
              <div>
                <p className="font-medium text-text-primary mb-1">Secure Booking</p>
                <p>Your seat lock is protected by a unique token. Do not share this page or token with anyone. The lock expires in 5 minutes.</p>
              </div>
            </div>
          </Card>
        </div>
      </Section>
    </PageContainer>
  )
}
