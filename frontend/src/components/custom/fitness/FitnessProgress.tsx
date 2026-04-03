import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Trophy, Dumbbell, Flame, Calendar } from "lucide-react";

const bodyStats = [
  { label: "Peso", value: "75 kg", change: "-2 kg", positive: true },
  { label: "Grasa Corporal", value: "18%", change: "-1.5%", positive: true },
  { label: "Masa Muscular", value: "35 kg", change: "+1.2 kg", positive: true },
  { label: "IMC", value: "23.5", change: "-0.3", positive: true },
];

const strengthGoals = [
  { name: "Press de Banca", current: 80, goal: 100 },
  { name: "Sentadilla", current: 100, goal: 120 },
  { name: "Peso Muerto", current: 120, goal: 150 },
  { name: "Press Militar", current: 50, goal: 60 },
];

const achievements = [
  { name: "Primera Semana", description: "Completar 7 días de entrenamiento", progress: 100, icon: Trophy },
  { name: "Levantador", description: "Levantar 100kg en peso muerto", progress: 100, icon: Dumbbell },
  { name: "Maratonista", description: "Correr 42km en total", progress: 65, icon: Flame },
  { name: "Constancia", description: "30 días consecutivos", progress: 40, icon: Calendar },
];

const FitnessProgress = () => {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Métricas Corporales</CardTitle>
            <CardDescription>Tu evolución física</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {bodyStats.map((stat, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                  <span className="text-muted-foreground">{stat.label}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-bold">{stat.value}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                      stat.positive
                        ? "bg-green-500/10 text-green-700 border-green-500/30"
                        : "bg-red-500/10 text-red-700 border-red-500/30"
                    }`}>
                      <TrendingUp className="h-3 w-3" />
                      {stat.change}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Objetivos de Fuerza</CardTitle>
            <CardDescription>Progreso en tus máximos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {strengthGoals.map((g, i) => (
                <div key={i}>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">{g.name}</span>
                    <span className="text-sm font-medium text-muted-foreground">
                      {g.current}kg / {g.goal}kg
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-500 transition-all duration-500"
                      style={{ width: `${(g.current / g.goal) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Logros */}
      <div className="grid gap-4 md:grid-cols-2">
        {achievements.map((achievement, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center gap-4">
              <div className={`p-3 rounded-full ${achievement.progress === 100 ? "bg-yellow-500/20" : "bg-muted"}`}>
                <achievement.icon
                  className={`h-6 w-6 ${achievement.progress === 100 ? "text-yellow-500" : "text-muted-foreground"}`}
                />
              </div>
              <div className="flex-1">
                <CardTitle className="text-base">{achievement.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{achievement.description}</p>
              </div>
              {achievement.progress === 100 && (
                <span className="text-xs bg-yellow-500/10 text-yellow-700 border border-yellow-500/30 px-2 py-0.5 rounded-full font-medium">
                  Completado
                </span>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progreso</span>
                  <span className="font-medium">{achievement.progress}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      achievement.progress === 100 ? "bg-yellow-500" : "bg-blue-500"
                    }`}
                    style={{ width: `${achievement.progress}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default FitnessProgress;
