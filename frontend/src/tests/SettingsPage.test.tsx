import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { userAuth } from '@/context/AuthContext'
import { SettingsPage } from '@/dashboard/pages/settings/SettingsPage'

vi.mock('@/context/AuthContext', () => ({
    userAuth: vi.fn(),
}))

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom')
    return { ...actual, useNavigate: () => vi.fn() }
})

const baseUser = {
    id: 1,
    email: 'test@example.com',
    username: 'testuser',
    full_name: 'Test User',
    avatar_url: null,
    is_email_verified: true,
    has_password: true,
    created_at: '2024-01-01T00:00:00',
    social_accounts: [],
}

const mockEmailAuth = {
    user: baseUser,
    logOut: vi.fn(),
    updateProfile: vi.fn().mockResolvedValue({ success: true }),
    changePassword: vi.fn().mockResolvedValue({ success: true }),
    deleteAccount: vi.fn().mockResolvedValue({ success: true }),
}

const mockGoogleAuth = {
    ...mockEmailAuth,
    user: {
        ...baseUser,
        has_password: false,
        social_accounts: [
            { id: 1, provider: 'google', provider_email: 'test@gmail.com', created_at: '2024-01-01T00:00:00' },
        ],
    },
}

const renderSettingsPage = () =>
    render(
        <MemoryRouter>
            <SettingsPage />
        </MemoryRouter>
    )

describe('SettingsPage — usuario con contraseña', () => {
    beforeEach(() => {
        vi.mocked(userAuth).mockReturnValue(mockEmailAuth as any)
    })

    it('renderiza sin errores', () => {
        const { container } = renderSettingsPage()
        expect(container).toBeTruthy()
    })

    it('muestra el título "Configuración"', () => {
        renderSettingsPage()
        expect(screen.getByText('Configuración')).toBeInTheDocument()
    })

    it('muestra el nombre completo del usuario', () => {
        renderSettingsPage()
        expect(screen.getByText('Test User')).toBeInTheDocument()
    })

    it('muestra el campo de contraseña actual', () => {
        renderSettingsPage()
        expect(screen.getByLabelText(/contraseña actual/i)).toBeInTheDocument()
    })

    it('muestra el botón "Guardar cambios"', () => {
        renderSettingsPage()
        expect(screen.getByRole('button', { name: /guardar cambios/i })).toBeInTheDocument()
    })

    it('muestra el botón "Cambiar contraseña"', () => {
        renderSettingsPage()
        expect(screen.getByRole('button', { name: /cambiar contraseña/i })).toBeInTheDocument()
    })

    it('muestra el botón "Cerrar sesión"', () => {
        renderSettingsPage()
        expect(screen.getByRole('button', { name: /cerrar sesión/i })).toBeInTheDocument()
    })

    it('muestra el botón "Eliminar cuenta"', () => {
        renderSettingsPage()
        expect(screen.getByRole('button', { name: /eliminar cuenta/i })).toBeInTheDocument()
    })

    it('abre el modal de confirmación al hacer click en eliminar cuenta', async () => {
        renderSettingsPage()
        await userEvent.click(screen.getByRole('button', { name: /eliminar cuenta/i }))
        expect(screen.getByText(/esta acción no se puede deshacer/i)).toBeInTheDocument()
    })
})

describe('SettingsPage — usuario con Google', () => {
    beforeEach(() => {
        vi.mocked(userAuth).mockReturnValue(mockGoogleAuth as any)
    })

    it('no muestra el formulario de contraseña', () => {
        renderSettingsPage()
        expect(screen.queryByLabelText(/contraseña actual/i)).not.toBeInTheDocument()
    })

    it('muestra el mensaje de autenticación con Google', () => {
        renderSettingsPage()
        expect(screen.getByText(/autenticación con google/i)).toBeInTheDocument()
    })

    it('muestra la sección de cuentas vinculadas', () => {
        renderSettingsPage()
        expect(screen.getByText('Cuentas vinculadas')).toBeInTheDocument()
    })
})
