import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dumbbell, Sparkles, Loader2, CheckCircle2, Circle, ChevronDown, ChevronUp } from "lucide-react";

const API_URL = "http://localhost:8000";

const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("access_token")}`,
});

interface Ejercicio {
  id: number;
  nombre: string;
  series: number;
  repeticiones: number;
  descanso_seg: number;
  notas?: string;
}

interface DiaRutina {
  dia: string;
  tipo: string;
  descanso: boolean;
  ejercicios: Ejercicio[];
}

interface Routine {
  id: number;
  semana_inicio: string;
  plan: {
    dias: DiaRutina[];
    consejos: string[];
  };
}

interface WorkoutLog {
  dia: string;
  completado: number;
}

const difficultyStyle: Record<string, string> = {
  Fuerza:    "bg-blue-500/10 text-blue-700 border-blue-500/30",
  Cardio:    "bg-orange-500/10 text-orange-700 border-orange-500/30",
  Descanso:  "bg-muted text-muted-foreground border-border",
};

const FitnessRoutines = () => {
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [expandedDia, setExpandedDia] = useState<string | null>(null);
  const [togglingDia, setTogglingDia] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchRoutine = async () => {
    try {
      const res = await fetch(`${API_URL}/fitness/routine/current`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setRoutine(data);
        if (data) await fetchLogs(data.id);
      }
    } catch {
      // sin rutina
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async (routineId: number) => {
    try {
      const res = await fetch(`${API_URL}/fitness/routine/${routineId}/logs`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) setLogs(await res.json());
    } catch {
      // sin logs
    }
  };

  useEffect(() => {
    fetchRoutine();
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/fitness/routine/generate`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setRoutine(data);
        setLogs([]);
      } else {
        const err = await res.json();
        setError(err.detail ?? "Error al generar la rutina");
      }
    } catch {
      setError("Error de conexión al generar la rutina");
    } finally {
      setGenerating(false);
    }
  };

  const handleToggleLog = async (dia: string, currentlyCompleted: boolean) => {
    if (!routine) return;
    setTogglingDia(dia);
    try {
      const res = await fetch(
        `${API_URL}/fitness/routine/${routine.id}/log`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            dia,
            completado: currentlyCompleted ? 0 : 1,
          }),
        }
      );
      if (res.ok) {
        const updated = await res.json();
        setLogs((prev) => {
          const filtered = prev.filter((l) => l.dia !== dia);
          return [...filtered, { dia: updated.dia, completado: updated.completado }];
        });
      }
    } catch {
      // error silencioso
    } finally {
      setTogglingDia(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        Cargando rutina...
      </div>
    );
  }

  if (!routine) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="p-4 rounded-full bg-blue-500/10">
            <Dumbbell className="h-8 w-8 text-blue-600" />
          </div>
          <div className="text-center">
            <h3 className="font-semibold text-lg">Sin rutina esta semana</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Genera una rutina personalizada con IA basada en tu perfil
            </p>
          </div>
          {error && (
            <p className="text-sm text-red-600 bg-red-500/10 px-3 py-2 rounded-lg border border-red-500/20">
              {error}
            </p>
          )}
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
            onClick={handleGenerate}
            disabled={generating}
          >
            {generating ? (
              <><Loader2 className="h-4 w-4 animate-spin" />Generando rutina...</>
            ) : (
              <><Sparkles className="h-4 w-4" />Generar rutina con IA</>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const dias = routine.plan?.dias ?? [];
  const consejos = routine.plan?.consejos ?? [];
  const diasEntreno = dias.filter((d) => !d.descanso);

  return (
    <div className="space-y-4">
      {/* Header con info + botón regenerar */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Semana del {new Date(routine.semana_inicio + "T12:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "long" })}
            {" · "}
            {logs.filter((l) => l.completado === 1).length}/{diasEntreno.length} entrenamientos completados
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={handleGenerate}
          disabled={generating}
        >
          {generating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
          Nueva rutina
        </Button>
      </div>

      {/* Días */}
      <div className="space-y-3">
        {dias.map((dia) => {
          const log = logs.find((l) => l.dia === dia.dia);
          const completado = (log?.completado ?? 0) === 1;
          const isExpanded = expandedDia === dia.dia;
          const isToggling = togglingDia === dia.dia;

          return (
            <Card
              key={dia.dia}
              className={`transition-all ${
                dia.descanso
                  ? "opacity-60"
                  : completado
                  ? "border-green-500/30 bg-green-500/5"
                  : ""
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {!dia.descanso && (
                      <button
                        onClick={() => !isToggling && handleToggleLog(dia.dia, completado)}
                        disabled={isToggling}
                        className="shrink-0"
                      >
                        {isToggling ? (
                          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        ) : completado ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground hover:text-blue-500 transition-colors" />
                        )}
                      </button>
                    )}
                    <div>
                      <CardTitle className={`text-base ${completado ? "line-through text-muted-foreground" : ""}`}>
                        {dia.dia}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-0.5">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full border ${
                            difficultyStyle[dia.tipo] ?? difficultyStyle.Fuerza
                          }`}
                        >
                          {dia.tipo}
                        </span>
                        {!dia.descanso && (
                          <span className="text-xs text-muted-foreground">
                            {dia.ejercicios.length} ejercicios
                          </span>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                  {!dia.descanso && (
                    <button
                      onClick={() => setExpandedDia(isExpanded ? null : dia.dia)}
                      className="text-muted-foreground hover:text-foreground transition-colors p-1"
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </div>
              </CardHeader>

              {isExpanded && !dia.descanso && (
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {dia.ejercicios.map((ej, i) => (
                      <div
                        key={i}
                        className="flex items-start justify-between p-3 rounded-lg bg-muted/40 border"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-sm">{ej.nombre}</p>
                          {ej.notas && (
                            <p className="text-xs text-muted-foreground mt-0.5">{ej.notas}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm ml-4">
                          <div className="text-center">
                            <p className="font-medium">{ej.series}</p>
                            <p className="text-xs text-muted-foreground">Series</p>
                          </div>
                          <div className="text-center">
                            <p className="font-medium">{ej.repeticiones}</p>
                            <p className="text-xs text-muted-foreground">Reps</p>
                          </div>
                          <div className="text-center">
                            <p className="font-medium">{ej.descanso_seg}s</p>
                            <p className="text-xs text-muted-foreground">Descanso</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Consejos de la IA */}
      {consejos.length > 0 && (
        <Card className="bg-blue-500/5 border-blue-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-blue-700">
              <Sparkles className="h-4 w-4" />
              Consejos de tu entrenador IA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {consejos.map((c, i) => (
                <li key={i} className="text-sm text-muted-foreground flex gap-2">
                  <span className="text-blue-500 font-bold shrink-0">·</span>
                  {c}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FitnessRoutines;
