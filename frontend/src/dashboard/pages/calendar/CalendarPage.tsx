import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Plus, ChevronLeft, ChevronRight, RefreshCw, Link2,
    Calendar, CheckSquare, MapPin, Clock, X, Trash2, Edit2,
    AlertCircle, CalendarCheck, Search,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

interface CalendarEvent {
    id: number;
    id_user: number;
    title: string;
    description?: string;
    start_datetime: string;
    end_datetime?: string;
    event_type: string;
    location?: string;
    is_google_event: boolean;
    google_event_id?: string;
    created_at: string;
}

interface Task {
    id: number;
    id_user: number;
    name: string;
    priority: "low" | "medium" | "high";
    status: string;
    due_date: string;
    created_at: string;
    description?: string;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const BASE_URL = "http://localhost:8000";

const MONTH_NAMES = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const DAY_NAMES = ["L", "M", "X", "J", "V", "S", "D"];

const EVENT_TYPE_LABELS: Record<string, string> = {
    meeting: "Reunión",
    presentation: "Presentación",
    planning: "Planificación",
    other: "Otro",
};

const EVENT_TYPE_COLORS: Record<string, string> = {
    meeting: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    presentation: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    planning: "bg-green-500/10 text-green-500 border-green-500/20",
    other: "bg-muted text-muted-foreground border-border",
};

const BASE_TYPES = Object.keys(EVENT_TYPE_LABELS);
const getTypeLabel = (type: string) => EVENT_TYPE_LABELS[type] ?? type;
const getTypeColor = (type: string) => EVENT_TYPE_COLORS[type] ?? EVENT_TYPE_COLORS.other;

const PRIORITY_COLORS: Record<string, string> = {
    high: "text-red-500",
    medium: "text-yellow-500",
    low: "text-blue-400",
};

const PRIORITY_LABELS: Record<string, string> = {
    high: "Alta",
    medium: "Media",
    low: "Baja",
};

// ── Helpers ────────────────────────────────────────────────────────────────────

const getAuthHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("access_token")}`,
});

const isSameDay = (d1: Date, d2: Date) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

const toDatetimeLocal = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// Genera 42 celdas (6 semanas) para el mes, comenzando en Lunes
const getCalendarDays = (month: Date): { date: Date; isCurrentMonth: boolean }[] => {
    const year = month.getFullYear();
    const m = month.getMonth();
    const firstDay = new Date(year, m, 1);
    const lastDay = new Date(year, m + 1, 0);

    // 0=Lunes … 6=Domingo
    const startOffset = (firstDay.getDay() + 6) % 7;

    const days: { date: Date; isCurrentMonth: boolean }[] = [];

    for (let i = startOffset - 1; i >= 0; i--) {
        days.push({ date: new Date(year, m, -i), isCurrentMonth: false });
    }
    for (let d = 1; d <= lastDay.getDate(); d++) {
        days.push({ date: new Date(year, m, d), isCurrentMonth: true });
    }
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
        days.push({ date: new Date(year, m + 1, i), isCurrentMonth: false });
    }

    return days;
};

// Parsea due_date de tareas manejando el caso UTC-midnight de TaskPage
const parseTaskDate = (dateStr: string): Date => {
    const d = new Date(dateStr);
    if (d.getUTCHours() === 0 && d.getUTCMinutes() === 0 && d.getUTCSeconds() === 0) {
        return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
    }
    return d;
};

// ── Component ──────────────────────────────────────────────────────────────────

export const CalendarPage = () => {
    const navigate = useNavigate();
    const today = new Date();

    // ── State ──────────────────────────────────────────────────────────────────
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [currentMonth, setCurrentMonth] = useState(
        new Date(today.getFullYear(), today.getMonth(), 1)
    );
    const [selectedDay, setSelectedDay] = useState<Date | null>(null);
    const [isGoogleConnected, setIsGoogleConnected] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [syncMessage, setSyncMessage] = useState<{ text: string; ok: boolean } | null>(null);

    // Modal: detalle del día
    const [showDayModal, setShowDayModal] = useState(false);

    // Modal: crear / editar evento
    const [showEventModal, setShowEventModal] = useState(false);
    const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

    // Formulario del evento
    const [formTitle, setFormTitle] = useState("");
    const [formDescription, setFormDescription] = useState("");
    const [formStart, setFormStart] = useState("");
    const [formEnd, setFormEnd] = useState("");
    const [formType, setFormType] = useState("other");
    const [formLocation, setFormLocation] = useState("");
    const [formCreateInGoogle, setFormCreateInGoogle] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [formCustomType, setFormCustomType] = useState("");

    // Panel próximos eventos
    const [searchQuery, setSearchQuery] = useState("");
    const [filterType, setFilterType] = useState("all");

    // ── Effects ────────────────────────────────────────────────────────────────
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get("google_connected") === "true") {
            setIsGoogleConnected(true);
            showSyncMsg("¡Google Calendar conectado correctamente!", true);
            window.history.replaceState({}, "", "/calendario");
        }
        fetchAll();
    }, []);

    // ── Data ───────────────────────────────────────────────────────────────────
    const fetchAll = async () => {
        setIsLoading(true);
        await Promise.all([fetchEvents(), fetchTasks(), fetchGoogleStatus()]);
        setIsLoading(false);
    };

    const fetchEvents = async () => {
        try {
            const res = await fetch(`${BASE_URL}/events`, { headers: getAuthHeaders() });
            if (res.ok) setEvents(await res.json());
        } catch { /* silencioso */ }
    };

    const fetchTasks = async () => {
        try {
            const res = await fetch(`${BASE_URL}/tasks`, { headers: getAuthHeaders() });
            if (res.ok) setTasks(await res.json());
        } catch { /* silencioso */ }
    };

    const fetchGoogleStatus = async () => {
        try {
            const res = await fetch(`${BASE_URL}/events/google/status`, { headers: getAuthHeaders() });
            if (res.ok) setIsGoogleConnected((await res.json()).connected);
        } catch { /* silencioso */ }
    };

    // ── Utils ──────────────────────────────────────────────────────────────────
    const showSyncMsg = (text: string, ok: boolean) => {
        setSyncMessage({ text, ok });
        setTimeout(() => setSyncMessage(null), 4000);
    };

    const getEventsForDay = (date: Date) =>
        events.filter(e => isSameDay(new Date(e.start_datetime), date));

    const getTasksForDay = (date: Date) =>
        tasks.filter(t => isSameDay(parseTaskDate(t.due_date), date));

    // Estadísticas
    const todayEvents = getEventsForDay(today);
    const todayTasks = getTasksForDay(today);

    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    const weekEventsCount = events.filter(e => {
        const d = new Date(e.start_datetime);
        return d >= weekStart && d <= weekEnd;
    }).length;

    const googleEventsCount = events.filter(e => e.is_google_event).length;

    // Tipos custom derivados de los eventos existentes en BD
    const customEventTypes = useMemo(() =>
        [...new Set(events.map(e => e.event_type).filter(t => !BASE_TYPES.includes(t)))],
        [events]
    );

    // Próximos eventos filtrados para el panel lateral
    const filteredUpcoming = useMemo(() => {
        const q = searchQuery.toLowerCase();
        return events
            .filter(e => new Date(e.start_datetime) >= today)
            .filter(e => filterType === "all" || e.event_type === filterType)
            .filter(e =>
                e.title.toLowerCase().includes(q) ||
                (e.description ?? "").toLowerCase().includes(q) ||
                (e.location ?? "").toLowerCase().includes(q)
            )
            .sort((a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime());
    }, [events, searchQuery, filterType]);

    // ── Handlers ───────────────────────────────────────────────────────────────
    const handleDayClick = (date: Date) => {
        setSelectedDay(date);
        setShowDayModal(true);
    };

    const openCreateModal = (date?: Date) => {
        setEditingEvent(null);
        const base = date || today;
        const start = new Date(base.getFullYear(), base.getMonth(), base.getDate(), 9, 0);
        const end = new Date(base.getFullYear(), base.getMonth(), base.getDate(), 10, 0);
        setFormTitle("");
        setFormDescription("");
        setFormStart(toDatetimeLocal(start));
        setFormEnd(toDatetimeLocal(end));
        setFormType("other");
        setFormLocation("");
        setFormCreateInGoogle(false);
        setFormError(null);
        setShowEventModal(true);
    };

    const openEditModal = (event: CalendarEvent) => {
        setEditingEvent(event);
        const start = new Date(event.start_datetime);
        const end = event.end_datetime
            ? new Date(event.end_datetime)
            : new Date(start.getTime() + 3600_000);
        setFormTitle(event.title);
        setFormDescription(event.description || "");
        setFormStart(toDatetimeLocal(start));
        setFormEnd(toDatetimeLocal(end));
        setFormType(event.event_type);
        setFormLocation(event.location || "");
        setFormCreateInGoogle(false);
        setFormError(null);
        setShowEventModal(true);
    };

    const handleSaveEvent = async () => {
        if (!formTitle.trim()) { setFormError("El título es obligatorio"); return; }
        if (!formStart) { setFormError("La fecha de inicio es obligatoria"); return; }

        const actualType = formType === "__custom__" ? formCustomType.trim() : formType;
        if (!actualType) { setFormError("El tipo personalizado no puede estar vacío"); return; }

        setIsSaving(true);
        setFormError(null);

        const body = {
            title: formTitle.trim(),
            description: formDescription.trim() || undefined,
            start_datetime: new Date(formStart).toISOString(),
            end_datetime: formEnd ? new Date(formEnd).toISOString() : undefined,
            event_type: actualType,
            location: formLocation.trim() || undefined,
            ...(editingEvent ? {} : { create_in_google: formCreateInGoogle }),
        };

        try {
            if (editingEvent) {
                const res = await fetch(`${BASE_URL}/events/${editingEvent.id}`, {
                    method: "PUT",
                    headers: getAuthHeaders(),
                    body: JSON.stringify(body),
                });
                if (!res.ok) throw new Error((await res.json()).detail);
                const updated = await res.json();
                setEvents(prev => prev.map(e => e.id === updated.id ? updated : e));
            } else {
                const res = await fetch(`${BASE_URL}/events`, {
                    method: "POST",
                    headers: getAuthHeaders(),
                    body: JSON.stringify(body),
                });
                if (!res.ok) throw new Error((await res.json()).detail);
                const created = await res.json();
                setEvents(prev => [...prev, created]);
            }
            setShowEventModal(false);
        } catch (e: any) {
            setFormError(e.message || "Error al guardar el evento");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteEvent = async (eventId: number) => {
        try {
            const res = await fetch(`${BASE_URL}/events/${eventId}`, {
                method: "DELETE",
                headers: getAuthHeaders(),
            });
            if (res.ok) setEvents(prev => prev.filter(e => e.id !== eventId));
        } catch { /* silencioso */ }
    };

    const handleGoogleConnect = async () => {
        try {
            const res = await fetch(`${BASE_URL}/events/google/auth-url`, { headers: getAuthHeaders() });
            if (res.ok) {
                const { url } = await res.json();
                window.location.href = url;
            }
        } catch { /* silencioso */ }
    };

    const handleGoogleSync = async () => {
        setIsSyncing(true);
        try {
            const res = await fetch(`${BASE_URL}/events/sync-google`, {
                method: "POST",
                headers: getAuthHeaders(),
            });
            if (res.ok) {
                const synced = await res.json();
                await fetchEvents();
                showSyncMsg(`${synced.length} evento${synced.length !== 1 ? "s" : ""} sincronizados de Google Calendar`, true);
            } else {
                showSyncMsg("Error al sincronizar. Intenta reconectar Google Calendar.", false);
            }
        } catch {
            showSyncMsg("Error de conexión al sincronizar.", false);
        } finally {
            setIsSyncing(false);
        }
    };

    const prevMonth = () => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1));
    const nextMonth = () => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1));
    const goToToday = () => {
        setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
        setSelectedDay(today);
    };

    // ── Grid ───────────────────────────────────────────────────────────────────
    const calendarDays = getCalendarDays(currentMonth);

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-6">

            {/* ── Header ────────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Calendario</h2>
                    <p className="text-muted-foreground">Organiza tus eventos y reuniones</p>
                </div>
                <div className="flex gap-2">
                    {!isGoogleConnected ? (
                        <Button variant="outline" className="gap-2" onClick={handleGoogleConnect}>
                            <Link2 className="h-4 w-4" />
                            Conectar Google Calendar
                        </Button>
                    ) : (
                        <Button
                            variant="outline"
                            className="gap-2"
                            onClick={handleGoogleSync}
                            disabled={isSyncing}
                        >
                            <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
                            {isSyncing ? "Sincronizando..." : "Sincronizar Google"}
                        </Button>
                    )}
                    <Button
                        className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => openCreateModal()}
                    >
                        <Plus className="h-4 w-4" />
                        Nuevo Evento
                    </Button>
                </div>
            </div>

            {/* ── Sync message ──────────────────────────────────────────────── */}
            {syncMessage && (
                <div className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm border ${syncMessage.ok
                    ? "bg-green-500/10 text-green-600 border-green-500/20"
                    : "bg-destructive/10 text-destructive border-destructive/20"
                    }`}>
                    <CalendarCheck className="h-4 w-4 flex-shrink-0" />
                    {syncMessage.text}
                </div>
            )}

            {/* ── Stats ─────────────────────────────────────────────────────── */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Eventos Hoy</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{todayEvents.length}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {todayEvents.length === 0 ? "Sin eventos hoy" : `${todayEvents.length} evento${todayEvents.length > 1 ? "s" : ""} programado${todayEvents.length > 1 ? "s" : ""}`}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Tareas Hoy</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{todayTasks.length}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {todayTasks.filter(t => t.status !== "completed").length} pendientes
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Esta Semana</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{weekEventsCount}</div>
                        <p className="text-xs text-muted-foreground mt-1">eventos en 7 días</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Google Calendar</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 mt-1">
                            <div className={`w-2 h-2 rounded-full ${isGoogleConnected ? "bg-green-500" : "bg-muted-foreground"}`} />
                            <span className="text-sm font-medium">
                                {isGoogleConnected ? "Conectado" : "No conectado"}
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {googleEventsCount} evento{googleEventsCount !== 1 ? "s" : ""} sincronizado{googleEventsCount !== 1 ? "s" : ""}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* ── Main layout ───────────────────────────────────────────────── */}
            <div className="grid gap-4 lg:grid-cols-3">

                {/* ── Calendar grid ─────────────────────────────────────────── */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">
                                {MONTH_NAMES[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                            </CardTitle>
                            <div className="flex items-center gap-1">
                                <Button variant="outline" size="sm" onClick={goToToday} className="text-xs px-2 h-8">
                                    Hoy
                                </Button>
                                <Button variant="ghost" size="icon" onClick={prevMonth} className="h-8 w-8">
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={nextMonth} className="h-8 w-8">
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {/* Day headers */}
                        <div className="grid grid-cols-7 mb-1">
                            {DAY_NAMES.map(d => (
                                <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">
                                    {d}
                                </div>
                            ))}
                        </div>

                        {/* Grid cells */}
                        <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden border">
                            {calendarDays.map(({ date, isCurrentMonth }, idx) => {
                                const dayEvents = getEventsForDay(date);
                                const dayTasks = getTasksForDay(date);
                                const ourEvents = dayEvents.filter(e => !e.is_google_event);
                                const googleEvents = dayEvents.filter(e => e.is_google_event);
                                const total = dayEvents.length + dayTasks.length;
                                const isToday = isSameDay(date, today);
                                const isSelected = selectedDay ? isSameDay(date, selectedDay) : false;

                                // Cuántos pills mostrar (max 2)
                                const pills: { label: string; cls: string }[] = [];
                                for (const e of ourEvents) {
                                    if (pills.length >= 2) break;
                                    pills.push({ label: e.title, cls: "bg-blue-500/15 text-blue-600" });
                                }
                                for (const e of googleEvents) {
                                    if (pills.length >= 2) break;
                                    pills.push({ label: e.title, cls: "bg-green-500/15 text-green-600" });
                                }
                                for (const t of dayTasks) {
                                    if (pills.length >= 2) break;
                                    pills.push({ label: t.name, cls: "bg-orange-500/15 text-orange-600" });
                                }
                                const overflow = total - pills.length;

                                return (
                                    <button
                                        key={idx}
                                        onClick={() => handleDayClick(date)}
                                        className={`
                                            bg-card min-h-[80px] p-1.5 text-left transition-colors
                                            hover:bg-muted/60 cursor-pointer
                                            ${!isCurrentMonth ? "opacity-40" : ""}
                                            ${isSelected ? "ring-2 ring-inset ring-blue-500" : ""}
                                        `}
                                    >
                                        <div className={`
                                            text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full mb-1
                                            ${isToday ? "bg-blue-600 text-white" : ""}
                                        `}>
                                            {date.getDate()}
                                        </div>
                                        <div className="space-y-0.5">
                                            {pills.map((p, i) => (
                                                <div
                                                    key={i}
                                                    className={`text-xs truncate px-1 py-0.5 rounded leading-tight ${p.cls}`}
                                                >
                                                    {p.label}
                                                </div>
                                            ))}
                                            {overflow > 0 && (
                                                <div className="text-xs text-muted-foreground px-1">
                                                    +{overflow} más
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Legend */}
                        <div className="flex flex-wrap gap-4 mt-3 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded bg-blue-500/20" />
                                <span>Mis eventos</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded bg-green-500/20" />
                                <span>Google Calendar</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded bg-orange-500/20" />
                                <span>Tareas</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* ── Right panel — Próximos Eventos ────────────────────── */}
                <div className="space-y-4">
                    <Card className="flex flex-col" style={{ maxHeight: "580px" }}>
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm">Próximos Eventos</CardTitle>
                                <Button
                                    size="sm"
                                    className="h-7 text-xs gap-1 bg-blue-600 hover:bg-blue-700 text-white"
                                    onClick={() => openCreateModal()}
                                >
                                    <Plus className="h-3 w-3" /> Evento
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0 flex flex-col gap-3 overflow-hidden flex-1">
                            {/* Buscador */}
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                                <Input
                                    className="pl-8 h-8 text-xs"
                                    placeholder="Buscar eventos..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                            </div>

                            {/* Chips de filtro por tipo */}
                            <div className="flex flex-wrap gap-1">
                                {[
                                    { key: "all", label: "Todos" },
                                    ...BASE_TYPES.map(t => ({ key: t, label: EVENT_TYPE_LABELS[t] })),
                                    ...customEventTypes.map(t => ({ key: t, label: t })),
                                ].map(({ key, label }) => (
                                    <button
                                        key={key}
                                        onClick={() => setFilterType(key)}
                                        className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                                            filterType === key
                                                ? "bg-blue-600 text-white border-blue-600"
                                                : "bg-muted text-muted-foreground border-border hover:border-blue-400"
                                        }`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>

                            {/* Lista de eventos */}
                            <div className="space-y-2 overflow-y-auto flex-1 pr-0.5">
                                {filteredUpcoming.length === 0 ? (
                                    <p className="text-xs text-muted-foreground text-center py-6">
                                        {searchQuery || filterType !== "all"
                                            ? "Sin resultados"
                                            : "No hay próximos eventos"}
                                    </p>
                                ) : (
                                    filteredUpcoming.map(e => (
                                        <button
                                            key={e.id}
                                            onClick={() => handleDayClick(new Date(e.start_datetime))}
                                            className={`w-full text-left p-2.5 rounded-lg border transition-colors hover:bg-muted/60 ${
                                                e.is_google_event
                                                    ? "bg-green-500/5 border-green-500/20"
                                                    : "bg-blue-500/5 border-blue-500/20"
                                            }`}
                                        >
                                            <span className={`inline-block text-xs px-1.5 py-0.5 rounded-full border mb-1 ${
                                                e.is_google_event
                                                    ? "bg-green-500/10 text-green-600 border-green-500/20"
                                                    : getTypeColor(e.event_type)
                                            }`}>
                                                {e.is_google_event ? "Google" : getTypeLabel(e.event_type)}
                                            </span>
                                            <p className="text-xs font-medium truncate">{e.title}</p>
                                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                                <Clock className="h-3 w-3 flex-shrink-0" />
                                                {new Date(e.start_datetime).toLocaleDateString("es-ES", {
                                                    day: "numeric", month: "short", weekday: "short",
                                                })}
                                                {" · "}
                                                {new Date(e.start_datetime).toLocaleTimeString("es-ES", {
                                                    hour: "2-digit", minute: "2-digit",
                                                })}
                                            </p>
                                            {e.location && (
                                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                                    <MapPin className="h-3 w-3 flex-shrink-0" />
                                                    <span className="truncate">{e.location}</span>
                                                </p>
                                            )}
                                        </button>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* ── Day Detail Modal ────────────────────────────────────────── */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            {showDayModal && selectedDay && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                    onClick={() => setShowDayModal(false)}
                >
                    <div
                        className="bg-card rounded-xl border shadow-xl w-full max-w-md max-h-[85vh] flex flex-col"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="font-semibold capitalize">
                                {selectedDay.toLocaleDateString("es-ES", {
                                    weekday: "long", day: "numeric",
                                    month: "long", year: "numeric",
                                })}
                            </h3>
                            <Button variant="ghost" size="icon" onClick={() => setShowDayModal(false)} className="h-8 w-8">
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Body */}
                        <div className="p-4 space-y-5 overflow-y-auto flex-1">

                            {/* Eventos */}
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <Calendar className="h-4 w-4 text-blue-500" />
                                    <h4 className="text-sm font-semibold">
                                        Eventos ({getEventsForDay(selectedDay).length})
                                    </h4>
                                </div>
                                {getEventsForDay(selectedDay).length === 0 ? (
                                    <p className="text-xs text-muted-foreground ml-6">Sin eventos este día</p>
                                ) : (
                                    <div className="space-y-2">
                                        {getEventsForDay(selectedDay).map(e => (
                                            <div
                                                key={e.id}
                                                className={`p-3 rounded-lg border ${e.is_google_event
                                                    ? "bg-green-500/5 border-green-500/20"
                                                    : "bg-blue-500/5 border-blue-500/20"}`}
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className={`text-xs px-2 py-0.5 rounded-full border ${e.is_google_event
                                                                ? "bg-green-500/10 text-green-600 border-green-500/20"
                                                                : getTypeColor(e.event_type)}`}>
                                                                {e.is_google_event ? "Google Calendar" : getTypeLabel(e.event_type)}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm font-medium truncate">{e.title}</p>
                                                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                                                            <span className="flex items-center gap-1">
                                                                <Clock className="h-3 w-3" />
                                                                {new Date(e.start_datetime).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                                                                {e.end_datetime && ` - ${new Date(e.end_datetime).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}`}
                                                            </span>
                                                            {e.location && (
                                                                <span className="flex items-center gap-1">
                                                                    <MapPin className="h-3 w-3" />
                                                                    {e.location}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {e.description && (
                                                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                                {e.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                    {!e.is_google_event && (
                                                        <div className="flex gap-1 flex-shrink-0">
                                                            <Button
                                                                variant="ghost" size="icon" className="h-7 w-7"
                                                                onClick={() => { setShowDayModal(false); openEditModal(e); }}
                                                            >
                                                                <Edit2 className="h-3 w-3" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost" size="icon"
                                                                className="h-7 w-7 text-destructive hover:text-destructive"
                                                                onClick={() => handleDeleteEvent(e.id)}
                                                            >
                                                                <Trash2 className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Tareas */}
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <CheckSquare className="h-4 w-4 text-orange-500" />
                                    <h4 className="text-sm font-semibold">
                                        Tareas ({getTasksForDay(selectedDay).length})
                                    </h4>
                                </div>
                                {getTasksForDay(selectedDay).length === 0 ? (
                                    <p className="text-xs text-muted-foreground ml-6">Sin tareas para este día</p>
                                ) : (
                                    <div className="space-y-2">
                                        {getTasksForDay(selectedDay).map(t => (
                                            <div key={t.id} className="p-3 rounded-lg border bg-orange-500/5 border-orange-500/20">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-xs font-semibold ${PRIORITY_COLORS[t.priority]}`}>
                                                        {PRIORITY_LABELS[t.priority]}
                                                    </span>
                                                    <p className={`text-sm flex-1 truncate ${t.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
                                                        {t.name}
                                                    </p>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full border ${t.status === "completed"
                                                        ? "bg-green-500/10 text-green-600 border-green-500/20"
                                                        : "bg-muted text-muted-foreground border-border"}`}>
                                                        {t.status === "completed" ? "Completada" : "Pendiente"}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t flex gap-2">
                            <Button
                                className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                                onClick={() => { setShowDayModal(false); openCreateModal(selectedDay); }}
                            >
                                <Plus className="h-4 w-4" />
                                Añadir evento
                            </Button>
                            <Button
                                variant="outline"
                                className="flex-1 gap-2"
                                onClick={() => { setShowDayModal(false); navigate("/tareas"); }}
                            >
                                <CheckSquare className="h-4 w-4" />
                                Ir a Tareas
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* ── Create / Edit Event Modal ───────────────────────────────── */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            {showEventModal && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                    onClick={() => setShowEventModal(false)}
                >
                    <div
                        className="bg-card rounded-xl border shadow-xl w-full max-w-lg"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="font-semibold">
                                {editingEvent ? "Editar evento" : "Nuevo evento"}
                            </h3>
                            <Button variant="ghost" size="icon" onClick={() => setShowEventModal(false)} className="h-8 w-8">
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Body */}
                        <div className="p-4 space-y-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="ev-title">Título *</Label>
                                <Input
                                    id="ev-title"
                                    value={formTitle}
                                    onChange={e => setFormTitle(e.target.value)}
                                    placeholder="Nombre del evento"
                                    autoFocus
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="ev-desc">Descripción</Label>
                                <textarea
                                    id="ev-desc"
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none min-h-[64px] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0"
                                    value={formDescription}
                                    onChange={e => setFormDescription(e.target.value)}
                                    placeholder="Descripción opcional..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="ev-start">Inicio *</Label>
                                    <Input
                                        id="ev-start"
                                        type="datetime-local"
                                        value={formStart}
                                        onChange={e => setFormStart(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="ev-end">Fin</Label>
                                    <Input
                                        id="ev-end"
                                        type="datetime-local"
                                        value={formEnd}
                                        onChange={e => setFormEnd(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="ev-type">Tipo</Label>
                                    <select
                                        id="ev-type"
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                        value={formType}
                                        onChange={e => { setFormType(e.target.value); setFormCustomType(""); }}
                                    >
                                        <option value="other">Otro</option>
                                        <option value="meeting">Reunión</option>
                                        <option value="presentation">Presentación</option>
                                        <option value="planning">Planificación</option>
                                        {customEventTypes.map(t => (
                                            <option key={t} value={t}>{t}</option>
                                        ))}
                                        <option value="__custom__">+ Personalizado...</option>
                                    </select>
                                    {formType === "__custom__" && (
                                        <Input
                                            className="mt-1.5"
                                            placeholder="Nombre del tipo (máx. 20 car.)"
                                            maxLength={20}
                                            value={formCustomType}
                                            onChange={e => setFormCustomType(e.target.value)}
                                            autoFocus
                                        />
                                    )}
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="ev-location">Ubicación</Label>
                                    <Input
                                        id="ev-location"
                                        value={formLocation}
                                        onChange={e => setFormLocation(e.target.value)}
                                        placeholder="Sala, Zoom, Meet..."
                                    />
                                </div>
                            </div>

                            {/* Google Calendar checkbox — solo al crear y si está conectado */}
                            {isGoogleConnected && !editingEvent && (
                                <label
                                    htmlFor="ev-google"
                                    className="flex items-center gap-3 p-3 rounded-lg bg-muted cursor-pointer select-none"
                                >
                                    <input
                                        type="checkbox"
                                        id="ev-google"
                                        checked={formCreateInGoogle}
                                        onChange={e => setFormCreateInGoogle(e.target.checked)}
                                        className="h-4 w-4 rounded border-input accent-blue-600"
                                    />
                                    <span className="text-sm">Crear también en Google Calendar</span>
                                </label>
                            )}

                            {formError && (
                                <div className="flex items-center gap-2 text-sm text-destructive">
                                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                    {formError}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t flex gap-2 justify-end">
                            <Button variant="outline" onClick={() => setShowEventModal(false)}>
                                Cancelar
                            </Button>
                            <Button
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                onClick={handleSaveEvent}
                                disabled={isSaving}
                            >
                                {isSaving
                                    ? "Guardando..."
                                    : editingEvent ? "Guardar cambios" : "Crear evento"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};
