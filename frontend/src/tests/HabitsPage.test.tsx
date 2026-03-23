import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { HabitsPage } from '@/dashboard/pages/habits/HabitsPage'

const renderHabitsPage = () =>
  render(
    <MemoryRouter>
      <HabitsPage />
    </MemoryRouter>
  )

describe('HabitsPage', () => {
  it('renderiza el encabezado "Hábitos"', () => {
    renderHabitsPage()
    expect(screen.getByText('Hábitos')).toBeInTheDocument()
  })

  it('muestra el botón de nuevo hábito', () => {
    renderHabitsPage()
    expect(
      screen.getByRole('button', { name: /nuevo hábito/i })
    ).toBeInTheDocument()
  })
})
