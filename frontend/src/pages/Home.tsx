import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, Film, LockKeyhole, TicketCheck, ArrowRight, MapPin, Clock } from 'lucide-react'
import { cn } from '../lib/utils'
import { MovieCarousel } from '../components/movie'
import { PageContainer, Section } from '../components/layout'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { SkeletonCard } from '../components/ui/Skeleton'
import { movieApi, nearbyTheaterApi, showApi } from '../lib/api'
import type { Movie, NearbyTheater, Show } from '../types/api'
import { useLocationSelection } from '../hooks/useLocationSelection'
import { LocationPicker } from '../components/location/LocationPicker'

const GENRES = ['All', 'Action', 'Adventure', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Thriller', 'Romance', 'Animation']

export function Home() {
  const [movies, setMovies] = useState<Movie[]>([])
  const [filteredMovies, setFilteredMovies] = useState<Movie[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGenre, setSelectedGenre] = useState('All')
  const [error, setError] = useState<string | null>(null)
  const { location } = useLocationSelection()
  const [nearbyTheaters, setNearbyTheaters] = useState<NearbyTheater[]>([])
  const [shows, setShows] = useState<Show[]>([])
  const [isLoadingNearby, setIsLoadingNearby] = useState(Boolean(location))
  const [nearbyError, setNearbyError] = useState('')

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setIsLoading(true)
        const response = await movieApi.list()
        setMovies(response.data)
        setFilteredMovies(response.data)
        setError(null)
      } catch {
        setError('We couldn’t load the movies right now.')
      } finally {
        setIsLoading(false)
      }
    }
    fetchMovies()
  }, [])

  useEffect(() => {
    if (!location) {
        setNearbyTheaters([])
        setShows([])
        setIsLoadingNearby(false)
      return
    }
    if (movies.length === 0) {
      setIsLoadingNearby(!error)
      if (error) setNearbyError('Load the movie list before checking demo cinema schedules.')
      return
    }
    let current = true
    const loadNearby = async () => {
      setIsLoadingNearby(true)
      setNearbyError('')
      try {
        const theaterResponse = await nearbyTheaterApi.list(location, movies[0].id)
        const showResponse = await showApi.list({ movie_id: movies[0].id, limit: 1000 })
        if (!current) return
        setNearbyTheaters(theaterResponse.data.theaters)
        setShows(showResponse.data)
      } catch {
        if (current) setNearbyError('Could not load cinemas near this location.')
      } finally {
        if (current) setIsLoadingNearby(false)
      }
    }
    loadNearby()
    return () => { current = false }
  }, [location, movies, error])

  useEffect(() => {
    let result = movies
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter((movie) => movie.title.toLowerCase().includes(query) || movie.genre.toLowerCase().includes(query) || movie.description.toLowerCase().includes(query))
    }
    if (selectedGenre !== 'All') result = result.filter((movie) => movie.genre.toLowerCase().includes(selectedGenre.toLowerCase()))
    setFilteredMovies(result)
  }, [movies, searchQuery, selectedGenre])

  const featured = movies[0]
  const heroImage = featured?.backdrop_url || featured?.poster_url

  return (
    <PageContainer className="home-page">
      <div className="home-topline"><span className="eyebrow"><MapPin aria-hidden="true" /> Your next movie night</span><span className="venue-note">Browse films · choose a show · pick your seats</span></div>
      <LocationPicker />

      {featured && !searchQuery && selectedGenre === 'All' && <section className="featured-movie" aria-label="Featured movie" style={heroImage ? { backgroundImage: `linear-gradient(90deg, var(--hero-scrim) 0%, var(--hero-scrim) 38%, transparent 100%), linear-gradient(0deg, var(--hero-scrim) 0%, transparent 64%), url("${heroImage}")` } : undefined}>
        <div className="featured-copy">
          <p className="featured-kicker"><span className="live-dot" /> Now showing</p>
          <h1>{featured.title}</h1>
          <div className="featured-meta"><span>{featured.genre}</span><span className="meta-separator">·</span><span><Clock aria-hidden="true" />{featured.duration_min} min</span></div>
          <p className="featured-description">{featured.description}</p>
          <div className="featured-actions"><Link to={`/movie/${featured.id}`} className="featured-cta">Find showtimes <ArrowRight aria-hidden="true" /></Link><a className="text-link" href="#now-showing">Explore all movies</a></div>
        </div>
        <div className="featured-caption"><Film aria-hidden="true" /> In theaters now</div>
      </section>}

      {location && <Section className="nearby-section" aria-label="Nearby cinemas">
        <div className="discovery-heading"><div><p className="eyebrow">In your selected city</p><h2>All cinemas in {location.city || location.label}</h2></div><span className="movie-count">{isLoadingNearby ? 'Loading cinemas…' : `${nearbyTheaters.length} ${nearbyTheaters.length === 1 ? 'cinema' : 'cinemas'}`}</span></div>
        {isLoadingNearby ? <p className="nearby-status">Finding cinemas and showtimes…</p> : nearbyError ? <p className="nearby-status" role="status">{nearbyError}</p> : nearbyTheaters.length === 0 ? <div className="nearby-empty"><MapPin aria-hidden="true" /><p>No cinemas were found in this city.</p></div> : <div className="nearby-grid">
          {nearbyTheaters.map((theater) => {
            const theaterShows = shows.filter((show) => show.theater_id === theater.theater_id)
            const movieIds = [...new Set(theaterShows.map((show) => show.movie_id))]
            const hasDemoShows = theaterShows.some((show) => show.is_demo)
            const firstMovie = movies.find((movie) => movieIds.includes(movie.id))
            return <article className="nearby-card" key={theater.id}>
              <div className="nearby-card-icon"><Film aria-hidden="true" /></div>
              <div className="nearby-card-copy"><h3>{theater.name}</h3><p><MapPin aria-hidden="true" />{theater.address}{theater.city ? `, ${theater.city}` : ''}</p><span>{theater.distance_km} km from city center · {movieIds.length ? `${movieIds.length} ${movieIds.length === 1 ? 'movie' : 'movies'} with ${hasDemoShows ? 'demo ' : ''}showtimes` : 'CineLock showtimes not listed'}</span></div>
              {firstMovie && theater.theater_id && <Link className="nearby-link" to={`/movie/${firstMovie.id}?theater=${theater.theater_id}`}>View showtimes <ArrowRight aria-hidden="true" /></Link>}
            </article>
          })}
        </div>}
      </Section>}

      <Section className="discovery-section">
        <div className="discovery-heading"><div><p className="eyebrow">Find your next watch</p><h2>Movies in theaters</h2></div><span className="movie-count">{isLoading ? 'Loading…' : `${filteredMovies.length} ${filteredMovies.length === 1 ? 'movie' : 'movies'}`}</span></div>
        <div className="discovery-tools">
          <div className="movie-search"><Search aria-hidden="true" /><Input placeholder="Search by movie or genre" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} aria-label="Search movies" size="md" /></div>
          <div className="genre-list" role="group" aria-label="Filter by genre">
            {GENRES.map((genre) => <button key={genre} type="button" onClick={() => setSelectedGenre(genre)} className={cn('genre-chip', selectedGenre === genre && 'selected')} aria-pressed={selectedGenre === genre}>{genre}</button>)}
          </div>
        </div>

        {isLoading ? <div className="movie-loading-grid">{Array.from({ length: 5 }, (_, index) => <SkeletonCard key={index} />)}</div> : error ? <div className="empty-state"><Film aria-hidden="true" /><h3>Movies are taking a break</h3><p>{error}</p><Button onClick={() => window.location.reload()}>Try again</Button></div> : filteredMovies.length === 0 ? <div className="empty-state"><Search aria-hidden="true" /><h3>No movies match that search</h3><p>Try another title or choose a different genre.</p><button className="text-link" onClick={() => { setSearchQuery(''); setSelectedGenre('All') }}>Clear filters</button></div> : <div id="now-showing"><MovieCarousel title="Now showing" movies={filteredMovies} variant="compact" /></div>}
      </Section>

      <section className="how-it-works" aria-label="How CineLock works">
        <div className="how-copy"><p className="eyebrow">A smoother way to book</p><h2>From screen to seat in a few steps.</h2><p>Pick a showtime, choose your seats, and see your reservation stay protected while you check out.</p></div>
        <div className="how-steps"><div><span>01</span><Film aria-hidden="true" /><strong>Choose a movie</strong><small>Browse current releases and showtimes.</small></div><div><span>02</span><LockKeyhole aria-hidden="true" /><strong>Lock your seats</strong><small>Your seats are held while you complete booking.</small></div><div><span>03</span><TicketCheck aria-hidden="true" /><strong>Get your ticket</strong><small>Download your ticket after checkout.</small></div></div>
      </section>
    </PageContainer>
  )
}
