import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthContextProvider } from '@/context/AuthContext'
import { SignupPage } from '@/auth/pages/SignupPage'

// Mock del módulo de Google OAuth para evitar errores con window.google en jsdom
vi.mock('@react-oauth/google', () => ({
  useGoogleLogin: () => vi.fn(),
  GoogleOAuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

const renderSignupPage = () =>
  render(
    <MemoryRouter>
      <AuthContextProvider>
        <SignupPage />
      </AuthContextProvider>
    </MemoryRouter>
  )

describe('SignupPage', () => {
  it('renderiza sin errores', () => {
    const { container } = renderSignupPage()
    expect(container).toBeTruthy()
  })

  it('muestra el campo de nombre completo', () => {
    renderSignupPage()
    expect(screen.getByLabelText(/nombre completo/i)).toBeInTheDocument()
  })
})
