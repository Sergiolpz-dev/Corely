import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { CalendarPage } from '@/dashboard/pages/calendar/CalendarPage'

const renderCalendarPage = () =>
  render(
    <MemoryRouter>
      <CalendarPage />
    </MemoryRouter>
  )

describe('CalendarPage', () => {
  it('renderiza el encabezado "Calendario"', () => {
    renderCalendarPage()
    expect(screen.getByText('Calendario')).toBeInTheDocument()
  })

  it('muestra el botón de nuevo evento', () => {
    renderCalendarPage()
    expect(
      screen.getByRole('button', { name: /nuevo evento/i })
    ).toBeInTheDocument()
  })
})
