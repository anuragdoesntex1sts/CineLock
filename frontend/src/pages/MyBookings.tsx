import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Film, Ticket, Calendar, Clock, MapPin, Download, Trash2, X, Filter, ArrowLeft } from 'lucide-react'
import { cn } from '../lib/utils'
import { formatDate, formatTime, formatCurrency } from '../lib/utils'
import { Container, PageContainer, Section } from '../components/layout'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Card } from '../components/ui/Card'
import { Skeleton, SkeletonCard } from '../components/ui/Skeleton'
import { Modal } from '../components/ui/Modal'
import { bookingApi } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import type { Booking } from '../types/api'

type BookingFilter = 'all' | 'upcoming' | 'past' | 'cancelled'

export function MyBookings() {
  const { isAuthenticated } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<BookingFilter>('all')
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null)

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/bookings' }, replace: true })
      return
    }
    fetchBookings()
  }, [isAuthenticated, navigate])

  const fetchBookings = async () => {
    try {
      setIsLoading(true)
      const response = await bookingApi.getMyBookings()
      setBookings(response.data)
      setError(null)
    } catch (err) {
      setError('Failed to load bookings')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = async (booking: Booking) => {
    try {
      await bookingApi.cancel(booking.id)

      showToast({ type: 'success', title: 'Booking cancelled', message: 'Your booking has been cancelled' })
      fetchBookings()
    } catch (err) {
      showToast({ type: 'danger', title: 'Cancel failed', message: 'Could not cancel booking' })
    }
    setShowCancelModal(false)
    setBookingToCancel(null)
  }

  const filteredBookings = bookings.filter((booking) => {
    const showDate = new Date(booking.show?.start_time || booking.created_at)
    const now = new Date()
    const isPast = showDate < now

    switch (filter) {
      case 'upcoming':
        return !isPast && booking.status !== 'cancelled'
      case 'past':
        return isPast || booking.status === 'cancelled'
      case 'cancelled':
        return booking.status === 'cancelled'
      default:
        return true
    }
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge variant="success">Confirmed</Badge>
      case 'pending':
        return <Badge variant="warning">Pending</Badge>
      case 'cancelled':
        return <Badge variant="danger">Cancelled</Badge>
      default:
        return <Badge variant="default">{status}</Badge>
    }
  }

  if (isLoading) {
    return (
      <PageContainer>
        <Section>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-h1 font-bold text-text-primary">My Bookings</h1>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        </Section>
      </PageContainer>
    )
  }

  if (error) {
    return (
      <PageContainer>
        <Section>
          <div className="max-w-md mx-auto card p-12 text-center">
            <Ticket className="w-12 h-12 mx-auto text-text-muted mb-4" aria-hidden="true" />
            <h2 className="text-h2 font-semibold text-text-primary mb-2">Unable to load bookings</h2>
            <p className="text-text-secondary mb-6">{error}</p>
            <Button onClick={fetchBookings}>Retry</Button>
          </div>
        </Section>
      </PageContainer>
    )
  }

  if (bookings.length === 0) {
    return (
      <PageContainer>
        <Section className="py-16">
          <div className="max-w-md mx-auto text-center">
            <Ticket className="w-16 h-16 mx-auto text-text-muted mb-6" aria-hidden="true" />
            <h2 className="text-h2 font-semibold text-text-primary mb-2">No bookings yet</h2>
            <p className="text-text-secondary mb-6">When you book tickets, they\'ll appear here</p>
            <Link to="/" className="btn-primary">
              <Film className="w-4 h-4 mr-2" aria-hidden="true" />
              Browse Movies
            </Link>
          </div>
        </Section>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <Section>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <h1 className="text-h1 font-bold text-text-primary">My Bookings</h1>
          <div className="flex items-center gap-2" role="group" aria-label="Filter bookings">
            {(['all', 'upcoming', 'past', 'cancelled'] as BookingFilter[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-body-sm font-medium transition-colors',
                  filter === f
                    ? 'bg-brand-primary text-white'
                    : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary'
                )}
                aria-pressed={filter === f}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {filteredBookings.length === 0 ? (
          <div className="card p-12 text-center">
            <Filter className="w-12 h-12 mx-auto text-text-muted mb-4" aria-hidden="true" />
            <h3 className="text-h3 font-semibold text-text-primary mb-2">No bookings found</h3>
            <p className="text-text-secondary">Try changing your filter</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredBookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onCancel={() => {
                  setBookingToCancel(booking)
                  setShowCancelModal(true)
                }}
              />
            ))}
          </div>
        )}

        <Modal
          isOpen={showCancelModal}
          onClose={() => {
            setShowCancelModal(false)
            setBookingToCancel(null)
          }}
          title="Cancel Booking"
          description="Are you sure you want to cancel this booking? This action cannot be undone."
          size="sm"
        >
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setShowCancelModal(false)}>
              Keep Booking
            </Button>
            <Button variant="danger" onClick={() => bookingToCancel && handleCancel(bookingToCancel)}>
              Cancel Booking
            </Button>
          </div>
        </Modal>
      </Section>
    </PageContainer>
  )
}

