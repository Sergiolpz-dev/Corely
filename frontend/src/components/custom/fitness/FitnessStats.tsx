import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dumbbell, Flame, Timer, Trophy, Loader2 } from "lucide-react";

const API_URL = "http://localhost:8000";

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("access_token")}`,
});

interface Stats {
  entrenamientos_completados: number;
  entrenamientos_objetivo: number;
  calorias_semana: number;
  tiempo_total_min: number;
  racha_dias: number;
}

const FitnessStats = () => {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/fitness/stats`, { headers: getAuthHeaders() })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => data && setStats(data))
      .catch(() => {});
  }, []);

  const formatTime = (min: number) => {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  if (!stats) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="flex items-center justify-center h-20">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card className="bg-linear-to-br from-orange-500/10 to-orange-600/10 border-orange-500/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Calorías Quemadas</CardTitle>
          <Flame className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            {stats.calorias_semana.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">Esta semana (est.)</p>
        </CardContent>
      </Card>

      <Card className="bg-linear-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Entrenamientos</CardTitle>
          <Dumbbell className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {stats.entrenamientos_completados}/{stats.entrenamientos_objetivo}
          </div>
          <p className="text-xs text-muted-foreground">Objetivo semanal</p>
        </CardContent>
      </Card>

      <Card className="bg-linear-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tiempo Total</CardTitle>
          <Timer className="h-4 w-4 text-purple-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">
            {stats.tiempo_total_min > 0 ? formatTime(stats.tiempo_total_min) : "—"}
          </div>
          <p className="text-xs text-muted-foreground">Esta semana</p>
        </CardContent>
      </Card>

      <Card className="bg-linear-to-br from-yellow-500/10 to-yellow-600/10 border-yellow-500/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Racha Actual</CardTitle>
          <Trophy className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">
            {stats.racha_dias} día{stats.racha_dias !== 1 ? "s" : ""}
          </div>
          <p className="text-xs text-muted-foreground">
            {stats.racha_dias > 0 ? "¡Sigue así!" : "Sin racha activa"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default FitnessStats;
