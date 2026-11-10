import React from 'react'
import { Lock, TicketCheck, User } from 'lucide-react'
import { cn } from '../../lib/utils'

interface ColorLegendProps {
  lockCountdown?: Record<string, string>
  selectedCount?: number
}

const legendItems = [
  { id: 'available', label: 'Available', icon: null, className: 'legend-available' },
  { id: 'selected', label: 'Selected', icon: <TicketCheck className="w-3.5 h-3.5" />, className: 'legend-selected' },
  { id: 'locked', label: 'Locked', icon: <Lock className="w-3.5 h-3.5" />, className: 'legend-locked' },
  { id: 'booked', label: 'Booked', icon: <TicketCheck className="w-3.5 h-3.5" />, className: 'legend-booked' },
  { id: 'wheelchair', label: 'Wheelchair', icon: <User className="w-3.5 h-3.5" />, className: 'legend-wheelchair' },
] as const

export function ColorLegend({ lockCountdown = {}, selectedCount = 0 }: ColorLegendProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 p-3 bg-bg-secondary rounded-lg border border-border" role="group" aria-label="Seat status legend">
      {legendItems.map((item) => {
        const countdown = item.id === 'locked' && Object.keys(lockCountdown).length > 0
          ? Object.values(lockCountdown)[0]
          : null

        return (
          <span key={item.id} className={cn('legend-item flex items-center gap-1.5', item.className)}>
            {item.icon && <span className="flex-shrink-0" aria-hidden="true">{item.icon}</span>}
            <span>{item.label}</span>
            {countdown && (
              <span className="px-1.5 py-0.5 bg-white/20 rounded text-[10px] font-mono tabular-nums">
                {countdown}
              </span>
            )}
          </span>
        )
      })}

      {selectedCount > 0 && (
        <span className="legend-selected ml-auto">
          <span className="flex items-center gap-1.5">
            <TicketCheck className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{selectedCount} Selected</span>
          </span>
        </span>
      )}
    </div>
  )
}