import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { NewsPage } from '@/dashboard/pages/news/NewsPage'

// ─── Helpers ───────────────────────────────────────────────────────────────

const mockArticle = (overrides = {}) => ({
  source: { id: null, name: 'Reuters' },
  author: 'John Doe',
  title: 'Test news article title',
  description: 'Test description for the article',
  url: 'https://example.com/article',
  urlToImage: null,
  publishedAt: '2026-04-01T10:00:00Z',
  content: null,
  ...overrides,
})

const mockApiResponse = (articles = [mockArticle()], totalResults = 1) => ({
  status: 'ok',
  totalResults,
  articles,
})

function renderPage() {
  return render(
    <MemoryRouter>
      <NewsPage />
    </MemoryRouter>
  )
}

// ─── Setup ─────────────────────────────────────────────────────────────────

beforeEach(() => {
  sessionStorage.clear()
  vi.mocked(fetch).mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(mockApiResponse()),
    status: 200,
  } as Response)
})

// ─── Tests ─────────────────────────────────────────────────────────────────

describe('NewsPage — renderizado inicial', () => {
  it('muestra el encabezado "Noticias"', () => {
    renderPage()
    expect(screen.getByText('Noticias')).toBeInTheDocument()
  })

  it('muestra el campo de búsqueda', () => {
    renderPage()
    expect(screen.getByPlaceholderText(/buscar noticias/i)).toBeInTheDocument()
  })

  it('muestra el botón Buscar', () => {
    renderPage()
    expect(screen.getByRole('button', { name: /buscar/i })).toBeInTheDocument()
  })

  it('muestra todos los botones de categoría', () => {
    renderPage()
    const labels = ['Todas', 'General', 'Negocios', 'Tecnología', 'Ciencia', 'Entretenimiento', 'Deportes', 'Salud']
    for (const label of labels) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument()
    }
  })

  it('muestra el selector de ordenación', () => {
    renderPage()
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('muestra el botón de dirección (asc/desc)', () => {
    renderPage()
    // El botón de toggle tiene title "Descendente" por defecto
    expect(screen.getByTitle(/descendente/i)).toBeInTheDocument()
  })
})

describe('NewsPage — carga de noticias', () => {
  it('llama a /news/top-headlines al montar', async () => {
    renderPage()
    await waitFor(() => {
      expect(vi.mocked(fetch)).toHaveBeenCalledWith(
        expect.stringContaining('/news/top-headlines'),
        expect.any(Object)
      )
    })
  })

  it('muestra los artículos recibidos', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockApiResponse([mockArticle({ title: 'Noticia visible' })])),
      status: 200,
    } as Response)

    renderPage()
    expect(await screen.findByText('Noticia visible')).toBeInTheDocument()
  })

  it('filtra artículos con título "[Removed]"', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockApiResponse([
        mockArticle({ title: '[Removed]', url: 'https://removed.com' }),
        mockArticle({ title: 'Noticia válida' }),
      ], 2)),
      status: 200,
    } as Response)

    renderPage()
    await waitFor(() => expect(screen.queryByText('[Removed]')).not.toBeInTheDocument())
    expect(await screen.findByText('Noticia válida')).toBeInTheDocument()
  })

  it('muestra mensaje de error cuando la API falla (en categoría específica)', async () => {
    // El caso "Todas" traga errores silenciosamente (Promise.all con catch).
    // Para ver el estado de error hay que estar en una categoría concreta (CASO 3).
    renderPage()
    await waitFor(() => expect(vi.mocked(fetch)).toHaveBeenCalledTimes(7))

    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ detail: 'Error de red' }),
      status: 500,
    } as Response)

    fireEvent.click(screen.getByRole('button', { name: 'Negocios' }))
    expect(await screen.findByText('Error de red')).toBeInTheDocument()
  })

  it('muestra "Sin resultados" cuando no hay artículos', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockApiResponse([], 0)),
      status: 200,
    } as Response)

    renderPage()
    expect(await screen.findByText('Sin resultados')).toBeInTheDocument()
  })
})

describe('NewsPage — filtro de categoría', () => {
  it('al pulsar "Negocios" hace fetch con category=business', async () => {
    renderPage()
    await waitFor(() => expect(vi.mocked(fetch)).toHaveBeenCalled())
    vi.mocked(fetch).mockClear()

    fireEvent.click(screen.getByRole('button', { name: 'Negocios' }))

    await waitFor(() => {
      expect(vi.mocked(fetch)).toHaveBeenCalledWith(
        expect.stringContaining('category=business'),
        expect.any(Object)
      )
    })
  })

  it('al pulsar la misma categoría activa vuelve a mostrar artículos (re-click usa caché)', async () => {
    renderPage()
    // Esperar carga inicial (Todas: 7 peticiones paralelas)
    await waitFor(() => expect(vi.mocked(fetch)).toHaveBeenCalledTimes(7))

    const btn = screen.getByRole('button', { name: 'Negocios' })
    fireEvent.click(btn)
    // Negocios hace 1 petición
    await waitFor(() => expect(vi.mocked(fetch)).toHaveBeenCalledTimes(8))

    vi.mocked(fetch).mockClear()
    // Re-click en Negocios (ya activo): usa caché, NO hace nueva petición
    fireEvent.click(btn)
    await new Promise((r) => setTimeout(r, 200))
    expect(vi.mocked(fetch)).not.toHaveBeenCalled()
  })
})

