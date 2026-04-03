import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dumbbell, Search, Loader2 } from "lucide-react";

const API_URL = "http://localhost:8000";

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("access_token")}`,
});

interface Exercise {
  id: number;
  nombre: string;
  grupo_muscular: string;
  dificultad: string;
  tipo: string;
  series_recomendadas: number;
  repeticiones_recomendadas: number;
}

const difficultyStyle: Record<string, string> = {
  Principiante: "bg-green-500/10 text-green-700 border-green-500/30",
  Intermedio:   "bg-blue-500/10 text-blue-700 border-blue-500/30",
  Avanzado:     "bg-red-500/10 text-red-700 border-red-500/30",
};

const MUSCLE_GROUPS = ["Todos", "Pecho", "Espalda", "Hombros", "Piernas", "Bíceps", "Tríceps", "Core"];
const DIFFICULTIES  = ["Todos", "Principiante", "Intermedio", "Avanzado"];

const FitnessExercises = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [muscleFilter, setMuscleFilter] = useState("Todos");
  const [difficultyFilter, setDifficultyFilter] = useState("Todos");

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const params = new URLSearchParams();
        if (muscleFilter !== "Todos") params.set("grupo_muscular", muscleFilter);
        if (difficultyFilter !== "Todos") params.set("dificultad", difficultyFilter);
        if (search) params.set("search", search);

        const res = await fetch(`${API_URL}/fitness/exercises?${params}`, {
          headers: getAuthHeaders(),
        });
        if (res.ok) setExercises(await res.json());
      } catch {
        // error silencioso
      } finally {
        setLoading(false);
      }
    };
    fetchExercises();
  }, [search, muscleFilter, difficultyFilter]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Base de Datos de Ejercicios</CardTitle>
        <CardDescription>
          {exercises.length} ejercicios disponibles — filtra por músculo, dificultad o búsqueda
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar ejercicio..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={muscleFilter} onValueChange={setMuscleFilter}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Grupo muscular" />
            </SelectTrigger>
            <SelectContent>
              {MUSCLE_GROUPS.map((g) => (
                <SelectItem key={g} value={g}>{g}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Dificultad" />
            </SelectTrigger>
            <SelectContent>
              {DIFFICULTIES.map((d) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Lista */}
        {loading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Cargando ejercicios...
          </div>
        ) : exercises.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">
            No se encontraron ejercicios con ese filtro.
          </p>
        ) : (
          <div className="space-y-2">
            {exercises.map((exercise) => (
              <div
                key={exercise.id}
                className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-full bg-blue-500/10 shrink-0">
                    <Dumbbell className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">{exercise.nombre}</p>
                    <div className="flex gap-1.5 mt-1 flex-wrap">
                      <span className="text-xs px-2 py-0.5 rounded-full border bg-muted text-muted-foreground">
                        {exercise.grupo_muscular}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full border ${difficultyStyle[exercise.dificultad] ?? difficultyStyle.Intermedio}`}
                      >
                        {exercise.dificultad}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full border bg-muted text-muted-foreground">
                        {exercise.tipo}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm shrink-0">
                  <div className="text-center">
                    <p className="font-medium">{exercise.series_recomendadas}</p>
                    <p className="text-muted-foreground text-xs">Series</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium">{exercise.repeticiones_recomendadas}</p>
                    <p className="text-muted-foreground text-xs">Reps</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FitnessExercises;
