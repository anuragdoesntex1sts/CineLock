import React, { useEffect, useState } from 'react'
import { Clock, AlertCircle } from 'lucide-react'
import { cn, parseIsoUtcTimestamp } from '../../lib/utils'

interface LockCountdownProps {
  expiresAt: string | null
  onExpire?: () => void
  size?: 'sm' | 'md' | 'lg'
}

export function LockCountdown({ expiresAt, onExpire, size = 'md' }: LockCountdownProps) {
  const [timeLeft, setTimeLeft] = useState(0)
  const [isExpired, setIsExpired] = useState(false)

  useEffect(() => {
    if (!expiresAt) {
      setTimeLeft(0)
      setIsExpired(false)
      return
    }

    const calculateTimeLeft = () => {
      const now = new Date().getTime()
      const expiry = parseIsoUtcTimestamp(expiresAt)
      const diff = Math.max(0, expiry - now)
      setTimeLeft(diff)
      setIsExpired(diff === 0)

      if (diff === 0 && onExpire) {
        onExpire()
      }
    }

    calculateTimeLeft()
    const interval = setInterval(calculateTimeLeft, 1000)
    return () => clearInterval(interval)
  }, [expiresAt, onExpire])

  if (timeLeft === 0 && !isExpired) return null

  const minutes = Math.floor(timeLeft / 60000)
  const seconds = Math.floor((timeLeft % 60000) / 1000)
  const formatted = `${minutes}:${seconds.toString().padStart(2, '0')}`

  const isWarning = timeLeft > 0 && timeLeft <= 60000 // Less than 1 minute
  const isCritical = timeLeft > 0 && timeLeft <= 30000 // Less than 30 seconds

  const sizeClasses = {
    sm: 'text-caption px-2 py-1 gap-1',
    md: 'text-body-sm px-3 py-1.5 gap-2',
    lg: 'text-body px-4 py-2 gap-2',
  }

  const iconSize = { sm: 12, md: 14, lg: 16 }[size]

  return (
    <div
      className={cn(
        'inline-flex items-center font-mono tabular-nums font-medium rounded-full',
        sizeClasses[size],
        isCritical
          ? 'bg-danger-light text-danger animate-pulse'
          : isWarning
          ? 'bg-warning-light text-warning'
          : 'bg-brand-light text-brand-primary'
      )}
      role="timer"
      aria-live={isWarning || isCritical ? 'assertive' : 'polite'}
      aria-label={`Seat lock expires in ${formatted}`}
    >
      <Clock className={cn('flex-shrink-0', `w-${iconSize} h-${iconSize}`)} aria-hidden="true" />
      <span>{formatted}</span>
      {isCritical && (
        <AlertCircle className={cn('flex-shrink-0 animate-pulse', `w-${iconSize} h-${iconSize}`)} aria-hidden="true" />
      )}
    </div>
  )
}

export function LockCountdownBanner({
  expiresAt,
  onExpire,
  message = 'Complete your booking before the lock expires',
}: {
  expiresAt: string | null
  onExpire?: () => void
  message?: string
}) {
  const [timeLeft, setTimeLeft] = useState(0)
  const [isExpired, setIsExpired] = useState(false)

  useEffect(() => {
    if (!expiresAt) return

    const calculateTimeLeft = () => {
      const now = new Date().getTime()
      const expiry = parseIsoUtcTimestamp(expiresAt)
      const diff = Math.max(0, expiry - now)
      setTimeLeft(diff)
      setIsExpired(diff === 0)
      if (diff === 0 && onExpire) onExpire()
    }

    calculateTimeLeft()
    const interval = setInterval(calculateTimeLeft, 1000)
    return () => clearInterval(interval)
  }, [expiresAt, onExpire])

  if (timeLeft === 0 && !isExpired) return null

  const minutes = Math.floor(timeLeft / 60000)
  const seconds = Math.floor((timeLeft % 60000) / 1000)
  const formatted = `${minutes}:${seconds.toString().padStart(2, '0')}`
  const isWarning = timeLeft <= 60000
  const isCritical = timeLeft <= 30000

  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 z-40 px-4 py-3 border-b border-border',
        isCritical ? 'bg-danger-light border-danger animate-pulse' : isWarning ? 'bg-warning-light border-warning' : 'bg-brand-light border-brand-primary'
      )}
      role="status"
      aria-live={isCritical ? 'assertive' : 'polite'}
    >
      <div className="mx-auto max-w-7xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Clock className={cn('w-5 h-5 flex-shrink-0', isCritical ? 'text-danger animate-pulse' : isWarning ? 'text-warning' : 'text-brand-primary')} aria-hidden="true" />
          <span className="font-mono tabular-nums text-body font-semibold">
            {isExpired ? 'Lock expired' : `Lock expires in ${formatted}`}
          </span>
        </div>
        <p className="text-body-sm text-text-secondary flex-1 text-center">{message}</p>
        {isExpired && (
          <span className="text-body-sm font-medium text-danger">Seats released</span>
        )}
      </div>
    </div>
  )
}
