import React, { useMemo, useCallback, useEffect, useState } from 'react'
import { cn } from '../../lib/utils'
import { formatCurrency } from '../../lib/utils'
import { Seat as SeatItem } from './Seat'
import { ColorLegend } from './ColorLegend'
import { LockCountdown, LockCountdownBanner } from './LockCountdown'
import { ScreenIndicator } from './ScreenIndicator'
import type { SeatMap, Seat } from '../../types/api'

interface SeatMapProps {
  seatMap: SeatMap | null
  selectedSeats: Seat[]
  lockedSeats: Seat[]
  bookedSeats: Seat[]
  lockCountdown: Record<string, string>
  lockToken: string | null
  onSeatClick: (seatId: string) => void
  onLockSeats: () => Promise<void>
  onConfirmBooking: () => Promise<void>
  isLocking: boolean
  isConfirming: boolean
  canLock: boolean
  canConfirm: boolean
  isLoading: boolean
  onClearSelection: () => void
}

export function SeatMapComponent({
  seatMap,
  selectedSeats,
  lockedSeats,
  bookedSeats,
  lockCountdown,
  lockToken,
  onSeatClick,
  onLockSeats,
  onConfirmBooking,
  isLocking,
  isConfirming,
  canLock,
  canConfirm,
  isLoading,
  onClearSelection,
}: SeatMapProps) {
  const [showLegend, setShowLegend] = useState(true)

  if (isLoading || !seatMap) {
    return (
      <div className="card p-8" role="status" aria-label="Loading seat map">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin-slow w-10 h-10 border-3 border-border border-t-brand-primary rounded-full" aria-hidden="true" />
          <p className="text-text-secondary">Loading seat map...</p>
        </div>
      </div>
    )
  }

  const rows = useMemo(() => {
    const rowMap = new Map<string, Seat[]>()
    seatMap.seats.forEach((seat) => {
      if (!rowMap.has(seat.row)) {
        rowMap.set(seat.row, [])
      }
      rowMap.get(seat.row)!.push(seat)
    })
    return Array.from(rowMap.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [seatMap.seats])

  const maxCols = seatMap.cols
  const aisleCols = seatMap.aisles || []

  const handleSeatClick = useCallback(
    (seatId: string) => {
      const seat = seatMap.seats.find((s) => s.id === seatId)
      if (seat && (seat.status === 'available' || seat.status === 'selected')) {
        onSeatClick(seatId)
      }
    },
    [seatMap.seats, onSeatClick]
  )

  const renderSeat = useCallback(
    (seat: Seat) => (
      <SeatItem
        key={seat.id}
        seat={seat}
        onClick={handleSeatClick}
        isSelected={selectedSeats.some((s) => s.id === seat.id)}
        disabled={seat.status !== 'available' && seat.status !== 'selected'}
        size={22}
      />
    ),
    [handleSeatClick, selectedSeats]
  )

  return (
    <div className="card overflow-hidden">
      {/* Lock countdown banner */}
      {lockToken && (
        <LockCountdownBanner
          expiresAt={lockedSeats[0]?.lock_expires_at || null}
          onExpire={() => {}}
        />
      )}

      {/* Screen indicator */}
      <ScreenIndicator screenName={seatMap.screen_name} />

      {/* Seat map */}
      <div className="hidden overflow-x-auto sm:block" role="region" aria-label="Seat selection" tabIndex={0}>
        <table className="w-full border-collapse" role="grid" aria-label="Theater seats">
          <thead>
            <tr className="hidden sm:table-row">
              <th className="w-8 text-center text-caption text-text-muted font-medium" scope="col" aria-label="Row">
                Row
              </th>
              {Array.from({ length: maxCols }, (_, i) => (
                <th
                  key={i}
                  className={cn(
                    'w-[22px] text-center text-caption text-text-muted font-medium',
                    aisleCols.includes(i) && 'pl-3'
                  )}
                  scope="col"
                  aria-label={`Seat ${i + 1}`}
                >
                  {i + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(([rowLabel, seats]) => (
              <tr key={rowLabel}>
                <th
                  className="w-8 sticky left-0 z-10 bg-bg-primary text-center text-caption font-medium text-text-secondary py-2 sm:table-cell hidden"
                  scope="row"
                  aria-label={`Row ${rowLabel}`}
                >
                  {rowLabel}
                </th>
                {seats.map((seat, colIndex) => (
                  <td
                    key={seat.id}
                    className={cn(
                      'w-[22px] h-[22px] p-0',
                      aisleCols.includes(colIndex) && 'pl-3'
                    )}
                    role="gridcell"
                    aria-label={`${rowLabel}${seat.number}`}
                  >
                    {renderSeat(seat)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile row labels */}
      <div className="sm:hidden overflow-x-auto pb-2" role="region" aria-label="Seat selection" tabIndex={0}>
        <table className="w-full border-collapse" role="grid" aria-label="Theater seats">
          <tbody>
            {rows.map(([rowLabel, seats]) => (
              <tr key={rowLabel}>
                <td className="w-8 sticky left-0 z-10 bg-bg-primary text-center text-caption font-medium text-text-secondary py-1">
                  {rowLabel}
                </td>
                {seats.map((seat, colIndex) => (
                  <td
                    key={seat.id}
                    className={cn(
                      'w-[22px] h-[22px] p-0',
                      aisleCols.includes(colIndex) && 'pl-3'
                    )}
                    role="gridcell"
                    aria-label={`${rowLabel}${seat.number}`}
                  >
                    {renderSeat(seat)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Color legend */}
      <div className="border-t border-border pt-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-body font-medium text-text-primary">Seat Status</h3>
          <button
            type="button"
            onClick={() => setShowLegend(!showLegend)}
            className="btn-ghost btn-sm text-caption"
            aria-expanded={showLegend}
          >
            {showLegend ? 'Hide' : 'Show'} Legend
          </button>
        </div>

        {showLegend && (
          <ColorLegend
            lockCountdown={lockCountdown}
            selectedCount={selectedSeats.length}
          />
        )}

        {/* Action buttons */}
        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          {lockToken ? (
            <button
              type="button"
              onClick={onConfirmBooking}
              disabled={!canConfirm || isConfirming}
              className="btn-primary btn-lg flex-1 sm:flex-none"
            >
              {isConfirming ? 'Confirming...' : 'Confirm Booking'}
            </button>
          ) : (
            <button
              type="button"
              onClick={onLockSeats}
              disabled={!canLock || isLocking || selectedSeats.length === 0}
              className="btn-primary btn-lg flex-1 sm:flex-none"
            >
              {isLocking ? 'Locking...' : `Lock ${selectedSeats.length} Seat${selectedSeats.length !== 1 ? 's' : ''}`}
            </button>
          )}

          {selectedSeats.length > 0 && !lockToken && (
            <button
              type="button"
              onClick={onClearSelection}
              className="btn-secondary btn-lg flex-1 sm:flex-none"
            >
              Clear Selection
            </button>
          )}
        </div>

        {/* Price summary */}
        {selectedSeats.length > 0 && seatMap && (
          <div className="mt-4 p-3 bg-bg-secondary rounded-lg border border-border">
            <div className="flex justify-between text-body-sm">
              <span className="text-text-secondary">{selectedSeats.length} seat(s)</span>
              <span className="font-medium text-text-primary">
                {formatCurrency(seatMap.price || 0)} × {selectedSeats.length}
              </span>
            </div>
            <div className="flex justify-between text-body font-semibold text-text-primary mt-1">
              <span>Total</span>
              <span>
                {formatCurrency(selectedSeats.length * (seatMap.price || 0))}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
