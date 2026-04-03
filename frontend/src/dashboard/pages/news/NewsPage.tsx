import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Newspaper, Search, ExternalLink, RefreshCw,
  AlertCircle, Calendar, User, X, Loader2, ArrowUp, ArrowDown, EyeOff,
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
  _category?: string; // solo en el mix "Todas"
  _rank?: number;     // posición al ordenar por popularidad
}

// ─── Cache sessionStorage ──────────────────────────────────────────────────

interface CacheEntry { articles: Article[]; totalResults: number; ts: number }
const CACHE_TTL = 5 * 60 * 1000;
const CACHE_PREFIX = "corely_nc_";
const POOL_KEY = "corely_np";

function getCached(key: string): CacheEntry | null {
  try {
    const raw = sessionStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() - entry.ts > CACHE_TTL) { sessionStorage.removeItem(CACHE_PREFIX + key); return null; }
    return entry;
  } catch { return null; }
}
function setCached(key: string, entry: CacheEntry) {
  try { sessionStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry)); } catch { /* cuota */ }
  // Guardar también en localStorage como fallback permanente (sin TTL)
  try { localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry)); } catch { /* cuota */ }
}

function getFallback(key: string): CacheEntry | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
function deleteCached(key: string) {
  try { sessionStorage.removeItem(CACHE_PREFIX + key); } catch { /* ignore */ }
}

// ─── Artículos ocultos (persistente, sin TTL) ──────────────────────────────

const HIDDEN_KEY = "corely_hidden_urls";

