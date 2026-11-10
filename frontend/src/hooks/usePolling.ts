import { useEffect, useRef, useCallback } from 'react'

interface UsePollingOptions {
  enabled?: boolean
  interval?: number
  onPoll: () => Promise<void>
  immediate?: boolean
}

export function usePolling({ enabled = true, interval = 5000, onPoll, immediate = true }: UsePollingOptions) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isPollingRef = useRef(false)

  const poll = useCallback(async () => {
    if (isPollingRef.current || !enabled) return
    isPollingRef.current = true
    try {
      await onPoll()
    } finally {
      isPollingRef.current = false
    }
  }, [enabled, onPoll])

  useEffect(() => {
    if (!enabled) return

    if (immediate) {
      poll()
    }

    intervalRef.current = setInterval(poll, interval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [enabled, interval, poll, immediate])

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const start = useCallback(() => {
    if (!intervalRef.current && enabled) {
      intervalRef.current = setInterval(poll, interval)
    }
  }, [enabled, interval, poll])

  return { stop, start, poll }
}