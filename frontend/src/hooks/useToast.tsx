import React, { createContext, useContext, useState, useCallback } from 'react'

export type ToastType = 'success' | 'warning' | 'danger' | 'info'

export interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface ToastContextType {
  toasts: Toast[]
  showToast: (toast: Omit<Toast, 'id'>) => string
  hideToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2, 9)
    const newToast = { ...toast, id }
    setToasts((prev) => [...prev, newToast])

    const duration = toast.duration ?? (toast.type === 'danger' ? 0 : toast.type === 'warning' ? 8000 : 4000)
    if (duration > 0) {
      setTimeout(() => {
        hideToast(id)
      }, duration)
    }
    return id
  }, [])

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, showToast, hideToast }}>
      {children}
      <ToastContainer toasts={toasts} onHide={hideToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

function ToastContainer({ toasts, onHide }: { toasts: Toast[]; onHide: (id: string) => void }) {
  if (toasts.length === 0) return null

  const typeClasses = {
    success: 'toast-success',
    warning: 'toast-warning',
    danger: 'toast-danger',
    info: 'toast-info',
  }

  const typeIcons = {
    success: (
      <svg className="w-5 h-5 text-success flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    warning: (
      <svg className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    danger: (
      <svg className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5 text-brand-primary flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto animate-slide-in ${typeClasses[toast.type]}`}
          role="alert"
          aria-live={toast.type === 'danger' ? 'assertive' : 'polite'}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">{typeIcons[toast.type]}</div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-text-primary">{toast.title}</p>
              {toast.message && (
                <p className="mt-0.5 text-body-sm text-text-secondary">{toast.message}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {toast.action && (
                <button
                  onClick={() => {
                    toast.action.onClick()
                    onHide(toast.id)
                  }}
                  className="text-caption font-medium text-brand-primary hover:underline"
                >
                  {toast.action.label}
                </button>
              )}
              <button
                onClick={() => onHide(toast.id)}
                className="text-text-muted hover:text-text-primary transition-colors p-1"
                aria-label="Dismiss"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}