function BookingCard({
  booking,
  onCancel,
}: {
  booking: Booking
  onCancel: () => void
}) {
  const posterUrl = booking.show?.movie?.poster_url || `https://via.placeholder.com/300x450/1a1a2e/e50914?text=${encodeURIComponent(booking.show?.movie?.title || 'Movie')}`
  const isPast = booking.show ? new Date(booking.show.start_time) < new Date() : false
  const isCancelled = booking.status === 'cancelled'
  const isConfirmed = booking.status === 'confirmed'

  const getStatusComponent = () => {
    if (isCancelled) return <Badge variant="danger">Cancelled</Badge>
    if (isConfirmed) return <Badge variant="success">Confirmed</Badge>
    return <Badge variant="warning">Pending</Badge>
  }

  return (
    <article className="card-hover block">
      <div className="flex flex-col sm:flex-row gap-4">
        <Link to={`/ticket/${booking.id}`} aria-label={`View ticket for ${booking.show?.movie?.title || 'movie'}`}>
          <img
            src={posterUrl}
            alt={`${booking.show?.movie?.title || 'Movie'} poster`}
            className="w-24 h-36 object-cover rounded-lg flex-shrink-0"
          />
        </Link>
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-body font-semibold text-text-primary truncate"><Link to={`/ticket/${booking.id}`}>{booking.show?.movie?.title || 'Movie'}</Link></h3>
                <p className="mt-1 text-caption text-text-secondary truncate">{booking.show?.movie?.genre}</p>
              </div>
              {getStatusComponent()}
            </div>

            <div className="mt-3 space-y-1.5 text-body-sm text-text-secondary">
              <p className="flex items-center gap-1 truncate">
                <Calendar className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
                {booking.show ? formatDate(booking.show.start_time) : formatDate(booking.created_at)}
              </p>
              <p className="flex items-center gap-1 truncate">
                <Clock className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
                {booking.show ? formatTime(booking.show.start_time) : ''}
              </p>
              <p className="flex items-center gap-1 truncate">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
                {booking.show?.theater?.name}
              </p>
              <p className="flex items-center gap-1 font-medium text-text-primary">
                <span aria-hidden="true">🎭</span>
                {booking.show?.screen?.name} • {booking.seats.join(', ')}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-stretch gap-3 pt-4 border-t border-border">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-body font-semibold text-brand-primary">{formatCurrency(booking.total_amount)}</span>
              <span className="text-caption text-text-secondary">{booking.seats.length} seat{booking.seats.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-2 w-full">
              <Link
                to={`/ticket/${booking.id}`}
                className="btn-secondary btn-sm flex-1 min-w-0 justify-center whitespace-nowrap"
              >
                <Download className="w-4 h-4 mr-1" aria-hidden="true" />
                Ticket
              </Link>
              {booking.status === 'confirmed' && !isPast && (
                <button
                  type="button"
                  onClick={(event) => { event.stopPropagation(); onCancel() }}
                  className="btn-ghost btn-sm text-danger hover:text-danger hover:bg-danger-light flex-1 min-w-0 justify-center whitespace-nowrap"
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                  <span>Cancel</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}
