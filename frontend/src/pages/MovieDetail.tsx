import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Clock, Film, Star, MapPin, Calendar, ChevronLeft, ArrowRight } from 'lucide-react'
import { cn } from '../lib/utils'
import { formatDate, formatTime, formatCurrency } from '../lib/utils'
import { Container, PageContainer, Section } from '../components/layout'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Card } from '../components/ui/Card'
import { Skeleton, SkeletonText, SkeletonCard } from '../components/ui/Skeleton'
import { movieApi, nearbyTheaterApi, showApi, theaterApi } from '../lib/api'
import type { Movie, Show, Theater } from '../types/api'
import { useLocationSelection } from '../hooks/useLocationSelection'
import { LocationPicker } from '../components/location/LocationPicker'

function localDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function MovieDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { location } = useLocationSelection()
  const [movie, setMovie] = useState<Movie | null>(null)
  const [shows, setShows] = useState<Show[]>([])
  const [theaters, setTheaters] = useState<Theater[]>([])
  const [selectedDate, setSelectedDate] = useState(() => localDateKey(new Date()))
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Generate dates for next 7 days
  const dates = React.useMemo(() => {
    const result: string[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    for (let i = 0; i < 7; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      result.push(localDateKey(date))
    }
    return result
  }, [])

  useEffect(() => {
    if (!id) return
    let current = true

    const fetchData = async () => {
      try {
        setIsLoading(true)
        if (location) await nearbyTheaterApi.list(location, id).catch(() => undefined)
        const [movieRes, showsRes, theatersRes] = await Promise.all([
          movieApi.get(id),
          showApi.list({ movie_id: id, limit: 1000 }),
          theaterApi.list(),
        ])
        if (!current) return
        setMovie(movieRes.data)
        setShows(showsRes.data)
        setTheaters(theatersRes.data)
        setError(null)
      } catch (err) {
        if (current) setError('Failed to load movie details')
      } finally {
        if (current) setIsLoading(false)
      }
    }

    fetchData()
    return () => { current = false }
  }, [id, location])

  // Filter shows by selected date
  const theatersInSelectedCity = location?.city
    ? theaters.filter((theater) => theater.city?.trim().toLocaleLowerCase() === location.city.trim().toLocaleLowerCase())
    : theaters
  const cityTheaterIds = new Set(theatersInSelectedCity.map((theater) => theater.id))
  const showsInSelectedCity = location?.city ? shows.filter((show) => cityTheaterIds.has(show.theater_id)) : shows
  const filteredShows = showsInSelectedCity.filter((show) => show.start_time.startsWith(selectedDate))

  // Group shows by theater
  const showsByTheater = React.useMemo(() => {
    const map = new Map<string, Show[]>()
    filteredShows.forEach((show) => {
      if (!map.has(show.theater_id)) {
        map.set(show.theater_id, [])
      }
      map.get(show.theater_id)!.push(show)
    })
    return map
  }, [filteredShows])

  const requestedTheater = searchParams.get('theater')
  const showsForCurrentCinema = showsInSelectedCity.filter((show) => !requestedTheater || show.theater_id === requestedTheater)
  const hasAnyShowsForSelection = showsForCurrentCinema.length > 0
  const theatersWithShows = theaters.filter((t) => showsByTheater.has(t.id) && (!requestedTheater || t.id === requestedTheater))

  const scrollToTheaterChoice = () => {
    document.getElementById('theater-showtimes')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleShowSelect = (show: Show) => {
    navigate(`/show/${show.id}`)
  }

  if (isLoading) {
    return (
      <PageContainer>
        <Skeleton variant="text" className="h-8 w-64 mb-8" />
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton variant="rectangular" className="aspect-[2/3] w-full rounded-lg" />
          <div className="md:col-span-2 space-y-6">
            <SkeletonText lines={3} />
            <SkeletonText lines={2} />
            <div className="grid gap-4 sm:grid-cols-2">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          </div>
        </div>
      </PageContainer>
    )
  }

  if (error || !movie) {
    return (
      <PageContainer>
        <div className="card p-12 text-center">
          <Film className="w-12 h-12 mx-auto text-text-muted mb-4" aria-hidden="true" />
          <h2 className="text-h2 font-semibold text-text-primary mb-2">Movie not found</h2>
          <p className="text-text-secondary mb-6">{error || 'The movie you\'re looking for doesn\'t exist'}</p>
          <Link to="/" className="btn-primary">Browse Movies</Link>
        </div>
      </PageContainer>
    )
  }

  const posterUrl = movie.poster_url || `https://via.placeholder.com/400x600/1a1a2e/e50914?text=${encodeURIComponent(movie.title)}`

  return (
    <PageContainer>
      {/* Back navigation */}
      <Link to="/" className="inline-flex items-center gap-2 text-body-sm text-text-secondary hover:text-brand-primary mb-6">
        <ChevronLeft className="w-4 h-4" aria-hidden="true" />
        Back to Movies
      </Link>
      <LocationPicker />

      <Section className="mb-8">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Poster & Info */}
          <div className="md:col-span-1">
            <div className="sticky top-24 space-y-6">
              <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-bg-tertiary">
                <img
                  src={posterUrl}
                  alt={`${movie.title} poster`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 right-4">
                  <Badge variant="primary">{movie.genre}</Badge>
                </div>
              </div>

              <div className="card p-4 space-y-3">
                <div className="flex items-center gap-2 text-body-sm">
                  <Clock className="w-4 h-4 text-text-muted" aria-hidden="true" />
                  <span>{movie.duration_min} min</span>
                </div>
                <div className="flex items-center gap-2 text-body-sm">
                  <Film className="w-4 h-4 text-text-muted" aria-hidden="true" />
                  <span>{movie.genre}</span>
                </div>
                <div className="pt-2 border-t border-border">
                  <Button className="w-full" size="lg" onClick={scrollToTheaterChoice} disabled={!hasAnyShowsForSelection}>
                    Choose Cinema & Showtime
                    <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Details & Showtimes */}
          <div className="md:col-span-2 space-y-8">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-display font-bold text-text-primary">{movie.title}</h1>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-body-sm text-text-secondary">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" aria-hidden="true" />
                      {movie.duration_min} min
                    </span>
                    <Badge variant="primary">{movie.genre}</Badge>
                  </div>
                </div>
              </div>

              <p className="text-body text-text-secondary leading-relaxed">{movie.description}</p>
            </div>

            <div id="theater-showtimes" className="theater-showtimes" tabIndex={-1}>
            {/* Date Selector */}
            <div>
              <h2 className="text-h2 font-semibold text-text-primary mb-4">Select Date</h2>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2" role="group" aria-label="Select show date">
                {dates.map((date) => {
                  const dateObj = new Date(date)
                  const isSelected = date === selectedDate
                  const isToday = date === localDateKey(new Date())
                  const hasShows = showsInSelectedCity.some((s) => s.start_time.startsWith(date) && (!requestedTheater || s.theater_id === requestedTheater))
                  return (
                    <button
                      key={date}
                      type="button"
                      onClick={() => setSelectedDate(date)}
                      disabled={!hasShows}
                      className={cn(
                        'flex flex-col items-center gap-1 px-4 py-3 rounded-lg transition-all min-w-[72px]',
                        isSelected
                          ? 'bg-brand-primary text-white'
                          : hasShows
                          ? 'bg-bg-secondary text-text-primary hover:bg-bg-tertiary'
                          : 'bg-bg-tertiary text-text-muted cursor-not-allowed'
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
                      {!hasShows && <span className="text-[10px] text-text-muted">No shows</span>}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Theaters & Showtimes */}
            {theatersWithShows.length === 0 ? (
              <div className="card p-8 text-center">
                <Calendar className="w-12 h-12 mx-auto text-text-muted mb-4" aria-hidden="true" />
                <h3 className="text-h3 font-semibold text-text-primary mb-2">{location?.city && !hasAnyShowsForSelection ? `No ${movie.title} showtimes in ${location.city}` : 'No shows for this date'}</h3>
                <p className="text-text-secondary">{location?.city && !hasAnyShowsForSelection ? 'CineLock does not have show schedules for this city and movie yet.' : 'Select a different date to see available showtimes'}</p>
              </div>
            ) : (
              <div className="space-y-6" role="list" aria-label="Theaters with showtimes">
                {theatersWithShows.map((theater) => (
                  <article key={theater.id} className="card p-4" role="listitem">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <h3 className="text-h3 font-semibold text-text-primary">{theater.name}</h3>
                        <p className="mt-1 text-body-sm text-text-secondary flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
                          {theater.location}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-body-sm text-text-secondary">
                        <span className="px-2 py-1 bg-bg-tertiary rounded font-mono tabular-nums">
                          {showsByTheater.get(theater.id)?.length || 0} shows
                        </span>
                        {showsByTheater.get(theater.id)?.some((show) => show.is_demo) && <Badge variant="warning" size="sm">Demo schedule</Badge>}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2" role="group" aria-label={`${theater.name} showtimes`}>
                      {showsByTheater.get(theater.id)?.map((show) => (
                        <button
                          key={show.id}
                          type="button"
                          onClick={() => handleShowSelect(show)}
                          className="btn-secondary btn-sm h-auto min-w-[100px] flex-col items-start gap-1 whitespace-nowrap py-2 transition-all hover:bg-brand-light hover:text-brand-primary hover:border-brand-primary"
                        >
                          <span>{formatTime(show.start_time)}</span>
                          <span className="px-1.5 py-0.5 bg-bg-secondary rounded text-caption font-mono tabular-nums">
                            {formatCurrency(show.price)}
                          </span>
                          {show.screen_name && <span className="text-[10px] text-text-muted">{show.screen_name}</span>}
                        </button>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            )}
            </div>
          </div>
        </div>
      </Section>
    </PageContainer>
  )
}
