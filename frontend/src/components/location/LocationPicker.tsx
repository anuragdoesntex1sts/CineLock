import React from 'react'
import { Loader2, LocateFixed, MapPin, Search } from 'lucide-react'
import { locationApi } from '../../lib/api'
import type { PlaceSuggestion } from '../../types/api'
import { useLocationSelection } from '../../hooks/useLocationSelection'

export function LocationPicker() {
  const { location, setLocation } = useLocationSelection()
  const [query, setQuery] = React.useState('')
  const [results, setResults] = React.useState<PlaceSuggestion[]>([])
  const [isSearching, setIsSearching] = React.useState(false)
  const [isLocating, setIsLocating] = React.useState(false)
  const [error, setError] = React.useState('')

  React.useEffect(() => {
    const text = query.trim()
    if (text.length < 2) {
      setResults([])
      setIsSearching(false)
      return
    }
    let current = true
    const timer = window.setTimeout(async () => {
      setIsSearching(true)
      setError('')
      try {
        const response = await locationApi.search(text)
        if (current) setResults(response.data.results)
      } catch {
        if (current) setError('Location search is unavailable right now.')
      } finally {
        if (current) setIsSearching(false)
      }
    }, 350)
    return () => {
      current = false
      window.clearTimeout(timer)
    }
  }, [query])

  const chooseLocation = (next: PlaceSuggestion) => {
    setLocation(next)
    setQuery('')
    setResults([])
    setError('')
  }

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Location detection is not supported by this browser.')
      return
    }
    setIsLocating(true)
    setError('')
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      try {
        const response = await locationApi.reverse(coords.latitude, coords.longitude)
        chooseLocation(response.data)
      } catch {
        setError('Could not identify your location. Try searching for a place instead.')
      } finally {
        setIsLocating(false)
      }
    }, () => {
      setError('Location access was unavailable. Search for your area instead.')
      setIsLocating(false)
    }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 })
  }

  return (
    <div className="location-control">
      <div className="location-current">
        <MapPin aria-hidden="true" />
        <div><span>Showing cinemas near</span><strong>{location?.city || location?.label || 'Choose your location'}</strong></div>
      </div>
      <div className="location-search-wrap">
        <label className="location-search">
          <Search aria-hidden="true" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search city or neighborhood" aria-label="Search city or neighborhood" autoComplete="off" />
          {isSearching && <Loader2 className="location-spinner" aria-label="Searching" />}
        </label>
        {results.length > 0 && <ul className="location-results" role="listbox" aria-label="Location suggestions">
          {results.map((result) => <li key={`${result.latitude}-${result.longitude}`}>
            <button type="button" role="option" onClick={() => chooseLocation(result)}><MapPin aria-hidden="true" /><span>{result.label}</span></button>
          </li>)}
        </ul>}
      </div>
      <button type="button" className="location-detect" onClick={useCurrentLocation} disabled={isLocating}>
        {isLocating ? <Loader2 className="location-spinner" aria-hidden="true" /> : <LocateFixed aria-hidden="true" />}
        {isLocating ? 'Finding you…' : 'Use my location'}
      </button>
      {error && <p className="location-error" role="status">{error}</p>}
    </div>
  )
}
