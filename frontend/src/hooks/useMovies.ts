import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { movieApi } from '../lib/api'
import type { Movie } from '../types/api'

// For now, we'll use a simple fetch wrapper since we don't have react-query installed
// This is a placeholder - in production, install @tanstack/react-query
export function useMovies(params?: { genre?: string; search?: string }) {
  // Simple implementation without react-query for now
  // Will be replaced with proper implementation
  return { data: undefined, isLoading: true, error: null, refetch: () => {} }
}

export function useMovie(id: string) {
  return { data: undefined, isLoading: true, error: null, refetch: () => {} }
}