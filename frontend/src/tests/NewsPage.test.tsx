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
  it('muestra el encabezado y todos los botones de categoría', () => {
    renderPage()
    expect(screen.getByText('Noticias')).toBeInTheDocument()
    for (const label of ['Todas', 'General', 'Negocios', 'Tecnología', 'Ciencia', 'Entretenimiento', 'Deportes', 'Salud']) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument()
    }
  })
})

describe('NewsPage — carga de noticias', () => {
  it('muestra los artículos recibidos de la API', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockApiResponse([mockArticle({ title: 'Noticia visible' })])),
      status: 200,
    } as Response)

    renderPage()
    expect(await screen.findByText('Noticia visible')).toBeInTheDocument()
  })

  it('muestra "Sin resultados" cuando la API devuelve lista vacía', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockApiResponse([], 0)),
      status: 200,
    } as Response)

    renderPage()
    expect(await screen.findByText('Sin resultados')).toBeInTheDocument()
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
})

describe('NewsPage — filtros y búsqueda', () => {
  it('pulsar "Negocios" lanza fetch con category=business', async () => {
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

  it('buscar un término llama a /news/search con q=<término>', async () => {
    renderPage()
    await waitFor(() => expect(vi.mocked(fetch)).toHaveBeenCalled())
    vi.mocked(fetch).mockClear()

    fireEvent.change(screen.getByPlaceholderText(/buscar noticias/i), { target: { value: 'claude' } })
    fireEvent.click(screen.getByRole('button', { name: /buscar/i }))

    await waitFor(() => {
      expect(vi.mocked(fetch)).toHaveBeenCalledWith(expect.stringContaining('/news/search'), expect.any(Object))
      expect(vi.mocked(fetch)).toHaveBeenCalledWith(expect.stringContaining('q=claude'), expect.any(Object))
    })
  })

  it('categoría "Todas" lanza 7 peticiones en paralelo (una por categoría)', async () => {
    renderPage()
    await waitFor(() => expect(vi.mocked(fetch)).toHaveBeenCalledTimes(7))
    const calls = vi.mocked(fetch).mock.calls.map(([url]) => url as string)
    for (const cat of ['general', 'technology', 'business', 'science', 'entertainment', 'sports', 'health']) {
      expect(calls.some((u) => u.includes(`category=${cat}`))).toBe(true)
    }
  })
})
