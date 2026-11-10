import React from 'react'
import { cn } from '../../lib/utils'
import { Lock, TicketCheck } from 'lucide-react'
import type { Seat, SeatStatus } from '../../types/api'

interface SeatProps {
  seat: Seat
  onClick: (seatId: string) => void
  isSelected: boolean
  disabled?: boolean
  size?: number
  showTooltip?: boolean
}

const statusClasses: Record<SeatStatus, string> = {
  available: 'border-2 border-success bg-success-light hover:brightness-95',
  selected: 'border-2 border-selected bg-selected-light scale-110',
  locked: 'border-2 border-warning bg-warning-light cursor-not-allowed',
  booked: 'border-2 border-danger bg-danger-light cursor-not-allowed',
  disabled: 'border-2 border-border bg-bg-tertiary cursor-not-allowed',
  wheelchair: 'border-2 border-border bg-bg-tertiary',
}

const statusIcons: Record<SeatStatus, React.ReactNode> = {
  available: null,
  selected: <TicketCheck className="w-4 h-4 stroke-selected" aria-hidden="true" />,
  locked: <Lock className="w-3.5 h-3.5 stroke-warning" aria-hidden="true" />,
  booked: <TicketCheck className="w-4 h-4 stroke-danger" aria-hidden="true" />,
  disabled: null,
  wheelchair: null,
}

const statusLabels: Record<SeatStatus, string> = {
  available: 'Available',
  selected: 'Selected',
  locked: 'Locked',
  booked: 'Booked',
  disabled: 'Not available',
  wheelchair: 'Wheelchair accessible',
}

export function Seat({
  seat,
  onClick,
  isSelected,
  disabled = false,
  size = 24,
  showTooltip = true,
}: SeatProps) {
  const isInteractive = seat.status === 'available' || seat.status === 'selected'
  const isWheelchair = seat.is_wheelchair

  const handleClick = () => {
    if (isInteractive && !disabled) {
      onClick(seat.id)
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if ((event.key === 'Enter' || event.key === ' ') && isInteractive && !disabled) {
      event.preventDefault()
      onClick(seat.id)
    }
  }

  const baseClass = cn(
    'seat rounded-t-md',
    statusClasses[seat.status],
    isWheelchair && 'seat-wheelchair',
    disabled && 'opacity-50',
    'focus-visible:seat-focus',
    'touch-target'
  )

  const seatStyle: React.CSSProperties = {
    width: size,
    height: size,
    flexShrink: 0,
  }

  return (
    <div
      className="relative"
      style={{ width: size + 8, height: size + 8 }}
    >
      <button
        type="button"
        className={baseClass}
        style={seatStyle}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        disabled={disabled || !isInteractive}
        aria-label={`${statusLabels[seat.status]}, Row ${seat.row}, Seat ${seat.number}`}
        aria-pressed={isSelected}
        aria-disabled={disabled || !isInteractive}
        tabIndex={isInteractive && !disabled ? 0 : -1}
      >
        {isWheelchair && (
          <svg className="w-full h-full text-text-muted" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
            <path d="M12 8v8M9 12h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        )}
        {statusIcons[seat.status] && (
          <span className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
            {statusIcons[seat.status]}
          </span>
        )}
      </button>

      {showTooltip && seat.lock_expires_at && seat.status === 'locked' && (
        <div
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-warning text-white text-[10px] font-medium rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-20"
          role="tooltip"
          aria-label={`Lock expires in`}
        >
          🔒 Locked
        </div>
      )}
    </div>
  )
}
