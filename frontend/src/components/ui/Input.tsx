import React from 'react'
import { cn } from '../../lib/utils'

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string
  error?: string
  helperText?: string
  size?: 'sm' | 'md' | 'lg'
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, size = 'md', leftIcon, rightIcon, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    const errorId = `${inputId}-error`
    const helperId = `${inputId}-helper`

    const sizeClasses = {
      sm: 'input-sm',
      md: 'input-md',
      lg: 'input-lg',
    }

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="label">
            {label}
            {props.required && <span className="text-danger ml-1" aria-hidden="true">*</span>}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'input',
              sizeClasses[size],
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              error && 'input-error',
              className
            )}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-text-muted">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p id={errorId} className="error-text" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={helperId} className="helper-text">
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'