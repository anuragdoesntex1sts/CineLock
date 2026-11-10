import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock, User as UserIcon } from 'lucide-react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'

interface LoginFormProps {
  onSuccess?: () => void
}

export function LoginForm({ onSuccess }: LoginFormProps = {}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { login, isLoading: authLoading } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: Location })?.from?.pathname || '/'

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!email) newErrors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Invalid email format'
    if (!password) newErrors.password = 'Password is required'
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    try {
      await login(email, password)
      showToast({ type: 'success', title: 'Welcome back!', message: 'You have been logged in successfully' })
      if (onSuccess) {
        onSuccess()
      } else {
        navigate(from, { replace: true })
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } }
      showToast({
        type: 'danger',
        title: 'Login failed',
        message: error.response?.data?.detail || 'Invalid email or password',
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <Input
        label="Email"
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
        leftIcon={<Mail className="w-5 h-5" />}
        autoComplete="email"
        required
        disabled={authLoading}
      />

      <div className="relative">
        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          leftIcon={<Lock className="w-5 h-5" />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-text-muted hover:text-text-primary"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          }
          autoComplete="current-password"
          required
          disabled={authLoading}
        />
      </div>

      <Button type="submit" className="w-full btn-lg" isLoading={authLoading}>
        Sign In
      </Button>
    </form>
  )
}

interface RegisterFormProps {
  onSuccess?: () => void
}

export function RegisterForm({ onSuccess }: RegisterFormProps = {}) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { register, isLoading: authLoading } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!fullName.trim()) newErrors.fullName = 'Name is required'
    if (!email) newErrors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Invalid email format'
    if (!password) newErrors.password = 'Password is required'
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters'
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    try {
      await register(email, password, fullName.trim())
      showToast({ type: 'success', title: 'Account created!', message: 'Welcome to CineLock' })
      if (onSuccess) {
        onSuccess()
      } else {
        navigate('/')
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } }
      showToast({
        type: 'danger',
        title: 'Registration failed',
        message: error.response?.data?.detail || 'Could not create account',
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <Input
        label="Full name"
        type="text"
        placeholder="Your name"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        error={errors.fullName}
        leftIcon={<UserIcon className="w-5 h-5" />}
        autoComplete="name"
        required
        disabled={authLoading}
      />
      <Input
        label="Email"
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
        leftIcon={<Mail className="w-5 h-5" />}
        autoComplete="email"
        required
        disabled={authLoading}
      />

      <div className="relative">
        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          leftIcon={<Lock className="w-5 h-5" />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-text-muted hover:text-text-primary"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          }
          autoComplete="new-password"
          required
          disabled={authLoading}
          helperText="At least 6 characters"
        />
      </div>

      <Input
        label="Confirm Password"
        type={showPassword ? 'text' : 'password'}
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        error={errors.confirmPassword}
        leftIcon={<Lock className="w-5 h-5" />}
        autoComplete="new-password"
        required
        disabled={authLoading}
      />

      <Button type="submit" className="w-full btn-lg" isLoading={authLoading}>
        Create Account
      </Button>
    </form>
  )
}
