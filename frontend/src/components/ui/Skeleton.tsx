import React from 'react'
import { cn } from '../../lib/utils'

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular' | 'card'
  width?: string | number
  height?: string | number
}

export function Skeleton({ className, variant = 'rectangular', width, height, ...props }: SkeletonProps) {
  const variantClasses = {
    text: 'skeleton-text',
    circular: 'skeleton rounded-full',
    rectangular: 'skeleton',
    card: 'skeleton-card',
  }

  return (
    <div
      className={cn(variantClasses[variant], className)}
      style={{ width, height }}
      {...props}
      aria-hidden="true"
    />
  )
}

export interface SkeletonTextProps extends React.HTMLAttributes<HTMLDivElement> {
  lines?: number
}

export function SkeletonText({ lines = 3, className, ...props }: SkeletonTextProps) {
  return (
    <div className={cn('space-y-2', className)} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} variant="text" width={i === lines - 1 ? '60%' : '100%' } />
      ))}
    </div>
  )
}

export function SkeletonCard({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('card', className)} {...props}>
      <Skeleton variant="rectangular" className="aspect-video w-full rounded-md mb-4" />
      <SkeletonText lines={2} />
      <div className="mt-4 flex gap-2">
        <Skeleton variant="rectangular" width="80px" height="36px" />
        <Skeleton variant="rectangular" width="80px" height="36px" />
      </div>
    </div>
  )
}