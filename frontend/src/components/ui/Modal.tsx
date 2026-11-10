import React, { useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../lib/utils'
import { X } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  showCloseButton?: boolean
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-4xl',
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
}: ModalProps) {
  const handleEscape = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape' && closeOnEscape) {
        onClose()
      }
    },
    [closeOnEscape, onClose]
  )

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, handleEscape])

  if (!isOpen) return null

  const modalContent = (
    <div className="modal-overlay" onClick={closeOnOverlayClick ? onClose : undefined} role="presentation" />
  )

  const modalDialog = (
    <div
      className={cn('modal-content w-full mx-4', sizeClasses[size])}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
      aria-describedby={description ? 'modal-description' : undefined}
      onClick={(e) => e.stopPropagation()}
    >
      {(title || showCloseButton) && (
        <div className="flex items-start justify-between border-b border-border p-4">
          <div>
            {title && (
              <h2 id="modal-title" className="text-h3 font-semibold text-text-primary">
                {title}
              </h2>
            )}
            {description && (
              <p id="modal-description" className="mt-1 text-body-sm text-text-secondary">
                {description}
              </p>
            )}
          </div>
          {showCloseButton && (
            <button
              onClick={onClose}
              className="btn-ghost btn-sm p-1 rounded-md hover:bg-bg-tertiary text-text-secondary hover:text-text-primary"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  )

  return createPortal(
    <>
      {modalContent}
      {modalDialog}
    </>,
    document.body
  )
}

interface SheetProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  children: React.ReactNode
  height?: 'auto' | 'half' | 'full' | '90vh'
}

const heightClasses = {
  auto: 'max-h-[90vh]',
  half: 'h-[50vh] max-h-[90vh]',
  full: 'h-[90vh] max-h-[90vh]',
  '90vh': 'h-[90vh] max-h-[90vh]',
}

export function Sheet({ isOpen, onClose, title, description, children, height = 'auto' }: SheetProps) {
  const handleEscape = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    },
    [onClose]
  )

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, handleEscape])

  if (!isOpen) return null

  return createPortal(
    <>
      <div className="modal-overlay" onClick={onClose} role="presentation" />
      <div
        className={cn('sheet w-full', heightClasses[height])}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'sheet-title' : undefined}
        aria-describedby={description ? 'sheet-description' : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || description) && (
          <div className="flex items-start justify-between border-b border-border p-4 sticky top-0 bg-bg-primary z-10">
            <div className="pr-4">
              {title && (
                <h2 id="sheet-title" className="text-h3 font-semibold text-text-primary">
                  {title}
                </h2>
              )}
              {description && (
                <p id="sheet-description" className="mt-1 text-body-sm text-text-secondary">
                  {description}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="btn-ghost btn-sm p-1 rounded-md hover:bg-bg-tertiary text-text-secondary hover:text-text-primary flex-shrink-0"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        <div className="p-4 pb-safe">{children}</div>
      </div>
    </>,
    document.body
  )
}