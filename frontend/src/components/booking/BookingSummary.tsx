import React from 'react'
import { cn } from '../../lib/utils'
import { formatCurrency, formatDateTime } from '../../lib/utils'
import type { Booking, Show, Movie, Theater } from '../../types/api'

interface BookingSummaryProps {
  booking: Booking
  show?: Show
  movie?: Movie
  theater?: Theater
  variant?: 'default' | 'compact'
}

export function BookingSummary({ booking, show, movie, theater, variant = 'default' }: BookingSummaryProps) {
  const seats = booking.seats.join(', ')
  const showTime = show ? formatDateTime(show.start_time) : ''

  if (variant === 'compact') {
    return (
      <div className="card p-4">
        <div className="flex items-start gap-3">
          {movie?.poster_url && (
            <img
              src={movie.poster_url}
              alt={movie.title}
              className="w-16 h-24 object-cover rounded"
            />
          )}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-text-primary truncate">{movie?.title || 'Movie'}</h4>
            <p className="mt-1 text-sm text-text-secondary">{showTime}</p>
            <p className="text-sm text-text-secondary">{seats}</p>
            <p className="mt-2 font-semibold text-text-primary">{formatCurrency(booking.total_amount)}</p>
          </div>
          <span className={`badge ${booking.status === 'confirmed' ? 'badge-success' : booking.status === 'pending' ? 'badge-warning' : 'badge-danger'}`}>
            {booking.status}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="card p-6">
      <div className="flex items-start gap-4 mb-6">
        {movie?.poster_url && (
          <img
            src={movie.poster_url}
            alt={movie.title}
            className="w-24 h-36 object-cover rounded-lg flex-shrink-0"
          />
        )}
        <div className="flex-1">
          <h3 className="text-h2 font-semibold text-text-primary">{movie?.title || 'Movie'}</h3>
          <p className="mt-1 text-body-sm text-text-secondary">{movie?.genre}</p>
        </div>
        <div className="text-right">
          <span className={cn(
            'badge',
            booking.status === 'confirmed' ? 'badge-success' :
            booking.status === 'pending' ? 'badge-warning' : 'badge-danger'
          )}>
            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
          </span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <h4 className="text-body-sm font-medium text-text-secondary uppercase tracking-wider">Show Details</h4>
          <dl className="space-y-1.5">
            <div className="flex justify-between">
              <dt className="text-text-secondary">Date & Time</dt>
              <dd className="font-medium text-text-primary">{showTime}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-text-secondary">Theater</dt>
              <dd className="font-medium text-text-primary">{theater?.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-text-secondary">Screen</dt>
              <dd className="font-medium text-text-primary">{show?.screen?.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-text-secondary">Seats</dt>
              <dd className="font-medium text-text-primary font-mono">{seats}</dd>
            </div>
          </dl>
        </div>

        <div className="space-y-2">
          <h4 className="text-body-sm font-medium text-text-secondary uppercase tracking-wider">Booking Info</h4>
          <dl className="space-y-1.5">
            <div className="flex justify-between">
              <dt className="text-text-secondary">Booking ID</dt>
              <dd className="font-mono text-text-primary">{booking.id.slice(0, 8).toUpperCase()}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-text-secondary">Booked On</dt>
              <dd className="font-medium text-text-primary">{formatDateTime(booking.created_at)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-text-secondary">Lock Token</dt>
              <dd className="font-mono text-text-primary truncate max-w-[150px]">{booking.lock_token || 'N/A'}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-border">
        <div className="flex justify-between items-center">
          <span className="text-body font-medium text-text-secondary">Total Amount</span>
          <span className="text-h3 font-bold text-brand-primary">{formatCurrency(booking.total_amount)}</span>
        </div>
      </div>
    </div>
  )
}