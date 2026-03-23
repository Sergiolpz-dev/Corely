import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthContextProvider } from '@/context/AuthContext'
import { LoginPage } from '@/auth/pages/LoginPage'

// Mock del módulo de Google OAuth para evitar errores con window.google en jsdom
vi.mock('@react-oauth/google', () => ({
  useGoogleLogin: () => vi.fn(),
  GoogleOAuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

const renderLoginPage = () =>
  render(
    <MemoryRouter>
      <AuthContextProvider>
        <LoginPage />
      </AuthContextProvider>
    </MemoryRouter>
  )

describe('LoginPage', () => {
  it('renderiza sin errores', () => {
    const { container } = renderLoginPage()
    expect(container).toBeTruthy()
  })

  it('muestra el botón de inicio de sesión', () => {
    renderLoginPage()
    expect(screen.getByRole('button', { name: 'Iniciar sesión' })).toBeInTheDocument()
  })

  it('muestra el enlace para crear cuenta', () => {
    renderLoginPage()
    const link = screen.getByRole('link', { name: 'Crear cuenta' })
    expect(link).toHaveAttribute('href', '/signup')
  })
})
