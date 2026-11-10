import { Check } from 'lucide-react'

const steps = ['Showtime', 'Seats', 'Confirm', 'Payment']

export function BookingProgress({ current, complete = false }: { current: number; complete?: boolean }) {
  return <nav className="booking-progress" aria-label="Booking progress"><ol>
    {steps.map((step, index) => {
      const number = index + 1
      const done = complete || number < current
      const active = !complete && number === current
      return <li key={step} className={done ? 'done' : active ? 'active' : ''} aria-current={active ? 'step' : undefined}>
        <span className="progress-marker">{done ? <Check aria-hidden="true" /> : number}</span><span>{step}</span>
      </li>
    })}
  </ol></nav>
}