function loadHidden(): Set<string> {
  try {
    const raw = localStorage.getItem(HIDDEN_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
}

function saveHidden(set: Set<string>) {
  try { localStorage.setItem(HIDDEN_KEY, JSON.stringify([...set])); } catch { /* cuota */ }
}

// Pool de sugerencias (persistido en sesión)
function loadPool(): { urls: Set<string>; articles: Article[] } {
  try {
    const saved: Article[] = JSON.parse(sessionStorage.getItem(POOL_KEY) || "[]");
    return { urls: new Set(saved.map((a) => a.url)), articles: saved };
  } catch { return { urls: new Set(), articles: [] }; }
}
const _pool = loadPool();
const articlePoolUrls = _pool.urls;
const articlePool = _pool.articles;

function addToPool(articles: Article[]) {
  let changed = false;
  for (const a of articles) {
    if (!articlePoolUrls.has(a.url)) {
      articlePoolUrls.add(a.url);
      articlePool.push(a);
      changed = true;
    }
  }
  if (changed) {
    try { sessionStorage.setItem(POOL_KEY, JSON.stringify(articlePool.slice(-300))); } catch { /* ignore */ }
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

// ─── Preferencias ─────────────────────────────────────────────────────────

const PREFS_KEY = "corely_news_prefs";
interface NewsPrefs { category: string; sortBy: string; sortAsc: boolean }
const DEFAULT_PREFS: NewsPrefs = { category: "", sortBy: "publishedAt", sortAsc: false };

function loadPrefs(): NewsPrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return DEFAULT_PREFS;
}
function savePrefs(p: NewsPrefs) { localStorage.setItem(PREFS_KEY, JSON.stringify(p)); }

// ─── Constantes ────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: "", label: "Todas" },
  { id: "general", label: "General" },
  { id: "business", label: "Negocios" },
  { id: "technology", label: "Tecnología" },
  { id: "science", label: "Ciencia" },
  { id: "entertainment", label: "Entretenimiento" },
  { id: "sports", label: "Deportes" },
  { id: "health", label: "Salud" },
];

const MIX_CATEGORIES = ["general", "technology", "business", "science", "entertainment", "sports", "health"];
const MIX_PER_CAT = 2;

const CATEGORY_LABELS: Record<string, string> = {
  general: "General", technology: "Tecnología", business: "Negocios",
  science: "Ciencia", entertainment: "Entretenimiento", sports: "Deportes", health: "Salud",
};

// Keywords para combinar con query en /everything cuando hay categoría activa
const CATEGORY_SEARCH_SUFFIX: Record<string, string> = {
  business: "business", technology: "technology tech", sports: "sports",
  health: "health", science: "science", entertainment: "entertainment", general: "",
};

// Solo dos opciones de orden: fecha y popularidad (relevancia sin query no tiene sentido)
const SORT_OPTIONS = [
  { id: "publishedAt", label: "Fecha" },
  { id: "popularity", label: "Popularidad" },
];

const PAGE_SIZE = 12;

// ─── Helpers de color ──────────────────────────────────────────────────────

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
function getCategoryBgClass(id: string): string {
  switch (id) {
    case "business":      return "bg-amber-500";
    case "entertainment": return "bg-pink-500";
    case "general":       return "bg-slate-600";
    case "health":        return "bg-emerald-500";
    case "science":       return "bg-cyan-500";
    case "sports":        return "bg-orange-500";
    case "technology":    return "bg-blue-500";
    default:              return "bg-primary";
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
  return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
}
function stripHtml(html: string): string {
  try { return new DOMParser().parseFromString(html, "text/html").body.textContent?.trim() ?? ""; }
  catch { return html.replace(/<[^>]*>/g, "").trim(); }
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

// ─── Tarjeta ───────────────────────────────────────────────────────────────

function ArticleCard({ article, borderClass, onHide }: { article: Article; borderClass: string; onHide: (url: string) => void }) {
  const [imgError, setImgError] = useState(false);
  const effectiveBorder = article._category ? getCategoryBorderClass(article._category) : borderClass;

  return (
    <Card className={`group overflow-hidden flex flex-col border border-border border-t-2 ${effectiveBorder} hover:shadow-md transition-shadow duration-200`}>
      <div className="w-full h-44 bg-muted overflow-hidden shrink-0 relative">
        {article.urlToImage && !imgError ? (
          <img
            src={article.urlToImage} alt={article.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Newspaper className="h-10 w-10 text-muted-foreground/30" />
          </div>
        )}
        {/* Badge de popularidad (posición en ranking) */}
        {article._rank !== undefined && (
          <span title="Posición en ranking de popularidad" className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow">
            {article._rank}
          </span>
        )}
        {/* Botón ocultar */}
        <button
          onClick={() => onHide(article.url)}
          title="Ocultar artículo"
          className="absolute top-2 right-2 bg-black/50 hover:bg-black/75 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <EyeOff className="h-3 w-3" />
        </button>
      </div>

      <CardContent className="p-4 flex flex-col flex-1 gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge variant="secondary" className="text-xs max-w-[150px] truncate shrink-0">
            {article.source.name}
          </Badge>
          {article._category && (
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full text-white shrink-0 ${getCategoryBgClass(article._category)}`}>
              {CATEGORY_LABELS[article._category] ?? article._category}
            </span>
          )}
        </div>

        <h3 className="text-sm font-semibold leading-snug line-clamp-2">{article.title}</h3>

        {article.description && (
          <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed flex-1">
            {stripHtml(article.description)}
          </p>
        )}

        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-auto pt-1">
          <span className="flex items-center gap-1 shrink-0">
            <Calendar className="h-3 w-3" />{formatDate(article.publishedAt)}
          </span>
          {article.author && (
            <span className="flex items-center gap-1 min-w-0">
              <User className="h-3 w-3 shrink-0" />
              <span className="truncate">{article.author.split(",")[0]}</span>
            </span>
          )}
        </div>

        <Button
          size="sm" variant="outline"
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
  const [category, setCategory] = useState(() => loadPrefs().category);
  const [sortBy, setSortBy] = useState(() => loadPrefs().sortBy);
  const [sortAsc, setSortAsc] = useState(() => loadPrefs().sortAsc);

  const [query, setQuery] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [page, setPage] = useState(1);
  const [fetchKey, setFetchKey] = useState(0);

  const [articles, setArticles] = useState<Article[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stale, setStale] = useState(false); // true cuando se muestran datos del fallback
  const [hiddenUrls, setHiddenUrls] = useState<Set<string>>(loadHidden);

  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const appendRef = useRef(false);
  const hasMoreRef = useRef(true);
  const loadingRef = useRef(false);
  const bypassCacheRef = useRef(false);

  const cardBorderClass = getCategoryBorderClass(category);

  useEffect(() => { savePrefs({ category, sortBy, sortAsc }); }, [category, sortBy, sortAsc]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!inputRef.current?.contains(e.target as Node) && !suggestionsRef.current?.contains(e.target as Node))
        setShowSuggestions(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Función de ordenación client-side ──────────────────────────────────

  function applySortAndRank(list: Article[]): Article[] {
    if (sortBy === "publishedAt") {
      const sorted = [...list].sort((a, b) => {
        const diff = new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime();
        return sortAsc ? diff : -diff;
      });
      return sorted;
    }
    if (sortBy === "popularity") {
      // Para /everything la API ya devuelve por popularidad (desc).
      // Si el usuario quiere ascendente, invertimos el orden y reasignamos ranks.
      const ordered = sortAsc ? [...list].reverse() : list;
      return ordered.map((a, i) => ({ ...a, _rank: i + 1 }));
    }
    return list;
  }

  const fetchNews = useCallback(async () => {
    loadingRef.current = true;
    setLoading(true);
    setError(null);
    const isAppend = appendRef.current;
    appendRef.current = false;
    const bypass = bypassCacheRef.current;
    bypassCacheRef.current = false;

    const apply = (entry: CacheEntry, append: boolean) => {
      setTotalResults(entry.totalResults);
      if (append) {
        setArticles((prev) => {
          const next = [...prev, ...entry.articles];
          hasMoreRef.current = entry.articles.length > 0 && next.length < Math.min(entry.totalResults, 200);
          return next;
        });
      } else {
        hasMoreRef.current = entry.articles.length > 0 && entry.articles.length < Math.min(entry.totalResults, 200);
        setArticles(entry.articles);
      }
    };

    try {
      // ── CASO 1: hay query → /everything ──────────────────────────────────
      if (query) {
        const suffix = category ? (CATEGORY_SEARCH_SUFFIX[category] ?? "") : "";
        const fullQ = suffix ? `${query} ${suffix}` : query;
        const params = new URLSearchParams({
          q: fullQ, sort_by: sortBy, page_size: String(PAGE_SIZE), page: String(page), language: "en",
        });
        const url = `${BASE_URL}/news/search?${params}`;
        const cacheKey = `search:q=${query}:cat=${category}:sort=${sortBy}:asc=${sortAsc}:p=${page}`;

        if (!bypass) {
          const cached = getCached(cacheKey);
          if (cached) { apply(cached, isAppend); return; }
        } else { deleteCached(cacheKey); }

        const res = await fetch(url, { headers: getAuthHeaders() });
        if (!res.ok) throw new Error((await res.json()).detail || "Error al obtener noticias");
        const data = await res.json();
        const filtered = (data.articles as Article[]).filter(
          (a) => a.title !== "[Removed]" && a.url !== "https://removed.com"
        );

        // Título coincide → va primero (solo para orden por fecha)
        let clean: Article[];
        if (sortBy === "publishedAt") {
          const lower = query.toLowerCase();
          const inTitle = filtered.filter((a) => a.title.toLowerCase().includes(lower));
          const rest = filtered.filter((a) => !a.title.toLowerCase().includes(lower));
          clean = applySortAndRank([...inTitle, ...rest]);
        } else {
          // popularity: la API ya ordenó, solo aplicamos asc/desc y ranks
          clean = applySortAndRank(filtered);
        }

        const entry: CacheEntry = { articles: clean, totalResults: data.totalResults ?? 0, ts: Date.now() };
        setCached(cacheKey, entry);
        addToPool(clean);
        apply(entry, isAppend);
        return;
      }

      // ── CASO 2: sin query + "Todas" → mix de categorías ──────────────────
      if (category === "") {
        const cacheKey = `todas:sort=${sortBy}:asc=${sortAsc}:p=${page}`;
        if (!bypass) {
          const cached = getCached(cacheKey);
          if (cached) { apply(cached, isAppend); return; }
        } else { deleteCached(cacheKey); }

        const results = await Promise.all(
          MIX_CATEGORIES.map((cat) => {
            const params = new URLSearchParams({ country: "us", category: cat, page_size: String(MIX_PER_CAT), page: String(page) });
            return fetch(`${BASE_URL}/news/top-headlines?${params}`, { headers: getAuthHeaders() })
              .then((r) => (r.ok ? r.json() : null)).catch(() => null);
          })
        );

        const seen = new Set<string>();
        const mix: Article[] = [];
        for (let i = 0; i < MIX_PER_CAT; i++) {
          for (let j = 0; j < MIX_CATEGORIES.length; j++) {
            const a: Article | undefined = results[j]?.articles?.[i];
            if (a && a.title !== "[Removed]" && a.url !== "https://removed.com" && !seen.has(a.url)) {
              seen.add(a.url);
              mix.push({ ...a, _category: MIX_CATEGORIES[j] });
            }
          }
        }

        const sorted = applySortAndRank(mix);
        const entry: CacheEntry = { articles: sorted, totalResults: 9999, ts: Date.now() };
        setCached(cacheKey, entry);
        addToPool(sorted);
        apply(entry, isAppend);
        return;
      }

      // ── CASO 3: sin query + categoría específica → /top-headlines ─────────
      const params = new URLSearchParams({
        country: "us", category, page_size: String(PAGE_SIZE), page: String(page),
      });
      const url = `${BASE_URL}/news/top-headlines?${params}`;
      const cacheKey = `headlines:cat=${category}:sort=${sortBy}:asc=${sortAsc}:p=${page}`;

      if (!bypass) {
        const cached = getCached(cacheKey);
        if (cached) { apply(cached, isAppend); return; }
      } else { deleteCached(cacheKey); }

      const res = await fetch(url, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error((await res.json()).detail || "Error al obtener noticias");
      const data = await res.json();
      const filtered = (data.articles as Article[]).filter(
        (a) => a.title !== "[Removed]" && a.url !== "https://removed.com"
      );
      const clean = applySortAndRank(filtered);
      const entry: CacheEntry = { articles: clean, totalResults: data.totalResults ?? 0, ts: Date.now() };
      setCached(cacheKey, entry);
      addToPool(clean);
      apply(entry, isAppend);

    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      // Intentar fallback desde localStorage antes de mostrar error
      if (!isAppend) {
        const fallbackKey = query
          ? `search:q=${query}:cat=${category}:sort=${sortBy}:asc=${sortAsc}:p=${page}`
          : category === ""
          ? `todas:sort=${sortBy}:asc=${sortAsc}:p=${page}`
          : `headlines:cat=${category}:sort=${sortBy}:asc=${sortAsc}:p=${page}`;
        const fallback = getFallback(fallbackKey);
        if (fallback) {
          apply(fallback, false);
          setStale(true);
          return;
        }
        setArticles([]);
      }
      setError(msg);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [query, category, sortBy, sortAsc, page, fetchKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchNews(); }, [fetchNews]);

  // ── Handlers ───────────────────────────────────────────────────────────

  function resetPage() {
    hasMoreRef.current = true;
    appendRef.current = false;
    setArticles([]);
    setPage(1);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setShowSuggestions(false);
    const newQuery = inputValue.trim();
    if (newQuery === query) { setFetchKey((k) => k + 1); return; }
    hasMoreRef.current = true;
    appendRef.current = false;
    setArticles([]);
    setPage(1);
    setQuery(newQuery);
  }

  function clearQuery() {
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
    if (catId === category) { setFetchKey((k) => k + 1); return; }
    resetPage();
    setCategory(catId);
  }

  function handleRefresh() {
    bypassCacheRef.current = true;
    resetPage();
    setFetchKey((k) => k + 1);
  }

  function hideArticle(url: string) {
    setHiddenUrls((prev) => {
      const next = new Set(prev);
      next.add(url);
      saveHidden(next);
      return next;
    });
  }

  function clearHidden() {
    setHiddenUrls(new Set());
    localStorage.removeItem(HIDDEN_KEY);
  }

  // ── Render ─────────────────────────────────────────────────────────────

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

      {/* ── Búsqueda (independiente, arriba) ── */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            ref={inputRef}
            placeholder="Buscar noticias…"
            className="pl-9 pr-8"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              const s = getSuggestions(e.target.value);
              setSuggestions(s);
              setShowSuggestions(s.length > 0);
            }}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            autoComplete="off"
          />
          {inputValue && (
            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => { setInputValue(""); setSuggestions([]); setShowSuggestions(false); }}>
              <X className="h-4 w-4" />
            </button>
          )}
          {showSuggestions && suggestions.length > 0 && (
            <div ref={suggestionsRef} className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border border-input rounded-md shadow-lg overflow-hidden">
              {suggestions.map((s, i) => (
                <button key={i} type="button"
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors flex items-center gap-2"
                  onMouseDown={(e) => { e.preventDefault(); selectSuggestion(s); }}>
                  <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="truncate">{s}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <Button type="submit" disabled={loading}>Buscar</Button>
        {query && (
          <Button type="button" variant="ghost" size="sm" onClick={clearQuery} className="gap-1 text-muted-foreground">
            <X className="h-4 w-4" /> Limpiar
          </Button>
        )}
      </form>

      {/* ── Filtros: categoría + ordenar ── */}
      <Card className="p-4 space-y-3">
        {/* Categorías */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => {
            const isActive = category === cat.id;
            return (
              <Button key={cat.id} size="sm" variant={isActive ? "default" : "outline"}
                onClick={() => handleCategoryClick(cat.id)}
                className={`h-7 text-xs transition-all ${isActive ? getCategoryActiveClass(cat.id) : "hover:border-primary/50"}`}>
                {cat.label}
              </Button>
            );
          })}
        </div>

        {/* Ordenar */}
        <div className="flex items-center gap-2 pt-2 border-t border-border">
          <span className="text-xs text-muted-foreground">Ordenar:</span>
          <select
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value); resetPage(); }}
            className="text-xs border border-input rounded-md px-2 py-1.5 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {SORT_OPTIONS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
          <button
            onClick={() => { setSortAsc((a) => !a); resetPage(); }}
            title={sortAsc ? "Ascendente" : "Descendente"}
            className="p-1.5 rounded-md border border-input hover:bg-muted transition-colors"
          >
            {sortAsc ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />}
          </button>
          <span className="text-xs text-muted-foreground/60 hidden sm:inline">
            {sortAsc ? "ascendente" : "descendente"}
          </span>
        </div>
      </Card>

      {/* Barra de estado */}
      {!loading && !error && articles.length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span className="flex items-center gap-2 flex-wrap">
            {query && <span>Resultados para <strong className="text-foreground">"{query}"</strong></span>}
            {category && <Badge variant="secondary" className="text-xs font-normal">{CATEGORIES.find((c) => c.id === category)?.label}</Badge>}
            {!query && !category && <span>{category === "" ? "Mix de todas las categorías" : ""}</span>}
            {totalResults < 9999 && <span className="text-xs">· {totalResults.toLocaleString("es-ES")} resultados</span>}
          </span>
          <Button variant="ghost" size="sm" onClick={handleRefresh} className="gap-1.5 h-7 shrink-0">
            <RefreshCw className="h-3.5 w-3.5" /> Actualizar
          </Button>
        </div>
      )}

      {/* Aviso de datos sin actualizar (fallback) */}
      {stale && !error && (
        <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md px-3 py-2">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          Mostrando noticias guardadas — límite de API alcanzado. Inténtalo más tarde.
        </div>
      )}

      {/* Error */}
      {error && (
        <Card className="p-6 text-center border-destructive/40 bg-destructive/5">
          <AlertCircle className="h-10 w-10 mx-auto text-destructive mb-3" />
          <p className="font-medium text-destructive">{error}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={fetchNews}>Reintentar</Button>
        </Card>
      )}

      {/* Sin resultados */}
      {!loading && !error && articles.length === 0 && (
        <Card className="p-10 text-center">
          <Newspaper className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
          <h3 className="text-lg font-medium">Sin resultados</h3>
          <p className="text-sm text-muted-foreground mt-1">Prueba ajustando los filtros o la búsqueda</p>
        </Card>
      )}

      {/* Artículos ocultos */}
      {hiddenUrls.size > 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <EyeOff className="h-3.5 w-3.5 shrink-0" />
          <span>{hiddenUrls.size} artículo{hiddenUrls.size !== 1 ? "s" : ""} oculto{hiddenUrls.size !== 1 ? "s" : ""}</span>
          <button onClick={clearHidden} className="underline hover:text-foreground transition-colors">
            Mostrar todos
          </button>
        </div>
      )}

      {/* Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {articles.filter((a) => !hiddenUrls.has(a.url)).map((article, i) => (
          <ArticleCard key={`${article.url}-${i}`} article={article} borderClass={cardBorderClass} onHide={hideArticle} />
        ))}
        {loading && articles.length === 0 &&
          Array.from({ length: 8 }).map((_, i) => <ArticleCardSkeleton key={i} />)
        }
      </div>

      {/* Ver más */}
      {articles.length > 0 && (
        <div className="flex justify-center py-4">
          {loading ? (
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          ) : hasMoreRef.current ? (
            <Button variant="outline" onClick={() => { appendRef.current = true; setPage((p) => p + 1); }}>
              Ver más noticias
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
};
