import React from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { Container, PageContainer } from '../components/layout'
import { LoginForm } from '../components/auth/AuthForms'

export function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: Location })?.from?.pathname || '/'

  return (
    <PageContainer className="auth-page">
      <Container size="sm" className="auth-shell">
        <div className="auth-intro">
          <p className="eyebrow">CINELOCK ACCOUNT</p>
          <h1>Welcome back</h1>
          <p>Sign in to continue to your bookings and tickets.</p>
        </div>

        <Card className="auth-card" padding="lg">
          <LoginForm onSuccess={() => navigate(from, { replace: true })} />
        </Card>

        <p className="auth-switch">New to CineLock? <Link to="/register">Create an account</Link></p>
      </Container>
    </PageContainer>
  )
}
