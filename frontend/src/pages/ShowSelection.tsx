import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Clock, Film, MapPin, Calendar, ChevronLeft, ArrowRight, Star } from 'lucide-react'
import { cn } from '../lib/utils'
import { formatDate, formatTime, formatCurrency } from '../lib/utils'
import { Container, PageContainer, Section } from '../components/layout'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Card } from '../components/ui/Card'
import { Skeleton, SkeletonText } from '../components/ui/Skeleton'
import { showApi } from '../lib/api'
import type { Show, Movie, Theater } from '../types/api'
import { BookingProgress } from '../components/booking/BookingProgress'

export function ShowSelection() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [show, setShow] = useState<Show | null>(null)
  const [movie, setMovie] = useState<Movie | null>(null)
  const [theater, setTheater] = useState<Theater | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return

    const fetchData = async () => {
      try {
        setIsLoading(true)
        const showRes = await showApi.get(id!)
        setShow(showRes.data)
        if (showRes.data.movie) setMovie(showRes.data.movie)
        if (showRes.data.theater) setTheater(showRes.data.theater)
        setError(null)
      } catch (err) {
        setError('Failed to load show details')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [id])

  if (isLoading) {
    return (
      <PageContainer>
        <Skeleton variant="text" className="h-8 w-64 mb-8" />
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton variant="rectangular" className="aspect-[2/3] w-full rounded-lg" />
          <div className="md:col-span-2 space-y-6">
            <SkeletonText lines={3} />
            <SkeletonText lines={2} />
          </div>
        </div>
      </PageContainer>
    )
  }

  if (error || !show) {
    return (
      <PageContainer>
        <div className="card p-12 text-center">
          <Film className="w-12 h-12 mx-auto text-text-muted mb-4" aria-hidden="true" />
          <h2 className="text-h2 font-semibold text-text-primary mb-2">Show not found</h2>
          <p className="text-text-secondary mb-6">{error || 'The show you\'re looking for doesn\'t exist'}</p>
          <Link to="/" className="btn-primary">Browse Movies</Link>
        </div>
      </PageContainer>
    )
  }

  // Use nested data if available, otherwise fetch separately
  const movieData = movie || show.movie
  const theaterData = theater || show.theater

  const posterUrl = movieData?.poster_url || `https://via.placeholder.com/400x600/1a1a2e/e50914?text=${encodeURIComponent(movieData?.title || 'Movie')}`

  return (
    <PageContainer>
      <BookingProgress current={1} />
      {show.is_demo && <div className="mb-4"><Badge variant="warning">Demo schedule · mock booking data</Badge></div>}
      {/* Back navigation */}
      <Link to={`/movie/${movieData?.id || show.movie_id}`} className="inline-flex items-center gap-2 text-body-sm text-text-secondary hover:text-brand-primary mb-6">
        <ChevronLeft className="w-4 h-4" aria-hidden="true" />
        Back
      </Link>

      <Section className="mb-8">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Poster & Quick Info */}
          <div className="md:col-span-1">
            <div className="sticky top-24 space-y-6">
              <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-bg-tertiary">
                <img
                  src={posterUrl}
                  alt={`${movieData?.title || 'Movie'} poster`}
                  className="w-full h-full object-cover"
                />
                {movieData?.genre && (
                  <div className="absolute top-4 right-4">
                    <Badge variant="primary">{movieData.genre}</Badge>
                  </div>
                )}
              </div>

              <div className="card p-4 space-y-3">
                {movieData && (
                  <div className="flex items-center gap-2 text-body-sm">
                    <Clock className="w-4 h-4 text-text-muted" aria-hidden="true" />
                    <span>{movieData.duration_min} min</span>
                  </div>
                )}
                {movieData && (
                  <div className="flex items-center gap-2 text-body-sm">
                    <Film className="w-4 h-4 text-text-muted" aria-hidden="true" />
                    <span>{movieData.genre}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-border space-y-2">
                  <div className="flex justify-between text-body-sm">
                    <span className="text-text-secondary">Date</span>
                    <span className="font-medium text-text-primary">{formatDate(show.start_time)}</span>
                  </div>
                  <div className="flex justify-between text-body-sm">
                    <span className="text-text-secondary">Time</span>
                    <span className="font-medium text-text-primary">{formatTime(show.start_time)}</span>
                  </div>
                  {theaterData && (
                    <div className="flex justify-between text-body-sm">
                      <span className="text-text-secondary">Theater</span>
                      <span className="font-medium text-text-primary truncate max-w-[140px]">{theaterData.name}</span>
                    </div>
                  )}
                  {show.screen && (
                    <div className="flex justify-between text-body-sm">
                      <span className="text-text-secondary">Screen</span>
                      <span className="font-medium text-text-primary">{show.screen.name}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-body-sm">
                    <span className="text-text-secondary">Price</span>
                    <span className="font-medium text-text-primary">{formatCurrency(show.price)} per seat</span>
                  </div>
                </div>

                <Button className="w-full" size="lg" onClick={() => navigate(`/booking/${show.id}`)}>
                  Select Seats
                  <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
                </Button>
              </div>
            </div>
          </div>

          {/* Movie Details & Theater Info */}
          <div className="md:col-span-2 space-y-8">
            {/* Movie Info */}
            {movieData && (
              <div>
                <h1 className="text-display font-bold text-text-primary">{movieData.title}</h1>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-body-sm text-text-secondary">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" aria-hidden="true" />
                    {movieData.duration_min} min
                  </span>
                  <Badge variant="primary">{movieData.genre}</Badge>
                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4" aria-hidden="true" />
                    8.5/10
                  </span>
                </div>

                <p className="mt-6 text-body text-text-secondary leading-relaxed">{movieData.description}</p>
              </div>
            )}

            {/* Show Details */}
            <div className="card p-6">
              <h2 className="text-h2 font-semibold text-text-primary mb-4">Show Details</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <h3 className="text-body-sm font-medium text-text-secondary uppercase tracking-wider">Movie</h3>
                  <p className="font-medium text-text-primary">{movieData?.title || 'Loading...'}</p>
                </div>
                <div>
                  <h3 className="text-body-sm font-medium text-text-secondary uppercase tracking-wider">Date & Time</h3>
                  <p className="font-medium text-text-primary">{formatDate(show.start_time)} at {formatTime(show.start_time)}</p>
                </div>
                {theaterData && (
                  <div>
                    <h3 className="text-body-sm font-medium text-text-secondary uppercase tracking-wider">Theater</h3>
                    <p className="font-medium text-text-primary">{theaterData.name}</p>
                  </div>
                )}
                {theaterData && (
                  <div>
                    <h3 className="text-body-sm font-medium text-text-secondary uppercase tracking-wider">Location</h3>
                    <p className="font-medium text-text-primary flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                      {theaterData.location}
                    </p>
                  </div>
                )}
                {show.screen && (
                  <div>
                    <h3 className="text-body-sm font-medium text-text-secondary uppercase tracking-wider">Screen</h3>
                    <p className="font-medium text-text-primary">{show.screen.name} • {show.screen.rows} rows × {show.screen.cols} seats</p>
                  </div>
                )}
                <div>
                  <h3 className="text-body-sm font-medium text-text-secondary uppercase tracking-wider">Price</h3>
                  <p className="font-medium text-text-primary">{formatCurrency(show.price)} per seat</p>
                </div>
              </div>
            </div>

            {/* Theater Info */}
            {theaterData && (
              <div className="card p-6">
                <h2 className="text-h2 font-semibold text-text-primary mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5" aria-hidden="true" />
                  Theater Information
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <h3 className="text-body-sm font-medium text-text-secondary uppercase tracking-wider">Name</h3>
                    <p className="font-medium text-text-primary">{theaterData.name}</p>
                  </div>
                  <div>
                    <h3 className="text-body-sm font-medium text-text-secondary uppercase tracking-wider">Location</h3>
                    <p className="font-medium text-text-primary">{theaterData.location}</p>
                  </div>
                  <div>
                    <h3 className="text-body-sm font-medium text-text-secondary uppercase tracking-wider">Screens</h3>
                    <p className="font-medium text-text-primary">{theaterData.screens.length} screen{theaterData.screens.length !== 1 ? 's' : ''}</p>
                  </div>
                  <div>
                    <h3 className="text-body-sm font-medium text-text-secondary uppercase tracking-wider">Total Capacity</h3>
                    <p className="font-medium text-text-primary">
                      {theaterData.screens.reduce((sum, s) => sum + s.rows * s.cols, 0)} seats
                    </p>
                  </div>
                </div>

                {theaterData.screens.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-body-sm font-medium text-text-secondary uppercase tracking-wider mb-3">Screens</h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {theaterData.screens.map((screen) => (
                        <div key={screen.id} className="p-3 bg-bg-secondary rounded-lg border border-border">
                          <div className="flex justify-between">
                            <span className="font-medium text-text-primary">{screen.name}</span>
                            <Badge variant="default">{screen.rows} × {screen.cols} = {screen.rows * screen.cols} seats</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Section>
    </PageContainer>
  )
}
