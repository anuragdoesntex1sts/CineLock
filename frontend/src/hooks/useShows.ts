import { useState, useEffect, useCallback } from 'react'
import { showApi, theaterApi } from '../lib/api'
import type { Show, Theater, SeatMap } from '../types/api'

export function useShows(params?: { movie_id?: string; theater_id?: string; date?: string }) {
  const [shows, setShows] = useState<Show[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchShows = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await showApi.list(params)
      setShows(response.data)
      setError(null)
    } catch (err) {
      setError(err as Error)
    } finally {
      setIsLoading(false)
    }
  }, [params?.movie_id, params?.theater_id, params?.date])

  useEffect(() => {
    fetchShows()
  }, [fetchShows])

  return { shows, isLoading, error, refetch: fetchShows }
}

export function useShow(id: string) {
  const [show, setShow] = useState<Show | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!id) return
    const fetchShow = async () => {
      try {
        setIsLoading(true)
        const response = await showApi.get(id)
        setShow(response.data)
        setError(null)
      } catch (err) {
        setError(err as Error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchShow()
  }, [id])

  return { show, isLoading, error }
}

export function useTheaters() {
  const [theaters, setTheaters] = useState<Theater[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchTheaters = async () => {
      try {
        setIsLoading(true)
        const response = await theaterApi.list()
        setTheaters(response.data)
        setError(null)
      } catch (err) {
        setError(err as Error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchTheaters()
  }, [])

  return { theaters, isLoading, error }
}

export function useSeatMap(showId: string) {
  const [seatMap, setSeatMap] = useState<SeatMap | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchSeatMap = useCallback(async () => {
    if (!showId) return
    try {
      setIsLoading(true)
      const response = await showApi.getSeatMap(showId)
      setSeatMap(response.data)
      setError(null)
    } catch (err) {
      setError(err as Error)
    } finally {
      setIsLoading(false)
    }
  }, [showId])

  useEffect(() => {
    fetchSeatMap()
  }, [fetchSeatMap])

  return { seatMap, isLoading, error, refetch: fetchSeatMap }
}