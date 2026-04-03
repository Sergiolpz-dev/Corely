import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dumbbell, Search } from "lucide-react";

const exercises = [
  { name: "Press de Banca", sets: 4, reps: 12, weight: "60kg", muscleGroup: "Pecho", difficulty: "Intermedio", type: "Barra" },
  { name: "Sentadillas", sets: 4, reps: 10, weight: "80kg", muscleGroup: "Piernas", difficulty: "Intermedio", type: "Barra" },
  { name: "Peso Muerto", sets: 3, reps: 8, weight: "100kg", muscleGroup: "Espalda", difficulty: "Avanzado", type: "Barra" },
  { name: "Press Militar", sets: 3, reps: 12, weight: "40kg", muscleGroup: "Hombros", difficulty: "Intermedio", type: "Barra" },
  { name: "Curl de Bíceps", sets: 3, reps: 15, weight: "15kg", muscleGroup: "Brazos", difficulty: "Principiante", type: "Mancuernas" },
  { name: "Dominadas", sets: 3, reps: 8, weight: "Cuerpo", muscleGroup: "Espalda", difficulty: "Intermedio", type: "Peso corporal" },
  { name: "Fondos en paralelas", sets: 3, reps: 12, weight: "Cuerpo", muscleGroup: "Pecho", difficulty: "Intermedio", type: "Peso corporal" },
  { name: "Extensión de cuádriceps", sets: 3, reps: 15, weight: "45kg", muscleGroup: "Piernas", difficulty: "Principiante", type: "Máquina" },
];

const difficultyStyle: Record<string, string> = {
  Principiante: "bg-green-500/10 text-green-700 border-green-500/30",
  Intermedio:   "bg-blue-500/10 text-blue-700 border-blue-500/30",
  Avanzado:     "bg-red-500/10 text-red-700 border-red-500/30",
};

const muscleGroups = ["Todos", ...Array.from(new Set(exercises.map((e) => e.muscleGroup)))];
const difficulties = ["Todos", "Principiante", "Intermedio", "Avanzado"];

const FitnessExercises = () => {
  const [search, setSearch] = useState("");
  const [muscleFilter, setMuscleFilter] = useState("Todos");
  const [difficultyFilter, setDifficultyFilter] = useState("Todos");

  const filtered = exercises.filter((ex) => {
    const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase());
    const matchesMuscle = muscleFilter === "Todos" || ex.muscleGroup === muscleFilter;
    const matchesDifficulty = difficultyFilter === "Todos" || ex.difficulty === difficultyFilter;
    return matchesSearch && matchesMuscle && matchesDifficulty;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Base de Datos de Ejercicios</CardTitle>
        <CardDescription>
          Ejercicios disponibles con grupo muscular, dificultad y tipo de material
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
              {muscleGroups.map((g) => (
                <SelectItem key={g} value={g}>{g}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Dificultad" />
            </SelectTrigger>
            <SelectContent>
              {difficulties.map((d) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Lista */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              No se encontraron ejercicios con ese filtro.
            </p>
          ) : (
            filtered.map((exercise, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-full bg-blue-500/10">
                    <Dumbbell className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">{exercise.name}</p>
                    <div className="flex gap-1.5 mt-1 flex-wrap">
                      <span className="text-xs px-2 py-0.5 rounded-full border bg-muted text-muted-foreground">
                        {exercise.muscleGroup}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full border ${difficultyStyle[exercise.difficulty] ?? difficultyStyle.Intermedio}`}
                      >
                        {exercise.difficulty}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full border bg-muted text-muted-foreground">
                        {exercise.type}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <p className="font-medium">{exercise.sets}</p>
                    <p className="text-muted-foreground text-xs">Series</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium">{exercise.reps}</p>
                    <p className="text-muted-foreground text-xs">Reps</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium">{exercise.weight}</p>
                    <p className="text-muted-foreground text-xs">Peso</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FitnessExercises;
