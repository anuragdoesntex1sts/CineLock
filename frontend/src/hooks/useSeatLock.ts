import { useState, useEffect, useCallback, useRef } from 'react'
import { bookingApi } from '../lib/api'
import type { SeatLockRequest, SeatLockResponse, Seat, SeatStatus } from '../types/api'
import { useAuth } from './useAuth'
import { useToast } from './useToast'
import { timeUntil, formatCountdown } from '../lib/utils'

interface UseSeatLockOptions {
  showId: string
  initialSeats?: Seat[]
  enabled?: boolean
  pollInterval?: number // ms when active locks
  idlePollInterval?: number // ms when no active locks
}

interface UseSeatLockReturn {
  seats: Seat[]
  selectedSeats: Seat[]
  lockedSeats: Seat[]
  bookedSeats: Seat[]
  lockToken: string | null
  isLocking: boolean
  isConfirming: boolean
  selectSeat: (seatId: string) => void
  deselectSeat: (seatId: string) => void
  clearSelection: () => void
  lockSeats: () => Promise<SeatLockResponse | null>
  confirmBooking: (lockToken: string) => Promise<void>
  refreshSeatMap: () => Promise<void>
  lockCountdown: Record<string, string> // seatId -> formatted countdown
}

export function useSeatLock({
  showId,
  initialSeats = [],
  enabled = true,
  pollInterval = 2000,
  idlePollInterval = 10000,
}: UseSeatLockOptions): UseSeatLockReturn {
  const { user } = useAuth()
  const { showToast } = useToast()

  const [seats, setSeats] = useState<Seat[]>(initialSeats)
  const [selectedSeatIds, setSelectedSeatIds] = useState<Set<string>>(new Set())
  const [lockToken, setLockToken] = useState<string | null>(null)
  const [isLocking, setIsLocking] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const [lockExpiries, setLockExpiries] = useState<Record<string, number>>({})

  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const hasActiveLocksRef = useRef(false)

  // Derived state
  const selectedSeats = seats.filter((s) => selectedSeatIds.has(s.id))
  const lockedSeats = seats.filter((s) => s.status === 'locked')
  const bookedSeats = seats.filter((s) => s.status === 'booked')

  // Lock countdown for display
  const lockCountdown: Record<string, string> = {}
  Object.entries(lockExpiries).forEach(([seatId, expiry]) => {
    const remaining = timeUntil(new Date(expiry).toISOString())
    if (remaining > 0) {
      lockCountdown[seatId] = formatCountdown(remaining)
    }
  })

  // Update seat statuses from server data
  const updateSeatsFromServer = useCallback((serverSeats: Seat[]) => {
    setSeats((prev) => {
      const serverMap = new Map(serverSeats.map((s) => [s.id, s]))
      return prev.map((seat) => {
        const serverSeat = serverMap.get(seat.id)
        if (!serverSeat) return seat

        // Preserve local selection for available seats
        if (selectedSeatIds.has(seat.id) && serverSeat.status === 'available') {
          return { ...serverSeat, status: 'selected' as SeatStatus }
        }
        return serverSeat
      })
    })
  }, [selectedSeatIds])

  // Fetch seat map from server
  const refreshSeatMap = useCallback(async () => {
    if (!showId) return
    try {
      const response = await bookingApi.getMyBookings() // This would be showApi.getSeatMap(showId)
      // For now, we'll use a different approach - the seat map comes from showApi
    } catch (err) {
      console.error('Failed to refresh seat map:', err)
    }
  }, [showId])

  // Polling function
  const poll = useCallback(async () => {
    if (!showId || !enabled) return

    try {
      // In a real implementation, this would call showApi.getSeatMap(showId)
      // For now, we'll simulate by checking lock expiries locally
      const now = Date.now()
      let hasLocks = false

      setLockExpiries((prev) => {
        const updated: Record<string, number> = {}
        Object.entries(prev).forEach(([seatId, expiry]) => {
          if (expiry > now) {
            updated[seatId] = expiry
            hasLocks = true
          }
        })
        return updated
      })

      hasActiveLocksRef.current = hasLocks
    } catch (err) {
      console.error('Polling error:', err)
    }
  }, [showId, enabled])

  // Start/stop polling
  useEffect(() => {
    if (!enabled) return

    const interval = hasActiveLocksRef.current ? pollInterval : idlePollInterval
    pollIntervalRef.current = setInterval(poll, interval)

    // Initial poll
    poll()

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [enabled, poll, pollInterval, idlePollInterval])

  // Seat selection handlers
  const selectSeat = useCallback((seatId: string) => {
    const seat = seats.find((s) => s.id === seatId)
    if (!seat || seat.status !== 'available') return

    setSelectedSeatIds((prev) => {
      const next = new Set(prev)
      if (next.size >= 8) {
        showToast({
          type: 'warning',
          title: 'Maximum seats reached',
          message: 'You can select up to 8 seats at a time',
        })
        return prev
      }
      next.add(seatId)
      return next
    })

    // Optimistic update
    setSeats((prev) =>
      prev.map((s) => (s.id === seatId ? { ...s, status: 'selected' as SeatStatus } : s))
    )
  }, [seats, showToast])

  const deselectSeat = useCallback((seatId: string) => {
    setSelectedSeatIds((prev) => {
      const next = new Set(prev)
      next.delete(seatId)
      return next
    })

    setSeats((prev) =>
      prev.map((s) => (s.id === seatId ? { ...s, status: 'available' as SeatStatus } : s))
    )
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedSeatIds(new Set())
    setSeats((prev) =>
      prev.map((s) => (s.status === 'selected' ? { ...s, status: 'available' as SeatStatus } : s))
    )
  }, [])

  // Lock seats
  const lockSeats = useCallback(async (): Promise<SeatLockResponse | null> => {
    if (!user || selectedSeatIds.size === 0) return null

    setIsLocking(true)
    try {
      const seatIds = Array.from(selectedSeatIds)
      const response = await bookingApi.lockSeats({
        show_id: showId,
        seats: seatIds,
        user_id: user.id || '',
      })

      const { lock_token, expires_at, seats: lockedSeatIds } = response.data
      setLockToken(lock_token)

      // Update local state with lock expiries
      const expiryTime = new Date(expires_at).getTime()
      setLockExpiries((prev) => {
        const updated = { ...prev }
        lockedSeatIds.forEach((id) => {
          updated[id] = expiryTime
        })
        return updated
      })

      // Update seat statuses to locked
      setSeats((prev) =>
        prev.map((s) =>
          lockedSeatIds.includes(s.id) ? { ...s, status: 'locked' as SeatStatus, lock_expires_at: expires_at } : s
        )
      )

      clearSelection()

      showToast({
        type: 'success',
        title: 'Seats locked',
        message: `Seats locked for ${formatCountdown(timeUntil(expires_at))}. Complete booking before lock expires.`,
      })

      return response.data
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } }
      showToast({
        type: 'danger',
        title: 'Lock failed',
        message: error.response?.data?.detail || 'Could not lock seats. They may have been booked by someone else.',
      })
      // Revert optimistic updates
      clearSelection()
      return null
    } finally {
      setIsLocking(false)
    }
  }, [user, showId, selectedSeatIds, showToast, clearSelection])

  // Confirm booking
  const confirmBooking = useCallback(async (token: string) => {
    if (!user || selectedSeatIds.size === 0) return

    setIsConfirming(true)
    try {
      const seatIds = Array.from(selectedSeatIds)
      await bookingApi.confirm({
        show_id: showId,
        seats: seatIds,
        lock_token: token,
      })

      showToast({
        type: 'success',
        title: 'Booking confirmed!',
        message: 'Your seats have been booked. Proceed to payment.',
      })

      // Update seats to booked
      setSeats((prev) =>
        prev.map((s) => (seatIds.includes(s.id) ? { ...s, status: 'booked' as SeatStatus } : s))
      )

      clearSelection()
      setLockToken(null)
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } }
      showToast({
        type: 'danger',
        title: 'Booking failed',
        message: error.response?.data?.detail || 'Could not confirm booking. Please try again.',
      })
    } finally {
      setIsConfirming(false)
    }
  }, [user, showId, selectedSeatIds, showToast, clearSelection])

  return {
    seats,
    selectedSeats,
    lockedSeats,
    bookedSeats,
    lockToken,
    isLocking,
    isConfirming,
    selectSeat,
    deselectSeat,
    clearSelection,
    lockSeats,
    confirmBooking,
    refreshSeatMap,
    lockCountdown,
  }
}