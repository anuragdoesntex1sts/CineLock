// API Types matching backend schemas

export interface User {
  id: string
  email: string
  role: 'user' | 'admin'
  full_name?: string
  is_active?: boolean
  is_admin?: boolean
  created_at: string
  updated_at: string
}

export interface Movie {
  id: string
  title: string
  description: string
  duration_min: number
  genre: string
  poster_url: string | null
  backdrop_url?: string | null
  created_at: string
  updated_at: string
}

export interface MovieListResponse {
  movies: Movie[]
  total: number
}

export interface Screen {
  id: string
  name: string
  rows: number
  cols: number
}

export interface Theater {
  id: string
  name: string
  location: string
  city?: string
  latitude?: number | null
  longitude?: number | null
  is_demo?: boolean
  screens: Screen[]
  created_at: string
  updated_at: string
}

export interface PlaceSuggestion {
  label: string
  city: string
  latitude: number
  longitude: number
  place_id?: string | null
}

export interface NearbyTheater {
  id: string
  name: string
  address: string
  city: string
  latitude: number
  longitude: number
  distance_km: number
  theater_id?: string | null
  has_cinelock_shows: boolean
  is_demo?: boolean
}

export interface TheaterListResponse {
  theaters: Theater[]
  total: number
}

export interface Show {
  id: string
  movie_id: string
  theater_id: string
  screen_id: string
  start_time: string
  end_time?: string
  price: number
  is_demo?: boolean
  screen_name?: string
  movie_title?: string
  theater_name?: string
  created_at: string
  updated_at: string
  // Populated relations
  movie?: Movie
  theater?: Theater
  screen?: Screen
}

export interface ShowListResponse {
  shows: Show[]
  total: number
}

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled'

export interface Booking {
  id: string
  user_id: string
  show_id: string
  seats: string[]
  status: BookingStatus
  payment_status?: 'pending' | 'observed' | 'paid' | 'failed'
  payment_reference?: string
  total_amount: number
  lock_token: string | null
  created_at: string
  updated_at: string
  // Populated relations
  show?: Show
  user?: User
}

export type PaymentStatus = 'pending' | 'success' | 'failed' | 'refunded'

export interface Payment {
  id: string
  booking_id: string
  amount: number
  method: string
  status: PaymentStatus
  transaction_ref: string | null
  created_at: string
  updated_at: string
}

export interface SeatLockRequest {
  show_id: string
  seats: string[]
  user_id: string
}

export interface SeatLockResponse {
  lock_token: string
  expires_at: string
  seats: string[]
}

export interface BookingCreate {
  show_id: string
  seats: string[]
  lock_token: string
}

export interface MockPaymentRequest {
  booking_id: string
  method: 'card' | 'upi' | 'wallet'
}

export interface Token {
  access_token: string
  refresh_token?: string
  token_type: string
  expires_in?: number
}

export interface AuthResponse {
  user: {
    id: string
    email: string
    full_name: string
    is_active: boolean
    is_admin: boolean
    created_at: string
  }
  tokens: Token
}

export interface UserRegister {
  email: string
  password: string
  full_name: string
}

export interface UserLogin {
  email: string
  password: string
}

// Seat map types
export type SeatStatus = 'available' | 'selected' | 'locked' | 'booked' | 'disabled' | 'wheelchair'

export interface Seat {
  id: string
  row: string
  number: number
  status: SeatStatus
  lock_expires_at?: string
  is_wheelchair?: boolean
}

export interface SeatMap {
  show_id: string
  screen_name: string
  rows: number
  cols: number
  seats: Seat[]
  aisles: number[] // Column indices where aisle gaps exist
  price?: number
}
