import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Newspaper,
  Search,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Calendar,
  User,
  X,
  Loader2,
} from "lucide-react";

const BASE_URL = "http://localhost:8000";
const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("access_token")}`,
});

// ─── Types ─────────────────────────────────────────────────────────────────

interface Article {
  source: { id: string | null; name: string };
  author: string | null;
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  content: string | null;
}

// ─── Module-level cache (sobrevive navegación entre páginas) ───────────────

interface CacheEntry { articles: Article[]; totalResults: number; ts: number }
const newsCache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

// Pool de artículos para sugerencias de búsqueda
const articlePoolUrls = new Set<string>();
const articlePool: Article[] = [];

function addToPool(articles: Article[]) {
  for (const a of articles) {
    if (!articlePoolUrls.has(a.url)) {
      articlePoolUrls.add(a.url);
      articlePool.push(a);
    }
  }
}

function getSuggestions(input: string): string[] {
  const trimmed = input.trim();
  if (trimmed.length < 2) return [];
  const lower = trimmed.toLowerCase();
  const seen = new Set<string>();
  const results: string[] = [];
  for (const a of articlePool) {
    const inTitle = a.title.toLowerCase().includes(lower);
    const inDesc = a.description?.toLowerCase().includes(lower) ?? false;
    if ((inTitle || inDesc) && !seen.has(a.title)) {
      seen.add(a.title);
      results.push(a.title.length > 68 ? a.title.slice(0, 65) + "…" : a.title);
      if (results.length >= 5) break;
    }
  }
  return results;
}

// ─── Persistencia de preferencias ─────────────────────────────────────────

const PREFS_KEY = "corely_news_prefs";
interface NewsPrefs { category: string; language: string; sortBy: string }
const DEFAULT_PREFS: NewsPrefs = { category: "", language: "en", sortBy: "publishedAt" };

function loadPrefs(): NewsPrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return DEFAULT_PREFS;
}
function savePrefs(p: NewsPrefs) {
  localStorage.setItem(PREFS_KEY, JSON.stringify(p));
}

// ─── Constantes ────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: "", label: "Todas" },
  { id: "business", label: "Negocios" },
  { id: "entertainment", label: "Entretenimiento" },
  { id: "general", label: "General" },
  { id: "health", label: "Salud" },
  { id: "science", label: "Ciencia" },
  { id: "sports", label: "Deportes" },
  { id: "technology", label: "Tecnología" },
];

const LANGUAGES = [
  { id: "en", label: "English" },
  { id: "es", label: "Español" },
  { id: "fr", label: "Français" },
  { id: "de", label: "Deutsch" },
  { id: "it", label: "Italiano" },
  { id: "pt", label: "Português" },
];

const SORT_OPTIONS = [
  { id: "publishedAt", label: "Más recientes" },
  { id: "relevancy", label: "Más relevantes" },
  { id: "popularity", label: "Más populares" },
];

const PAGE_SIZE = 20;

// Clases de color por categoría (nombres completos para Tailwind JIT)
function getCategoryActiveClass(id: string): string {
  switch (id) {
    case "business":      return "bg-amber-500 text-white border-transparent hover:bg-amber-600";
    case "entertainment": return "bg-pink-500 text-white border-transparent hover:bg-pink-600";
    case "general":       return "bg-slate-600 text-white border-transparent hover:bg-slate-700";
    case "health":        return "bg-emerald-500 text-white border-transparent hover:bg-emerald-600";
    case "science":       return "bg-cyan-500 text-white border-transparent hover:bg-cyan-600";
    case "sports":        return "bg-orange-500 text-white border-transparent hover:bg-orange-600";
    case "technology":    return "bg-blue-500 text-white border-transparent hover:bg-blue-600";
    default:              return "bg-primary text-primary-foreground border-transparent";
  }
}

function getCategoryBorderClass(id: string): string {
  switch (id) {
    case "business":      return "border-t-amber-500";
    case "entertainment": return "border-t-pink-500";
    case "general":       return "border-t-slate-500";
    case "health":        return "border-t-emerald-500";
    case "science":       return "border-t-cyan-500";
    case "sports":        return "border-t-orange-500";
    case "technology":    return "border-t-blue-500";
    default:              return "border-t-primary";
  }
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function stripHtml(html: string): string {
  try {
    return new DOMParser().parseFromString(html, "text/html").body.textContent?.trim() ?? "";
  } catch {
    return html.replace(/<[^>]*>/g, "").trim();
  }
}

// ─── Skeleton ──────────────────────────────────────────────────────────────

function ArticleCardSkeleton() {
  return (
    <Card className="overflow-hidden border-t-2 border-t-muted">
      <Skeleton className="w-full h-44" />
      <CardContent className="p-4 space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-3 w-3/5" />
        <Skeleton className="h-3 w-2/5" />
        <Skeleton className="h-8 w-full mt-2" />
      </CardContent>
    </Card>
  );
}

// ─── Tarjeta de artículo ───────────────────────────────────────────────────

function ArticleCard({ article, borderClass }: { article: Article; borderClass: string }) {
  const [imgError, setImgError] = useState(false);

  return (
    <Card
      className={`overflow-hidden flex flex-col border border-border border-t-2 ${borderClass} hover:shadow-md transition-shadow duration-200`}
    >
      {/* Imagen */}
      <div className="w-full h-44 bg-muted overflow-hidden shrink-0">
        {article.urlToImage && !imgError ? (
          <img
            src={article.urlToImage}
            alt={article.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Newspaper className="h-10 w-10 text-muted-foreground/30" />
          </div>
        )}
      </div>

      <CardContent className="p-4 flex flex-col flex-1 gap-2">
        {/* Fuente */}
        <Badge variant="secondary" className="self-start text-xs max-w-full truncate">
          {article.source.name}
        </Badge>

        {/* Título */}
        <h3 className="text-sm font-semibold leading-snug line-clamp-2">
          {article.title}
        </h3>

        {/* Descripción */}
        {article.description && (
          <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed flex-1">
            {stripHtml(article.description)}
          </p>
        )}

        {/* Meta */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-auto pt-1">
          <span className="flex items-center gap-1 shrink-0">
            <Calendar className="h-3 w-3" />
            {formatDate(article.publishedAt)}
          </span>
          {article.author && (
            <span className="flex items-center gap-1 min-w-0">
              <User className="h-3 w-3 shrink-0" />
              <span className="truncate">{article.author.split(",")[0]}</span>
            </span>
          )}
        </div>

        {/* Botón */}
        <Button
          size="sm"
          variant="outline"
          className="w-full gap-1.5 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
          onClick={() => window.open(article.url, "_blank", "noopener,noreferrer")}
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Ver artículo completo
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Página principal ──────────────────────────────────────────────────────

export const NewsPage = () => {
  // Preferencias persistidas
  const [category, setCategory] = useState(() => loadPrefs().category);
  const [language, setLanguage] = useState(() => loadPrefs().language);
  const [sortBy, setSortBy] = useState(() => loadPrefs().sortBy);

  // Búsqueda
  const [query, setQuery] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [page, setPage] = useState(1);

  // Datos
  const [articles, setArticles] = useState<Article[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  // true cuando page > 1 para hacer append en lugar de reemplazar
  const appendRef = useRef(false);
  const hasMoreRef = useRef(true);
  const loadingRef = useRef(false);

  const isSearchMode = query.trim().length > 0;
  const cardBorderClass = getCategoryBorderClass(category);

  // Guardar preferencias
  useEffect(() => {
    savePrefs({ category, language, sortBy });
  }, [category, language, sortBy]);

  // Cerrar sugerencias al clicar fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        !inputRef.current?.contains(e.target as Node) &&
        !suggestionsRef.current?.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // IntersectionObserver para scroll infinito (se registra una sola vez)
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingRef.current && hasMoreRef.current) {
          appendRef.current = true;
          setPage((p) => p + 1);
        }
      },
      { rootMargin: "300px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  const fetchNews = useCallback(async () => {
    loadingRef.current = true;
    setLoading(true);
    setError(null);

    const isAppend = appendRef.current;
    appendRef.current = false;

    let url: string;
    let cacheKey: string;

    if (isSearchMode) {
      const params = new URLSearchParams({
        q: query,
        language,
        sort_by: sortBy,
        page_size: String(PAGE_SIZE),
        page: String(page),
      });
      url = `${BASE_URL}/news/search?${params}`;
      cacheKey = `search:${params.toString()}`;
    } else {
      const params = new URLSearchParams({
        country: "us",
        page_size: String(PAGE_SIZE),
        page: String(page),
      });
      if (category) params.set("category", category);
      url = `${BASE_URL}/news/top-headlines?${params}`;
      cacheKey = `headlines:${params.toString()}`;
    }

    // Caché
    const cached = newsCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      if (isAppend) {
        setArticles((prev) => {
          const next = [...prev, ...cached.articles];
          hasMoreRef.current = next.length < Math.min(cached.totalResults, 100);
          return next;
        });
      } else {
        hasMoreRef.current = cached.articles.length < Math.min(cached.totalResults, 100);
        setArticles(cached.articles);
      }
      setTotalResults(cached.totalResults);
      loadingRef.current = false;
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(url, { headers: getAuthHeaders() });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Error al obtener noticias");
      }
      const data = await res.json();
      const clean = (data.articles as Article[]).filter(
        (a) => a.title !== "[Removed]" && a.url !== "https://removed.com"
      );
      const newTotal = data.totalResults ?? 0;
      newsCache.set(cacheKey, { articles: clean, totalResults: newTotal, ts: Date.now() });
      addToPool(clean);
      setTotalResults(newTotal);
      if (isAppend) {
        setArticles((prev) => {
          const next = [...prev, ...clean];
          hasMoreRef.current = next.length < Math.min(newTotal, 100);
          return next;
        });
      } else {
        hasMoreRef.current = clean.length < Math.min(newTotal, 100);
        setArticles(clean);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
      if (!isAppend) setArticles([]);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [isSearchMode, query, category, language, sortBy, page]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  function handleInputChange(value: string) {
    setInputValue(value);
    const s = getSuggestions(value);
    setSuggestions(s);
    setShowSuggestions(s.length > 0);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setShowSuggestions(false);
    hasMoreRef.current = true;
    appendRef.current = false;
    setArticles([]);
    setPage(1);
    setQuery(inputValue.trim());
  }

  function clearSearch() {
    hasMoreRef.current = true;
    appendRef.current = false;
    setQuery("");
    setInputValue("");
    setSuggestions([]);
    setShowSuggestions(false);
    setArticles([]);
    setPage(1);
  }

  function selectSuggestion(s: string) {
    hasMoreRef.current = true;
    appendRef.current = false;
    setArticles([]);
    setInputValue(s);
    setQuery(s);
    setSuggestions([]);
    setShowSuggestions(false);
    setPage(1);
  }

  function handleCategoryClick(catId: string) {
    if (isSearchMode) clearSearch();
    hasMoreRef.current = true;
    appendRef.current = false;
    setArticles([]);
    setCategory(catId);
    setPage(1);
  }

  return (
    <div className="space-y-5">
      {/* Cabecera */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Newspaper className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Noticias</h1>
          <p className="text-muted-foreground">Mantente al día con las últimas novedades</p>
        </div>
      </div>

      {/* Barra de búsqueda */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            ref={inputRef}
            placeholder="Buscar noticias…"
            className="pl-9 pr-8"
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            autoComplete="off"
          />
          {inputValue && (
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => { setInputValue(""); setSuggestions([]); setShowSuggestions(false); }}
            >
              <X className="h-4 w-4" />
            </button>
          )}

          {/* Sugerencias */}
          {showSuggestions && suggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border border-input rounded-md shadow-lg overflow-hidden"
            >
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors flex items-center gap-2"
                  onMouseDown={(e) => { e.preventDefault(); selectSuggestion(s); }}
                >
                  <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="truncate">{s}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <Button type="submit" disabled={loading}>
          Buscar
        </Button>
      </form>

      {/* Filtros */}
      <Card className="p-4 space-y-3">
        {/* Pills de categoría */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => {
            const isActive = category === cat.id && !isSearchMode;
            return (
              <Button
                key={cat.id}
                size="sm"
                variant={isActive ? "default" : "outline"}
                onClick={() => handleCategoryClick(cat.id)}
                className={`h-7 text-xs transition-all ${isActive ? getCategoryActiveClass(cat.id) : "hover:border-primary/50"}`}
              >
                {cat.label}
              </Button>
            );
          })}
        </div>

        {/* Idioma + Ordenar (siempre visibles, aplican al buscar) */}
        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-border">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Idioma:</span>
            <select
              value={language}
              onChange={(e) => { setLanguage(e.target.value); if (isSearchMode) { hasMoreRef.current = true; appendRef.current = false; setArticles([]); setPage(1); } }}
              className="text-xs border border-input rounded-md px-2 py-1 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {LANGUAGES.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Ordenar:</span>
            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); if (isSearchMode) { hasMoreRef.current = true; appendRef.current = false; setArticles([]); setPage(1); } }}
              className="text-xs border border-input rounded-md px-2 py-1 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {SORT_OPTIONS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
          {isSearchMode && (
            <button
              onClick={clearSearch}
              className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3 w-3" />
              Limpiar búsqueda
            </button>
          )}
        </div>
      </Card>

      {/* Barra de estado */}
      {!loading && !error && articles.length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {isSearchMode ? (
              <>
                {totalResults.toLocaleString("es-ES")} resultado{totalResults !== 1 ? "s" : ""} para{" "}
                <strong className="text-foreground">"{query}"</strong>
              </>
            ) : (
              <>
                {CATEGORIES.find((c) => c.id === category)?.label} ·{" "}
                {totalResults.toLocaleString("es-ES")} artículo{totalResults !== 1 ? "s" : ""}
              </>
            )}
          </span>
          <Button variant="ghost" size="sm" onClick={() => { hasMoreRef.current = true; appendRef.current = false; setArticles([]); setPage(1); fetchNews(); }} className="gap-1.5 h-7">
            <RefreshCw className="h-3.5 w-3.5" />
            Actualizar
          </Button>
        </div>
      )}

      {/* Error */}
      {error && (
        <Card className="p-6 text-center border-destructive/40 bg-destructive/5">
          <AlertCircle className="h-10 w-10 mx-auto text-destructive mb-3" />
          <p className="font-medium text-destructive">{error}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={fetchNews}>
            Reintentar
          </Button>
        </Card>
      )}

      {/* Sin resultados */}
      {!loading && !error && articles.length === 0 && (
        <Card className="p-10 text-center">
          <Newspaper className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
          <h3 className="text-lg font-medium">Sin resultados</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {isSearchMode
              ? "Prueba con otras palabras o cambia el idioma"
              : "No se encontraron noticias en esta categoría"}
          </p>
        </Card>
      )}

      {/* Grid de artículos */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {articles.map((article, i) => (
          <ArticleCard
            key={`${article.url}-${i}`}
            article={article}
            borderClass={cardBorderClass}
          />
        ))}
        {/* Skeletons solo en la carga inicial (no append) */}
        {loading && articles.length === 0 &&
          Array.from({ length: 8 }).map((_, i) => <ArticleCardSkeleton key={i} />)
        }
      </div>

      {/* Indicador de carga al hacer scroll */}
      {loading && articles.length > 0 && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Sentinel para IntersectionObserver */}
      <div ref={sentinelRef} className="h-1" />
    </div>
  );
};
