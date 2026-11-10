import React, { useState, useMemo } from 'react'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../../lib/utils'
import { formatDate, formatTime } from '../../lib/utils'
import type { Show, Theater } from '../../types/api'
import { TheaterCard } from './TheaterCard'

interface ShowtimePickerProps {
  shows: Show[]
  theaters: Theater[]
  selectedDate: string
  onDateChange: (date: string) => void
  onShowSelect: (show: Show) => void
  isLoading?: boolean
}

export function ShowtimePicker({ shows, theaters, selectedDate, onDateChange, onShowSelect, isLoading = false }: ShowtimePickerProps) {
  // Generate dates for next 7 days
  const dates = useMemo(() => {
    const result: string[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    for (let i = 0; i < 7; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      result.push(date.toISOString().split('T')[0])
    }
    return result
  }, [])

  // Group shows by theater
  const showsByTheater = useMemo(() => {
    const map = new Map<string, Show[]>()
    shows.forEach((show) => {
      if (!map.has(show.theater_id)) {
        map.set(show.theater_id, [])
      }
      map.get(show.theater_id)!.push(show)
    })
    return map
  }, [shows])

  // Filter theaters that have shows on selected date
  const theatersWithShows = theaters.filter((t) => showsByTheater.has(t.id))

  return (
    <div className="space-y-6">
      {/* Date picker */}
      <div className="card p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-h3 font-semibold text-text-primary">Select Date</h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const currentIndex = dates.indexOf(selectedDate)
                if (currentIndex > 0) onDateChange(dates[currentIndex - 1])
              }}
              disabled={dates.indexOf(selectedDate) === 0}
              className="btn-ghost btn-sm p-2"
              aria-label="Previous day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-1" role="group" aria-label="Date selection">
              {dates.map((date) => {
                const dateObj = new Date(date)
                const isSelected = date === selectedDate
                const isToday = date === new Date().toISOString().split('T')[0]
                return (
                  <button
                    key={date}
                    type="button"
                    onClick={() => onDateChange(date)}
                    className={cn(
                      'flex flex-col items-center gap-1 px-4 py-3 rounded-lg transition-all min-w-[64px]',
                      isSelected
                        ? 'bg-brand-primary text-white'
                        : 'bg-bg-secondary text-text-primary hover:bg-bg-tertiary'
                    )}
                    aria-pressed={isSelected}
                    aria-label={formatDate(dateObj)}
                  >
                    <span className="font-semibold text-body">{dateObj.getDate()}</span>
                    <span className="text-caption capitalize">{dateObj.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                    {isToday && !isSelected && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-brand-light text-brand-primary rounded-full">
                        Today
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
            <button
              type="button"
              onClick={() => {
                const currentIndex = dates.indexOf(selectedDate)
                if (currentIndex < dates.length - 1) onDateChange(dates[currentIndex + 1])
              }}
              disabled={dates.indexOf(selectedDate) === dates.length - 1}
              className="btn-ghost btn-sm p-2"
              aria-label="Next day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4 text-body-sm text-text-secondary">
          <span className="flex items-center gap-1">
            <Calendar className="w-4 h-4" aria-hidden="true" />
            {formatDate(new Date(selectedDate))}
          </span>
          <span className="flex items-center gap-1">
            {theatersWithShows.length} theater{theatersWithShows.length !== 1 ? 's' : ''} • {shows.length} show{shows.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Theater list */}
      <div className="space-y-4" role="list" aria-label="Theaters with showtimes">
        {theatersWithShows.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-text-secondary">No shows available for this date</p>
          </div>
        ) : (
          theatersWithShows.map((theater) => (
            <TheaterCard
              key={theater.id}
              theater={theater}
              shows={showsByTheater.get(theater.id) || []}
              selectedDate={selectedDate}
              onShowSelect={onShowSelect}
              isLoading={isLoading}
            />
          ))
        )}
      </div>
    </div>
  )
}