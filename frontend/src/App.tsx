import React, { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Header } from './components/layout/Header'
import { PageContainer } from './components/layout/Container'
import { Skeleton, SkeletonCard } from './components/ui/Skeleton'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import { useAuth } from './hooks/useAuth'
import { LocationProvider } from './hooks/useLocationSelection'

// Lazy load pages for code splitting
const Home = lazy(() => import('./pages/Home').then((m) => ({ default: m.Home })))
const MovieDetail = lazy(() => import('./pages/MovieDetail').then((m) => ({ default: m.MovieDetail })))
const ShowSelection = lazy(() => import('./pages/ShowSelection').then((m) => ({ default: m.ShowSelection })))
const SeatMap = lazy(() => import('./pages/SeatMap').then((m) => ({ default: m.SeatMapPage })))
const BookingConfirm = lazy(() => import('./pages/BookingConfirm').then((m) => ({ default: m.BookingConfirm })))
const Payment = lazy(() => import('./pages/Payment').then((m) => ({ default: m.PaymentPage })))
const Ticket = lazy(() => import('./pages/Ticket').then((m) => ({ default: m.TicketPage })))
const MyBookings = lazy(() => import('./pages/MyBookings').then((m) => ({ default: m.MyBookings })))
const Login = lazy(() => import('./pages/Login').then((m) => ({ default: m.Login })))
const Register = lazy(() => import('./pages/Register').then((m) => ({ default: m.Register })))

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <PageContainer>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </PageContainer>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: window.location.pathname }} />
  }

  return <>{children}</>
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return null
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <LocationProvider>
      <div className="min-h-screen bg-bg-primary flex flex-col">
        <Header />
        <div className="flex-1">{children}</div>
      </div>
    </LocationProvider>
  )
}

function PageSkeleton() {
  return (
    <PageContainer>
      <div className="space-y-6">
        <Skeleton variant="text" className="h-8 w-48" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    </PageContainer>
  )
}

export default function App() {
  return (
    <AppLayout>
      <ErrorBoundary>
        <Suspense fallback={<PageSkeleton />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/movie/:id" element={<MovieDetail />} />
            <Route path="/show/:id" element={<ShowSelection />} />
            <Route path="/booking/:showId" element={<SeatMap />} />
            <Route path="/booking/:showId/confirm" element={<BookingConfirm />} />
            <Route path="/payment/:bookingId" element={<Payment />} />
            <Route path="/ticket/:bookingId" element={<Ticket />} />
            <Route
              path="/bookings"
              element={
                <ProtectedRoute>
                  <MyBookings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/login"
              element={
                <PublicOnlyRoute>
                  <Login />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicOnlyRoute>
                  <Register />
                </PublicOnlyRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </AppLayout>
  )
}
