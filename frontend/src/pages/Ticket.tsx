import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Download, Ticket, CheckCircle, Film, MapPin, Clock, Calendar, Star, QrCode, AlertCircle } from 'lucide-react'
import { cn } from '../lib/utils'
import { formatDate, formatTime, formatCurrency } from '../lib/utils'
import { Container, PageContainer, Section } from '../components/layout'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Card } from '../components/ui/Card'
import { Skeleton } from '../components/ui/Skeleton'
import { bookingApi } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import type { Booking } from '../types/api'
import { BookingProgress } from '../components/booking/BookingProgress'

export function TicketPage() {
  const { bookingId } = useParams<{ bookingId: string }>()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const { showToast } = useToast()

  const [booking, setBooking] = useState<Booking | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDownloading, setIsDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/ticket/${bookingId}` }, replace: true })
      return
    }

    if (bookingId) {
      fetchBooking()
    }
  }, [bookingId, isAuthenticated, navigate])

  const fetchBooking = async () => {
    try {
      setIsLoading(true)
      const response = await bookingApi.getBooking(bookingId!)
      setBooking(response.data)
      setError(null)
    } catch (err) {
      setError('Failed to load ticket')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = async () => {
    if (!bookingId) return

    setIsDownloading(true)
    try {
      const response = await bookingApi.getTicket(bookingId)
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `cinelock-ticket-${bookingId}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      showToast({
        type: 'success',
        title: 'Ticket downloaded',
        message: 'Your PDF ticket has been downloaded successfully',
      })
    } catch (err) {
      showToast({
        type: 'danger',
        title: 'Download failed',
        message: 'Could not download ticket. Please try again.',
      })
    } finally {
      setIsDownloading(false)
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

  if (error || !booking) {
    return (
      <PageContainer>
        <div className="max-w-md mx-auto card p-12 text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-text-muted mb-4" aria-hidden="true" />
          <h2 className="text-h2 font-semibold text-text-primary mb-2">Ticket not found</h2>
          <p className="text-text-secondary mb-6">{error || 'The ticket you\'re looking for doesn\'t exist'}</p>
          <Link to="/bookings" className="btn-primary">My Bookings</Link>
        </div>
      </PageContainer>
    )
  }

  if (booking.status === 'cancelled') {
    return (
      <PageContainer>
        <div className="max-w-md mx-auto card p-12 text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-danger mb-4" aria-hidden="true" />
          <h2 className="text-h2 font-semibold text-text-primary mb-2">Booking cancelled</h2>
          <p className="text-text-secondary mb-6">This booking was cancelled, so its ticket is no longer valid.</p>
          <Link to="/bookings" className="btn-primary">My Bookings</Link>
        </div>
      </PageContainer>
    )
  }

  if (booking.payment_status !== 'paid') {
    return (
      <PageContainer>
        <div className="max-w-md mx-auto card p-12 text-center">
          <Clock className="w-12 h-12 mx-auto text-warning mb-4" aria-hidden="true" />
          <h2 className="text-h2 font-semibold text-text-primary mb-2">Payment not verified yet</h2>
          <p className="text-text-secondary mb-6">CineLock will make your ticket available after the gateway confirms payment reconciliation.</p>
          <Link to={`/payment/${booking.id}`} className="btn-primary">Check payment status</Link>
        </div>
      </PageContainer>
    )
  }

  const posterUrl = booking.show?.movie?.poster_url || `https://via.placeholder.com/400x600/1a1a2e/e50914?text=${encodeURIComponent(booking.show?.movie?.title || 'Movie')}`
  const qrData = `cinelock://booking/${booking.id}`

  return (
    <PageContainer>
      <BookingProgress current={4} complete />
      <Section className="mb-8">
        <div className="max-w-3xl mx-auto">
          <Link to="/bookings" className="btn-ghost btn-sm mb-6 inline-flex">
            <ArrowLeft className="w-4 h-4 mr-1" aria-hidden="true" />
            Back to Bookings
          </Link>

          {/* Ticket Card */}
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-brand-primary/5 via-bg-primary to-brand-primary/5 border border-border">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--brand-primary)_0%,_transparent_60%)] opacity-10" />
            <div className="relative p-6 sm:p-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-brand-primary rounded-lg">
                    <Film className="w-6 h-6 text-white" aria-hidden="true" />
                  </div>
                  <div>
                    <h1 className="text-h2 font-bold text-text-primary">CineLock Ticket</h1>
                    <p className="text-body-sm text-text-secondary">Booking confirmed</p>
                  </div>
                </div>
                <CheckCircle className="w-8 h-8 text-success" aria-hidden="true" />
              </div>

              {/* Movie Info */}
              <div className="grid gap-6 md:grid-cols-3 mb-6">
                <div className="md:col-span-1">
                  <img
                    src={posterUrl}
                    alt={`${booking.show?.movie?.title || 'Movie'} poster`}
                    className="w-full aspect-[2/3] object-cover rounded-xl"
                  />
                </div>
                <div className="md:col-span-2 space-y-4">
                  <h2 className="text-display font-bold text-text-primary">{booking.show?.movie?.title || 'Movie'}</h2>
                  <div className="flex flex-wrap items-center gap-3 text-body-sm text-text-secondary">
                    <Badge variant="primary">{booking.show?.movie?.genre}</Badge>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                      {booking.show?.movie?.duration_min} min
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5" aria-hidden="true" />
                      8.5/10
                    </span>
                  </div>
                  <p className="text-body text-text-secondary line-clamp-3">{booking.show?.movie?.description}</p>
                </div>
              </div>

              {/* Show Details */}
              <div className="grid gap-4 sm:grid-cols-2 mb-6 p-4 bg-bg-secondary rounded-xl">
                <div>
                  <p className="text-body-sm font-medium text-text-secondary uppercase tracking-wider">Date & Time</p>
                  <p className="font-medium text-text-primary">{formatDate(booking.show?.start_time || '')} at {formatTime(booking.show?.start_time || '')}</p>
                </div>
                <div>
                  <p className="text-body-sm font-medium text-text-secondary uppercase tracking-wider">Theater</p>
                  <p className="font-medium text-text-primary flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                    {booking.show?.theater?.name}
                  </p>
                </div>
                <div>
                  <p className="text-body-sm font-medium text-text-secondary uppercase tracking-wider">Screen</p>
                  <p className="font-medium text-text-primary">{booking.show?.screen?.name}</p>
                </div>
                <div>
                  <p className="text-body-sm font-medium text-text-secondary uppercase tracking-wider">Seats</p>
                  <p className="font-medium text-text-primary font-mono">{booking.seats.join(', ')}</p>
                </div>
              </div>

              {/* QR Code Section */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-6 p-6 bg-white dark:bg-gray-900 rounded-xl border border-border">
                <div className="flex items-center gap-4">
                  <div className="w-32 h-32 bg-white p-2 rounded-lg border border-border flex-shrink-0">
                    {/* QR Code placeholder - in production, use a QR code library */}
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded">
                      <QrCode className="w-24 h-24 text-gray-900 dark:text-white" aria-hidden="true" />
                    </div>
                  </div>
                  <div>
                    <p className="text-body-sm font-medium text-text-secondary">Scan at theater</p>
                    <p className="font-mono text-body font-semibold text-text-primary">{booking.id.slice(0, 12).toUpperCase()}</p>
                    <p className="text-caption text-text-secondary">Booking ID: {booking.id}</p>
                  </div>
                </div>
                <div className="text-center sm:text-right">
                  <p className="text-body-sm text-text-secondary">Booking Status</p>
                  <Badge className="mt-1" variant={booking.status === 'confirmed' ? 'success' : 'warning'}>
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </Badge>
                </div>
              </div>

              {/* Booking Details */}
              <div className="grid gap-4 sm:grid-cols-3 mb-6">
                <div className="p-4 bg-bg-secondary rounded-xl">
                  <p className="text-body-sm font-medium text-text-secondary uppercase tracking-wider">Total Paid</p>
                  <p className="text-h3 font-bold text-brand-primary mt-1">{formatCurrency(booking.total_amount)}</p>
                </div>
                <div className="p-4 bg-bg-secondary rounded-xl">
                  <p className="text-body-sm font-medium text-text-secondary uppercase tracking-wider">Seats</p>
                  <p className="text-h3 font-bold text-text-primary mt-1">{booking.seats.length}</p>
                </div>
                <div className="p-4 bg-bg-secondary rounded-xl">
                  <p className="text-body-sm font-medium text-text-secondary uppercase tracking-wider">Booked On</p>
                  <p className="text-body font-medium text-text-primary mt-1">{formatDate(booking.created_at)}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={handleDownload}
                  isLoading={isDownloading}
                  className="flex-1"
                  leftIcon={<Download className="w-5 h-5" />}
                >
                  Download PDF Ticket
                </Button>
                <Link to="/bookings" className="btn-secondary flex-1 justify-center">
                  View All Bookings
                </Link>
              </div>

              {/* Important Notice */}
              <Card className="mt-6" padding="md" variant="default">
                <div className="flex items-start gap-3 text-body-sm text-text-secondary">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-warning" aria-hidden="true" />
                  <div>
                    <p className="font-medium text-text-primary mb-1">Important</p>
                    <ul className="space-y-1 list-disc list-inside">
                      <li>Present this ticket (digital or printed) at the theater entrance</li>
                      <li>Arrive at least 15 minutes before showtime</li>
                      <li>Carry a valid photo ID for verification</li>
                      <li>No cancellations or refunds after lock confirmation</li>
                    </ul>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </Section>
    </PageContainer>
  )
}
