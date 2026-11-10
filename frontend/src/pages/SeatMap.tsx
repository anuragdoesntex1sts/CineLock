import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Ticket, Lock, AlertCircle, Info } from 'lucide-react'
import { cn, formatDate, formatTime, formatCurrency, parseIsoUtcTimestamp } from '../lib/utils'
import { Container, PageContainer, Section } from '../components/layout'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Card } from '../components/ui/Card'
import { Skeleton } from '../components/ui/Skeleton'
import { SeatMapComponent } from '../components/seatmap'
import { LockCountdownBanner } from '../components/seatmap/LockCountdown'
import { showApi, bookingApi } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import type { Show, SeatMap, Seat, SeatLockResponse } from '../types/api'
import { BookingProgress } from '../components/booking/BookingProgress'

export function SeatMapPage() {
  const { showId } = useParams<{ showId: string }>()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const { showToast } = useToast()

  const [show, setShow] = useState<Show | null>(null)
  const [seatMap, setSeatMap] = useState<SeatMap | null>(null)
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([])
  const [lockedSeats, setLockedSeats] = useState<Seat[]>([])
  const [bookedSeats, setBookedSeats] = useState<Seat[]>([])
  const [lockToken, setLockToken] = useState<string | null>(null)
  const [lockCountdown, setLockCountdown] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isLocking, setIsLocking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check auth
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/booking/${showId}` }, replace: true })
    }
  }, [isAuthenticated, navigate, showId])

  const fetchData = useCallback(async () => {
    if (!showId) return
    try {
      setIsLoading(true)
      const [showRes, seatMapRes] = await Promise.all([
        showApi.get(showId),
        showApi.getSeatMap(showId),
      ])
      setShow(showRes.data)
      setSeatMap(seatMapRes.data)
      // Initialize seat statuses
      const seats = seatMapRes.data.seats
      setLockedSeats(seats.filter((s) => s.status === 'locked'))
      setBookedSeats(seats.filter((s) => s.status === 'booked'))
      setError(null)
    } catch (err) {
      setError('Failed to load seat map')
    } finally {
      setIsLoading(false)
    }
  }, [showId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Update lock countdown
  useEffect(() => {
    if (!lockToken) return

    const interval = setInterval(() => {
      const now = new Date().getTime()
      const newCountdown: Record<string, string> = {}
      let hasActiveLocks = false

      selectedSeats.forEach((selectedSeat) => {
        const seat = lockedSeats.find((lockedSeat) => lockedSeat.id === selectedSeat.id)
        if (!seat) return
        if (seat.lock_expires_at) {
          const remaining = parseIsoUtcTimestamp(seat.lock_expires_at) - now
          if (remaining > 0) {
            const minutes = Math.floor(remaining / 60000)
            const seconds = Math.floor((remaining % 60000) / 1000)
            newCountdown[seat.id] = `${minutes}:${seconds.toString().padStart(2, '0')}`
            hasActiveLocks = true
          }
        }
      })

      setLockCountdown(newCountdown)

      if (!hasActiveLocks && lockToken) {
        // Locks expired, refresh seat map
        fetchData()
        setLockToken(null)
        setSelectedSeats([])
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [lockToken, lockedSeats, selectedSeats, fetchData])

  const handleSeatClick = useCallback((seatId: string) => {
    if (!seatMap || lockToken) return
    const seat = seatMap.seats.find((s) => s.id === seatId)
    if (!seat || (seat.status !== 'available' && seat.status !== 'selected')) return

    setSelectedSeats((prev) => {
      const isSelected = prev.some((s) => s.id === seatId)
      if (isSelected) {
        return prev.filter((s) => s.id !== seatId)
      }
      if (prev.length >= 8) {
        showToast({
          type: 'warning',
          title: 'Maximum seats reached',
          message: 'You can select up to 8 seats at a time',
        })
        return prev
      }
      return [...prev, seat]
    })
  }, [seatMap, lockToken, showToast])

  const handleLockSeats = useCallback(async () => {
    if (!user || selectedSeats.length === 0 || !showId) return

    setIsLocking(true)
    try {
      const seatIds = selectedSeats.map((s) => s.id)
      const response = await bookingApi.lockSeats({
        show_id: showId,
        seats: seatIds,
        user_id: user.id || '',
      })

      const { lock_token, expires_at, seats: lockedSeatIds } = response.data
      setLockToken(lock_token)
      sessionStorage.setItem(`lock_token_${showId}`, lock_token)
      sessionStorage.setItem(`selected_seats_${showId}`, seatIds.join(','))
      sessionStorage.setItem(`lock_expires_at_${showId}`, expires_at)

      // Update seat statuses
      setLockedSeats((prev) => {
        const existing = new Set(prev.map((s) => s.id))
        const newlyLocked = lockedSeatIds
          .filter((id) => !existing.has(id))
          .map((id) => seatMap?.seats.find((seat) => seat.id === id))
          .filter((seat): seat is Seat => Boolean(seat))
          .map((seat) => ({ ...seat, status: 'locked' as const, lock_expires_at: expires_at }))
        return [...prev, ...newlyLocked]
      })

      setLockCountdown((prev) => {
        const updated = { ...prev }
        lockedSeatIds.forEach((id) => { updated[id] = '5:00' })
        return updated
      })

      showToast({
        type: 'success',
        title: 'Seats locked',
        message: `Seats locked for 5:00. Complete booking before lock expires.`,
      })
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } }
      showToast({
        type: 'danger',
        title: 'Lock failed',
        message: error.response?.data?.detail || 'Could not lock seats. They may have been booked by someone else.',
      })
    } finally {
      setIsLocking(false)
    }
  }, [user, showId, selectedSeats, seatMap, showToast])

  const handleConfirmBooking = useCallback(async () => {
    if (!user || !lockToken || selectedSeats.length === 0 || !showId) return
    const seatIds = selectedSeats.map((seat) => seat.id)
    const expiresAt = lockedSeats.find((seat) => seat.id === seatIds[0])?.lock_expires_at || sessionStorage.getItem(`lock_expires_at_${showId}`) || ''
    navigate(`/booking/${showId}/confirm?lock_token=${encodeURIComponent(lockToken)}&seats=${encodeURIComponent(seatIds.join(','))}&expires_at=${encodeURIComponent(expiresAt)}`)
  }, [user, lockToken, selectedSeats, lockedSeats, showId, navigate])

  const canLock = selectedSeats.length > 0 && !isLocking
  const canConfirm = lockToken !== null && selectedSeats.length > 0
  const handleClearSelection = () => setSelectedSeats([])
  const myLockedSeats = lockedSeats.filter((seat) => selectedSeats.some((selectedSeat) => selectedSeat.id === seat.id))
  const myLockExpiry = myLockedSeats[0]?.lock_expires_at || null

  if (isLoading) {
    return (
      <PageContainer>
        <div className="grid gap-6">
          <Skeleton variant="text" className="h-8 w-64" />
          <div className="card p-8">
            <Skeleton variant="rectangular" className="w-full aspect-[4/3] rounded-lg" />
          </div>
        </div>
      </PageContainer>
    )
  }

  if (error || !show || !seatMap) {
    return (
      <PageContainer>
        <div className="card p-12 text-center max-w-md mx-auto">
          <Ticket className="w-12 h-12 mx-auto text-text-muted mb-4" aria-hidden="true" />
          <h2 className="text-h2 font-semibold text-text-primary mb-2">Unable to load seat map</h2>
          <p className="text-text-secondary mb-6">{error || 'Show not found'}</p>
          <Link to="/" className="btn-primary">Browse Movies</Link>
        </div>
      </PageContainer>
    )
  }

  const posterUrl = show.movie?.poster_url || `https://via.placeholder.com/200x300/1a1a2e/e50914?text=${encodeURIComponent(show.movie?.title || 'Movie')}`

  return (
    <PageContainer>
      <BookingProgress current={2} />
      {/* Header with show info */}
      <Section className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <Link to={`/movie/${show.movie_id}`} className="btn-ghost btn-sm">
            <ArrowLeft className="w-4 h-4 mr-1" aria-hidden="true" />
            Back
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
            <img
              src={posterUrl}
              alt={`${show.movie?.title || 'Movie'} poster`}
              className="w-20 h-30 object-cover rounded-lg flex-shrink-0"
            />
            <div className="min-w-0">
              <h1 className="text-h2 font-bold text-text-primary truncate">{show.movie?.title || 'Movie'}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-body-sm text-text-secondary">
                <span className="flex items-center gap-1">
                  <span aria-hidden="true">📅</span>
                  {formatDate(show.start_time)}
                </span>
                <span className="flex items-center gap-1">
                  <span aria-hidden="true">🕐</span>
                  {formatTime(show.start_time)}
                </span>
                <span className="flex items-center gap-1">
                  <span aria-hidden="true">🎭</span>
                  {show.screen?.name || 'Screen'}
                </span>
                <Badge variant="primary">{formatCurrency(show.price)} / seat</Badge>
              </div>
            </div>
          </div>

          {lockToken && (
            <LockCountdownBanner
              expiresAt={myLockExpiry}
              onExpire={() => {}}
            />
          )}
        </div>
      </Section>

      {/* Seat Map */}
      <Section>
        <div className="grid gap-6 lg:grid-cols-4">
          {/* Seat Map - Main */}
          <div className="lg:col-span-3">
            <SeatMapComponent
              seatMap={seatMap}
              selectedSeats={selectedSeats}
              lockedSeats={myLockedSeats}
              bookedSeats={bookedSeats}
              lockCountdown={lockCountdown}
              lockToken={lockToken}
              onSeatClick={handleSeatClick}
              onLockSeats={handleLockSeats}
              onConfirmBooking={handleConfirmBooking}
              isLocking={isLocking}
              isConfirming={false}
              onClearSelection={handleClearSelection}
              canLock={canLock}
              canConfirm={canConfirm}
              isLoading={false}
            />
          </div>

          {/* Sidebar - Booking Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24 space-y-4" padding="lg">
              <h2 className="text-h3 font-semibold text-text-primary">Booking Summary</h2>

              <div className="space-y-3">
                {selectedSeats.length > 0 ? (
                  <>
                    <div className="flex flex-wrap gap-1.5" aria-label="Selected seats">
                      {selectedSeats.map((seat) => (
                        <Badge key={seat.id} variant="selected" className="gap-1">
                          {seat.id}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex justify-between text-body-sm">
                      <span className="text-text-secondary">{selectedSeats.length} seat(s) selected</span>
                      <span className="font-medium text-text-primary">{formatCurrency(selectedSeats.length * show.price)}</span>
                    </div>
                  </>
                ) : (
                  <p className="text-text-secondary text-center py-4">No seats selected</p>
                )}

                {lockToken && (
                  <div className="p-3 bg-warning-light border border-warning rounded-lg">
                    <div className="flex items-center gap-2 text-warning mb-2">
                      <Lock className="w-4 h-4" aria-hidden="true" />
                      <span className="font-medium text-body-sm">Seats Locked</span>
                    </div>
                    <div className="flex justify-between text-body-sm font-mono tabular-nums">
                      <span>Lock expires</span>
                      <span id="lock-timer">{(selectedSeats[0] && lockCountdown[selectedSeats[0].id]) || '0:00'}</span>
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-border">
                  <div className="flex justify-between text-body font-semibold">
                    <span className="text-text-secondary">Total</span>
                    <span className="text-brand-primary">{formatCurrency(selectedSeats.length * show.price)}</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Info */}
            <Card padding="md" className="bg-bg-secondary">
              <div className="flex items-start gap-3 text-body-sm text-text-secondary">
                <Info className="w-5 h-5 flex-shrink-0 mt-0.5 text-brand-primary" aria-hidden="true" />
                <div>
                  <p className="font-medium text-text-primary mb-1">How it works</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Click available seats to select (max 8)</li>
                    <li>Click "Lock Seats" to reserve for 5 minutes</li>
                    <li>Complete booking before lock expires</li>
                    <li>Locked seats cannot be booked by others</li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </Section>
    </PageContainer>
  )
}
