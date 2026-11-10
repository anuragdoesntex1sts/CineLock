import React, { useState, useCallback, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { MovieCard } from './MovieCard'
import type { Movie } from '../../types/api'
import { cn } from '../../lib/utils'

interface MovieCarouselProps {
  title: string
  movies: Movie[]
  variant?: 'default' | 'compact'
  showViewAll?: boolean
  viewAllLink?: string
  isLoading?: boolean
}

export function MovieCarousel({
  title,
  movies,
  variant = 'default',
  showViewAll = false,
  viewAllLink,
  isLoading = false,
}: MovieCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(false)

  const itemsPerView = variant === 'compact' ? 5 : 4

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const checkScroll = () => {
      setShowLeftArrow(container.scrollLeft > 10)
      setShowRightArrow(container.scrollLeft + container.clientWidth < container.scrollWidth - 10)
    }

    checkScroll()
    container.addEventListener('scroll', checkScroll, { passive: true })
    return () => container.removeEventListener('scroll', checkScroll)
  }, [])

  const scrollLeft = useCallback(() => {
    containerRef.current?.scrollBy({ left: -320, behavior: 'smooth' })
  }, [])

  const scrollRight = useCallback(() => {
    containerRef.current?.scrollBy({ left: 320, behavior: 'smooth' })
  }, [])

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index)
    containerRef.current?.scrollTo({
      left: index * 320,
      behavior: 'smooth',
    })
  }, [])

  if (isLoading) {
    return (
      <section className="space-y-4" aria-label={`${title} (loading)`}>
        <div className="flex items-center justify-between">
          <h2 className="text-h2 font-semibold text-text-primary">{title}</h2>
        </div>
        <div className="relative" role="region" aria-label="Movie carousel loading">
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4" style={{ scrollSnapType: 'x mandatory' }}>
            {[...Array(8)].map((_, i) => (
              <MovieCard key={i} movie={{} as Movie} variant={variant} isLoading={true} />
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (movies.length === 0) {
    return (
      <section className="space-y-4" aria-label={title}>
        <h2 className="text-h2 font-semibold text-text-primary">{title}</h2>
        <div className="card p-12 text-center">
          <p className="text-text-secondary">No movies found</p>
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-4" aria-label={title}>
      <div className="flex items-center justify-between">
        <h2 className="text-h2 font-semibold text-text-primary">{title}</h2>
        {showViewAll && viewAllLink && (
          <a href={viewAllLink} className="btn-ghost btn-sm text-body-sm">
            View All
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </a>
        )}
      </div>

      <div className="relative">
        {(showLeftArrow || showRightArrow) && (
          <>
            {showLeftArrow && (
              <button
                onClick={scrollLeft}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 md:-translate-x-4 z-10 btn-ghost btn-icon p-2 rounded-full bg-bg-primary/90 shadow-md hover:bg-bg-tertiary"
                aria-label="Scroll left"
                type="button"
              >
                <ChevronLeft className="w-5 h-5" aria-hidden="true" />
              </button>
            )}
            {showRightArrow && (
              <button
                onClick={scrollRight}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 md:translate-x-4 z-10 btn-ghost btn-icon p-2 rounded-full bg-bg-primary/90 shadow-md hover:bg-bg-tertiary"
                aria-label="Scroll right"
                type="button"
              >
                <ChevronRight className="w-5 h-5" aria-hidden="true" />
              </button>
            )}
          </>
        )}

        <div
          ref={containerRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-4"
          style={{ scrollSnapType: 'x mandatory' }}
          role="region"
          aria-label={`${title} carousel`}
        >
          {movies.map((movie, index) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              variant={variant}
            />
          ))}
        </div>

        {/* Scroll indicators */}
        {movies.length > itemsPerView && (
          <div className="flex justify-center gap-1.5 mt-3" role="tablist" aria-label="Carousel slides">
            {Array.from({ length: Math.ceil(movies.length / itemsPerView) }).map((_, i) => (
              <button
                key={i}
                onClick={() => goToSlide(i * itemsPerView)}
                className={cn(
                  'w-2 h-2 rounded-full transition-all duration-200',
                  currentIndex >= i * itemsPerView && currentIndex < (i + 1) * itemsPerView
                    ? 'bg-brand-primary w-6'
                    : 'bg-border hover:bg-text-muted'
                )}
                role="tab"
                aria-selected={currentIndex >= i * itemsPerView && currentIndex < (i + 1) * itemsPerView}
                aria-label={`Go to slide ${i + 1}`}
                type="button"
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}