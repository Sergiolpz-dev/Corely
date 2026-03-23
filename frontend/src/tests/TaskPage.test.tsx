import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { TaskPage } from '@/dashboard/pages/tasks/TaskPage'

const renderTaskPage = () =>
  render(
    <MemoryRouter>
      <TaskPage />
    </MemoryRouter>
  )

describe('TaskPage', () => {
  it('renderiza el encabezado "Tareas"', () => {
    renderTaskPage()
    expect(screen.getByText('Tareas')).toBeInTheDocument()
  })

  // Este test falla en la primera ejecución: getByText busca coincidencia exacta por defecto,
  // pero el texto completo del párrafo es "Gestiona tus tareas y mantente organizado".
  // Corrección: usar el texto completo o añadir { exact: false }.
  it('muestra la descripción de la página de tareas', () => {
    renderTaskPage()
    expect(screen.getByText('Gestiona tus tareas y mantente organizado')).toBeInTheDocument()
  })
})
