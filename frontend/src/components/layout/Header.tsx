import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Menu, X, Sun, Moon, Monitor, Film, Ticket, LogOut, User, ChevronDown } from 'lucide-react'
import { cn } from '../../lib/utils'

type ThemeMode = 'light' | 'dark' | 'system'

function getInitialTheme(): ThemeMode {
  const saved = localStorage.getItem('theme')
  return saved === 'light' || saved === 'dark' || saved === 'system' ? saved : 'system'
}

export function Header() {
  const location = useLocation()
  const { user, isAuthenticated, logout } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = React.useState(false)
  const [theme, setTheme] = React.useState<ThemeMode>(getInitialTheme)

  React.useEffect(() => {
    const root = document.documentElement
    root.dataset.theme = theme
    root.style.colorScheme = theme === 'system' ? 'light dark' : theme
    localStorage.setItem('theme', theme)
  }, [theme])

  React.useEffect(() => setIsMenuOpen(false), [location.pathname])

  const navLinks = [
    { path: '/', label: 'Movies', icon: Film },
    { path: '/bookings', label: 'My bookings', icon: Ticket, auth: true },
  ]

  const ThemeIcon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor

  return (
    <header className="site-header">
      <nav className="site-nav" aria-label="Main navigation">
        <div className="site-nav-main">
          <Link to="/" className="brand-mark" aria-label="CineLock home">
            <span className="brand-icon"><Film aria-hidden="true" /></span>
            <span>Cine<span>Lock</span></span>
          </Link>

          <div className="desktop-nav">
            {navLinks.map((link) => {
              if (link.auth && !isAuthenticated) return null
              const active = link.path === '/' ? location.pathname === '/' : location.pathname.startsWith(link.path)
              const Icon = link.icon
              return <Link key={link.path} to={link.path} aria-current={active ? 'page' : undefined} className={cn('nav-link', active && 'active')}><Icon aria-hidden="true" />{link.label}</Link>
            })}
          </div>
        </div>

        <div className="site-nav-actions">
          <label className="theme-control">
            <ThemeIcon aria-hidden="true" />
            <span className="sr-only">Color theme</span>
            <select value={theme} onChange={(event) => setTheme(event.target.value as ThemeMode)} aria-label="Color theme">
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
            <ChevronDown aria-hidden="true" className="theme-chevron" />
          </label>

          {isAuthenticated ? (
            <div className="account-actions">
              <Link to="/bookings" className="account-link"><User aria-hidden="true" /><span>{user?.email?.split('@')[0]}</span></Link>
              <button onClick={logout} className="account-link logout-link"><LogOut aria-hidden="true" /><span>Log out</span></button>
            </div>
          ) : (
            <div className="account-actions"><Link to="/login" className="login-link">Log in</Link><Link to="/register" className="signup-link">Create account</Link></div>
          )}

          <button className="mobile-menu-button" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-expanded={isMenuOpen} aria-controls="mobile-menu" aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}>
            {isMenuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
        </div>

        {isMenuOpen && <div id="mobile-menu" className="mobile-menu">
          {navLinks.map((link) => {
            if (link.auth && !isAuthenticated) return null
            const Icon = link.icon
            return <Link key={link.path} to={link.path} className="mobile-nav-link"><Icon aria-hidden="true" />{link.label}</Link>
          })}
          {!isAuthenticated && <><Link to="/login" className="mobile-nav-link">Log in</Link><Link to="/register" className="mobile-nav-link">Create account</Link></>}
        </div>}
      </nav>
    </header>
  )
}
