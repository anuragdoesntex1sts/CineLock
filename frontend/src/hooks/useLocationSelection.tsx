import React, { createContext, useContext, useMemo, useState } from 'react'
import type { PlaceSuggestion } from '../types/api'

const STORAGE_KEY = 'cinelock-location'
type SelectedLocation = PlaceSuggestion

function readSavedLocation(): SelectedLocation | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return null
    const parsed = JSON.parse(saved) as SelectedLocation
    return Number.isFinite(parsed.latitude) && Number.isFinite(parsed.longitude) ? parsed : null
  } catch {
    return null
  }
}

const LocationContext = createContext<{
  location: SelectedLocation | null
  setLocation: (location: SelectedLocation | null) => void
} | null>(null)

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [location, setCurrentLocation] = useState<SelectedLocation | null>(readSavedLocation)
  const setLocation = (next: SelectedLocation | null) => {
    setCurrentLocation(next)
    if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    else localStorage.removeItem(STORAGE_KEY)
  }
  const value = useMemo(() => ({ location, setLocation }), [location])
  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>
}

export function useLocationSelection() {
  const context = useContext(LocationContext)
  if (!context) throw new Error('useLocationSelection must be used within LocationProvider')
  return context
}
