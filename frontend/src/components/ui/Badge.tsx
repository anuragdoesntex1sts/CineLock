import React from 'react'
import { cn } from '../../lib/utils'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'selected' | 'default'
  size?: 'sm' | 'md'
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', children, ...props }, ref) => {
    const variantClasses = {
      default: 'badge bg-bg-tertiary text-text-primary border border-border',
      primary: 'badge-primary',
      success: 'badge-success',
      warning: 'badge-warning',
      danger: 'badge-danger',
      selected: 'badge-selected',
    }

    const sizeClasses = {
      sm: 'px-2 py-0.5 text-[0.625rem]',
      md: 'px-2.5 py-0.5 text-caption',
    }

    return (
      <span
        ref={ref}
        className={cn(variantClasses[variant], sizeClasses[size], className)}
        {...props}
      >
        {children}
      </span>
    )
  }
)

Badge.displayName = 'Badge'