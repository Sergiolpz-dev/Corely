import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play } from "lucide-react";

const workoutPlans = [
  { name: "Push Day", exercises: 6, duration: "45 min", difficulty: "Intermedio", muscles: ["Pecho", "Hombros", "Tríceps"] },
  { name: "Pull Day", exercises: 5, duration: "40 min", difficulty: "Intermedio", muscles: ["Espalda", "Bíceps"] },
  { name: "Leg Day", exercises: 7, duration: "50 min", difficulty: "Avanzado", muscles: ["Cuádriceps", "Isquios", "Glúteos"] },
  { name: "Cardio HIIT", exercises: 8, duration: "30 min", difficulty: "Intenso", muscles: ["Full Body"] },
  { name: "Full Body", exercises: 10, duration: "60 min", difficulty: "Principiante", muscles: ["Todos"] },
];

const difficultyStyle: Record<string, string> = {
  Principiante: "bg-green-500/10 text-green-700 border-green-500/30",
  Intermedio:   "bg-blue-500/10 text-blue-700 border-blue-500/30",
  Avanzado:     "bg-orange-500/10 text-orange-700 border-orange-500/30",
  Intenso:      "bg-red-500/10 text-red-700 border-red-500/30",
};

const FitnessRoutines = () => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {workoutPlans.map((plan, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{plan.name}</CardTitle>
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full border ${difficultyStyle[plan.difficulty] ?? difficultyStyle.Intermedio}`}
              >
                {plan.difficulty}
              </span>
            </div>
            <CardDescription>
              {plan.exercises} ejercicios · {plan.duration}
            </CardDescription>
            <div className="flex flex-wrap gap-1 mt-1">
              {plan.muscles.map((m) => (
                <Badge key={m} variant="outline" className="text-xs">
                  {m}
                </Badge>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              <Play className="mr-2 h-4 w-4" />
              Iniciar Rutina
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default FitnessRoutines;