describe('NewsPage — búsqueda', () => {
  it('al buscar llama a /news/search con el término', async () => {
    renderPage()
    await waitFor(() => expect(vi.mocked(fetch)).toHaveBeenCalled())
    vi.mocked(fetch).mockClear()

    fireEvent.change(screen.getByPlaceholderText(/buscar noticias/i), { target: { value: 'claude' } })
    fireEvent.click(screen.getByRole('button', { name: /buscar/i }))

    await waitFor(() => {
      expect(vi.mocked(fetch)).toHaveBeenCalledWith(
        expect.stringContaining('/news/search'),
        expect.any(Object)
      )
      expect(vi.mocked(fetch)).toHaveBeenCalledWith(
        expect.stringContaining('q=claude'),
        expect.any(Object)
      )
    })
  })

  it('buscar el mismo término dos veces usa caché (no lanza nueva petición)', async () => {
    renderPage()
    // Esperar carga inicial (Todas: 7 peticiones)
    await waitFor(() => expect(vi.mocked(fetch)).toHaveBeenCalledTimes(7))

    const input = screen.getByPlaceholderText(/buscar noticias/i)
    const btn = screen.getByRole('button', { name: /buscar/i })

    fireEvent.change(input, { target: { value: 'claude' } })
    fireEvent.click(btn)
    // Búsqueda: 1 petición a /search
    await waitFor(() => expect(vi.mocked(fetch)).toHaveBeenCalledTimes(8))

    vi.mocked(fetch).mockClear()
    // Misma búsqueda de nuevo: caché hit, no llama fetch
    fireEvent.click(btn)
    await new Promise((r) => setTimeout(r, 200))
    expect(vi.mocked(fetch)).not.toHaveBeenCalled()
  })

  it('limpiar búsqueda vacía el input y oculta el botón Limpiar', async () => {
    // Al limpiar, vuelve a Todas. Si la caché sigue vigente no hace nueva petición,
    // pero el estado visual debe ser correcto (input vacío, botón Limpiar desaparece).
    renderPage()
    await waitFor(() => expect(vi.mocked(fetch)).toHaveBeenCalledTimes(7))

    const input = screen.getByPlaceholderText(/buscar noticias/i)
    fireEvent.change(input, { target: { value: 'claude' } })
    fireEvent.click(screen.getByRole('button', { name: /buscar/i }))
    await waitFor(() => expect(vi.mocked(fetch)).toHaveBeenCalledTimes(8))

    const limpiar = await screen.findByRole('button', { name: /limpiar/i })
    fireEvent.click(limpiar)

    await waitFor(() => expect(input).toHaveValue(''))
    expect(screen.queryByRole('button', { name: /limpiar/i })).not.toBeInTheDocument()
  })
})

describe('NewsPage — ordenación', () => {
  it('cambiar a "Popularidad" hace nuevas peticiones', async () => {
    renderPage()
    // Esperar carga inicial completa (Todas: 7 peticiones)
    await waitFor(() => expect(vi.mocked(fetch)).toHaveBeenCalledTimes(7))
    vi.mocked(fetch).mockClear()

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'popularity' } })

    // Todas con sort distinto → nueva cacheKey → fetch (7 paralelas)
    await waitFor(() => expect(vi.mocked(fetch).mock.calls.length).toBeGreaterThanOrEqual(1))
  })

  it('toggle asc/desc hace nuevas peticiones', async () => {
    renderPage()
    await waitFor(() => expect(vi.mocked(fetch)).toHaveBeenCalledTimes(7))
    vi.mocked(fetch).mockClear()

    fireEvent.click(screen.getByTitle(/descendente/i))

    await waitFor(() => expect(vi.mocked(fetch).mock.calls.length).toBeGreaterThanOrEqual(1))
  })

  it('los artículos se ordenan por fecha descendente (más reciente primero)', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockApiResponse([
        mockArticle({ title: 'Antigua', publishedAt: '2026-01-01T00:00:00Z' }),
        mockArticle({ title: 'Reciente', publishedAt: '2026-04-01T00:00:00Z', url: 'https://example.com/2' }),
      ], 2)),
      status: 200,
    } as Response)

    renderPage()

    await screen.findByText('Reciente')
    const cards = screen.getAllByRole('heading', { level: 3 })
    expect(cards[0]).toHaveTextContent('Reciente')
    expect(cards[1]).toHaveTextContent('Antigua')
  })
})

describe('NewsPage — caché sessionStorage', () => {
  it('la segunda visita a la misma categoría no lanza fetch (usa caché)', async () => {
    renderPage()
    await waitFor(() => expect(vi.mocked(fetch)).toHaveBeenCalled())

    // Simular segunda visita: re-render sin limpiar sessionStorage
    vi.mocked(fetch).mockClear()
    const { unmount } = renderPage()
    unmount()

    // No debería haber nuevas llamadas porque la caché sigue vigente
    await waitFor(() => expect(vi.mocked(fetch).mock.calls.length).toBe(0))
  })
})

describe('NewsPage — mix "Todas"', () => {
  it('con categoría "Todas" hace una petición por cada categoría (7 en paralelo)', async () => {
    renderPage()
    await waitFor(() => expect(vi.mocked(fetch)).toHaveBeenCalledTimes(7))
    const calls = vi.mocked(fetch).mock.calls.map(([url]) => url as string)
    expect(calls.every((u) => u.includes('/news/top-headlines'))).toBe(true)
    // Cada categoría aparece exactamente una vez
    const categories = ['general', 'technology', 'business', 'science', 'entertainment', 'sports', 'health']
    for (const cat of categories) {
      expect(calls.some((u) => u.includes(`category=${cat}`))).toBe(true)
    }
  })
})
