import '@testing-library/jest-dom'

// Mock global de fetch: evita llamadas reales a la API durante los tests
globalThis.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve([]),
    status: 200,
  } as Response)
)

beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
})
