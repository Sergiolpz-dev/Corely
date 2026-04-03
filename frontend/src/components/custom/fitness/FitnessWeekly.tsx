import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const API_URL = "http://localhost:8000";

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("access_token")}`,
});

const DIAS_ES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const DIAS_SHORT = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

interface DiaRutina {
  dia: string;
  tipo: string;
  descanso: boolean;
  ejercicios: unknown[];
}

interface WorkoutLog {
  dia: string;
  completado: number;
}

const FitnessWeekly = () => {
  const [dias, setDias] = useState<DiaRutina[]>([]);
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/fitness/routine/current`, {
          headers: getAuthHeaders(),
        });
        if (res.ok) {
          const routine = await res.json();
          if (routine) {
            setDias(routine.plan?.dias ?? []);
            // Cargar logs
            const logsRes = await fetch(
              `${API_URL}/fitness/routine/${routine.id}/logs`,
              { headers: getAuthHeaders() }
            );
            if (logsRes.ok) setLogs(await logsRes.json());
          }
        }
      } catch {
        // sin rutina
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-24">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // Si no hay rutina, mostrar los 7 días vacíos
  const weekDays = DIAS_ES.map((diaName, idx) => {
    const rutinaDia = dias.find((d) => d.dia === diaName);
    const log = logs.find((l) => l.dia === diaName);
    const completado = (log?.completado ?? 0) === 1;
    const descanso = rutinaDia?.descanso ?? false;
    const tipo = rutinaDia?.tipo ?? (descanso ? "Descanso" : "—");

    return { short: DIAS_SHORT[idx], nombre: diaName, tipo, completado, descanso };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Semana Actual</CardTitle>
        <CardDescription>
          {dias.length > 0
            ? "Progreso de tu rutina esta semana"
            : "Genera una rutina para ver tu plan semanal"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day, index) => (
            <div
              key={index}
              className={`flex flex-col items-center p-3 rounded-lg border transition-colors ${
                day.completado
                  ? "bg-green-500/10 border-green-500/40"
                  : day.descanso
                  ? "bg-muted/40 border-border"
                  : dias.length > 0
                  ? "bg-background border-border"
                  : "bg-muted/20 border-border"
              }`}
            >
              <span className="text-sm font-medium">{day.short}</span>
              <span
                className={`text-xs mt-1 ${
                  day.completado
                    ? "text-green-600 font-medium"
                    : "text-muted-foreground"
                }`}
              >
                {day.tipo}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default FitnessWeekly;
