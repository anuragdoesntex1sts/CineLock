import React from 'react'
import { Link } from 'react-router-dom'
import { Clock, Film } from 'lucide-react'
import { cn } from '../../lib/utils'
import type { Movie } from '../../types/api'
import { Skeleton } from '../ui/Skeleton'

interface MovieCardProps { movie: Movie; variant?: 'default' | 'compact'; isLoading?: boolean }

export function MovieCard({ movie, variant = 'default', isLoading = false }: MovieCardProps) {
  if (isLoading) return <article className="movie-card-skeleton"><Skeleton variant="rectangular" className="aspect-[2/3] w-full rounded-xl" /><div className="p-3"><Skeleton variant="text" width="80%" /><Skeleton variant="text" width="52%" className="mt-2" /></div></article>

  const posterUrl = movie.poster_url
  return <Link to={`/movie/${movie.id}`} className={cn('movie-card', variant === 'compact' && 'compact')} aria-label={`View ${movie.title}`}>
    <div className="movie-poster">
      {posterUrl ? <img src={posterUrl} alt={`${movie.title} poster`} loading="lazy" /> : <div className="poster-fallback"><Film aria-hidden="true" /><span>{movie.title}</span></div>}
      <span className="poster-genre">{movie.genre}</span>
      <span className="poster-cta">View details <span aria-hidden="true">↗</span></span>
    </div>
    <div className="movie-card-copy"><h3>{movie.title}</h3><p><Clock aria-hidden="true" />{movie.duration_min} min <span>·</span> {movie.genre}</p></div>
  </Link>
}
