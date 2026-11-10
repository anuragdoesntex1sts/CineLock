import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { Container, PageContainer } from '../components/layout'
import { RegisterForm } from '../components/auth/AuthForms'

export function Register() {
  const navigate = useNavigate()

  return (
    <PageContainer className="auth-page">
      <Container size="sm" className="auth-shell">
        <div className="auth-intro">
          <p className="eyebrow">CINELOCK ACCOUNT</p>
          <h1>Create your account</h1>
          <p>Set up your account to reserve seats and keep your tickets together.</p>
        </div>

        <Card className="auth-card" padding="lg">
          <RegisterForm onSuccess={() => navigate('/')} />
        </Card>

        <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
      </Container>
    </PageContainer>
  )
}
