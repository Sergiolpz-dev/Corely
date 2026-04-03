import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dumbbell, Flame, Timer, Trophy } from "lucide-react";

const FitnessStats = () => {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card className="bg-linear-to-br from-orange-500/10 to-orange-600/10 border-orange-500/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Calorías Quemadas</CardTitle>
          <Flame className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">2,450</div>
          <p className="text-xs text-muted-foreground">Esta semana</p>
        </CardContent>
      </Card>

      <Card className="bg-linear-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Entrenamientos</CardTitle>
          <Dumbbell className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">3/5</div>
          <p className="text-xs text-muted-foreground">Objetivo semanal</p>
        </CardContent>
      </Card>

      <Card className="bg-linear-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tiempo Total</CardTitle>
          <Timer className="h-4 w-4 text-purple-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">4h 30m</div>
          <p className="text-xs text-muted-foreground">Esta semana</p>
        </CardContent>
      </Card>

      <Card className="bg-linear-to-br from-yellow-500/10 to-yellow-600/10 border-yellow-500/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Racha Actual</CardTitle>
          <Trophy className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">12 días</div>
          <p className="text-xs text-muted-foreground">¡Sigue así!</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default FitnessStats;
