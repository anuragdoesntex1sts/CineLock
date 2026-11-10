import React from 'react'
import { cn } from '../../lib/utils'

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

const sizeClasses = {
  sm: 'max-w-3xl',
  md: 'max-w-5xl',
  lg: 'max-w-7xl',
  xl: 'max-w-[90rem]',
  full: 'max-w-full',
}

export function Container({ className, size = 'lg', children, ...props }: ContainerProps) {
  return (
    <div
      className={cn('mx-auto px-4 sm:px-6 lg:px-8', sizeClasses[size], className)}
      {...props}
    >
      {children}
    </div>
  )
}

export function PageContainer({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <main className={cn('app-page py-6 sm:py-8 lg:py-10', className)} {...props}>
      <Container size="lg">{children}</Container>
    </main>
  )
}

export function Section({ className, children, ...props }: React.HTMLAttributes<HTMLElement>) {
  return (
    <section className={cn('space-y-6', className)} {...props}>
      {children}
    </section>
  )
}
