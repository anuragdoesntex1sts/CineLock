import React from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Clock } from 'lucide-react'
import { cn } from '../../lib/utils'
import type { Theater, Show } from '../../types/api'
import { formatTime, formatDate } from '../../lib/utils'

interface TheaterCardProps {
  theater: Theater
  shows: Show[]
  selectedDate: string
  onShowSelect: (show: Show) => void
  isLoading?: boolean
}

export function TheaterCard({ theater, shows, selectedDate, onShowSelect, isLoading = false }: TheaterCardProps) {
  if (isLoading) {
    return (
      <div className="card p-4">
        <div className="space-y-3">
          <div className="h-5 w-48 bg-bg-tertiary rounded animate-pulse-slow" />
          <div className="h-4 w-64 bg-bg-tertiary rounded animate-pulse-slow" />
          <div className="flex gap-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex-1 h-10 bg-bg-tertiary rounded animate-pulse-slow" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (shows.length === 0) {
    return (
      <div className="card p-6 text-center">
        <p className="text-text-secondary">No shows available for this date</p>
      </div>
    )
  }

  return (
    <article className="card-hover">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-brand-light flex items-center justify-center">
          <MapPin className="w-6 h-6 text-brand-primary" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-h3 font-semibold text-text-primary truncate">{theater.name}</h3>
              <p className="mt-1 text-body-sm text-text-secondary flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
                {theater.location}
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label={`${theater.name} showtimes`}>
            {shows.map((show) => (
              <button
                key={show.id}
                type="button"
                onClick={() => onShowSelect(show)}
                className="btn-secondary btn-sm whitespace-nowrap transition-all hover:bg-brand-light hover:text-brand-primary hover:border-brand-primary"
              >
                {formatTime(show.start_time)}
                <span className="ml-1.5 px-1.5 py-0.5 bg-bg-secondary rounded text-caption font-mono tabular-nums">
                  {show.price.toFixed(0)}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </article>
  )
}