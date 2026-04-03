import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const weeklyWorkouts = [
  { day: "Lun", completed: true, type: "Fuerza" },
  { day: "Mar", completed: true, type: "Cardio" },
  { day: "Mié", completed: false, type: "Descanso" },
  { day: "Jue", completed: true, type: "Fuerza" },
  { day: "Vie", completed: false, type: "Pendiente" },
  { day: "Sáb", completed: false, type: "Cardio" },
  { day: "Dom", completed: false, type: "Descanso" },
];

const FitnessWeekly = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Semana Actual</CardTitle>
        <CardDescription>Tu progreso de entrenamiento esta semana</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {weeklyWorkouts.map((day, index) => (
            <div
              key={index}
              className={`flex flex-col items-center p-3 rounded-lg border transition-colors ${
                day.completed
                  ? "bg-green-500/10 border-green-500/40"
                  : day.type === "Descanso"
                  ? "bg-muted/40 border-border"
                  : "bg-background border-border"
              }`}
            >
              <span className="text-sm font-medium">{day.day}</span>
              <span
                className={`text-xs mt-1 ${
                  day.completed
                    ? "text-green-600 font-medium"
                    : "text-muted-foreground"
                }`}
              >
                {day.type}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default FitnessWeekly;
