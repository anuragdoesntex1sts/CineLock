import React from 'react'
import { cn } from '../../lib/utils'

interface ScreenIndicatorProps {
  screenName: string
}

export function ScreenIndicator({ screenName }: ScreenIndicatorProps) {
  return (
    <div className={cn('screen-indicator', 'relative')}>
      <svg className="absolute left-1/2 -translate-x-1/2 top-[-6px] w-3 h-3 text-text-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M4 8V4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4" />
        <path d="M4 16v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6" />
        <line x1="4" y1="12" x2="20" y2="12" />
      </svg>
      <span className="flex items-center gap-2 px-4 py-2 text-caption font-medium text-text-secondary bg-bg-secondary border-b border-border">
        {screenName}
        <span className="text-[10px]">▼</span>
      </span>
    </div>
  )
}