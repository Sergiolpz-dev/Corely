import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Apple, Beef, Egg, Salad, Flame } from "lucide-react";

const mealPlan = [
  {
    meal: "Desayuno",
    time: "07:30",
    foods: [
      { name: "Avena con plátano", cal: 350, protein: 12, carbs: 55, fat: 8 },
      { name: "Huevos revueltos (3)", cal: 210, protein: 18, carbs: 2, fat: 14 },
    ],
  },
  {
    meal: "Almuerzo",
    time: "13:00",
    foods: [
      { name: "Pechuga de pollo (200g)", cal: 330, protein: 62, carbs: 0, fat: 7 },
      { name: "Arroz integral (150g)", cal: 170, protein: 4, carbs: 36, fat: 1.5 },
      { name: "Ensalada mixta", cal: 80, protein: 3, carbs: 12, fat: 2 },
    ],
  },
  {
    meal: "Merienda",
    time: "17:00",
    foods: [
      { name: "Batido de proteínas", cal: 180, protein: 30, carbs: 8, fat: 3 },
      { name: "Frutos secos (30g)", cal: 175, protein: 5, carbs: 6, fat: 15 },
    ],
  },
  {
    meal: "Cena",
    time: "20:30",
    foods: [
      { name: "Salmón a la plancha (180g)", cal: 370, protein: 40, carbs: 0, fat: 22 },
      { name: "Verduras salteadas", cal: 120, protein: 4, carbs: 18, fat: 4 },
    ],
  },
];

const foodDatabase = [
  { name: "Pechuga de pollo", cal: 165, protein: 31, carbs: 0, fat: 3.6, tags: ["Alto en proteína"], allergies: [] },
  { name: "Arroz integral", cal: 112, protein: 2.6, carbs: 24, fat: 0.9, tags: ["Integral"], allergies: ["Gluten"] },
  { name: "Huevo entero", cal: 155, protein: 13, carbs: 1.1, fat: 11, tags: ["Alto en proteína"], allergies: ["Huevo"] },
  { name: "Avena", cal: 389, protein: 17, carbs: 66, fat: 7, tags: ["Integral", "Vegano"], allergies: ["Gluten"] },
  { name: "Salmón", cal: 208, protein: 20, carbs: 0, fat: 13, tags: ["Omega-3"], allergies: ["Pescado"] },
  { name: "Tofu", cal: 76, protein: 8, carbs: 1.9, fat: 4.8, tags: ["Vegano", "Vegetariano"], allergies: ["Soja"] },
  { name: "Batata", cal: 86, protein: 1.6, carbs: 20, fat: 0.1, tags: ["Vegano"], allergies: [] },
  { name: "Yogur griego", cal: 59, protein: 10, carbs: 3.6, fat: 0.7, tags: ["Alto en proteína"], allergies: ["Lactosa"] },
];

const dailyTotals = {
  calories: { current: 1985, goal: 2400 },
  protein: { current: 178, goal: 180 },
  carbs: { current: 137, goal: 250 },
  fat: { current: 76, goal: 80 },
};

const FitnessNutrition = () => {
  return (
    <Tabs defaultValue="plan" className="space-y-4">
      <TabsList>
        <TabsTrigger value="plan">Plan del día</TabsTrigger>
        <TabsTrigger value="alimentos">Base de alimentos</TabsTrigger>
      </TabsList>

      <TabsContent value="plan" className="space-y-4">
        {/* Resumen diario */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Calorías</CardTitle>
              <Flame className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dailyTotals.calories.current}</div>
              <p className="text-xs text-muted-foreground">de {dailyTotals.calories.goal} kcal</p>
              <Progress value={(dailyTotals.calories.current / dailyTotals.calories.goal) * 100} className="h-1.5 mt-2" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Proteínas</CardTitle>
              <Beef className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dailyTotals.protein.current}g</div>
              <p className="text-xs text-muted-foreground">de {dailyTotals.protein.goal}g</p>
              <Progress value={(dailyTotals.protein.current / dailyTotals.protein.goal) * 100} className="h-1.5 mt-2" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Carbohidratos</CardTitle>
              <Apple className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dailyTotals.carbs.current}g</div>
              <p className="text-xs text-muted-foreground">de {dailyTotals.carbs.goal}g</p>
              <Progress value={(dailyTotals.carbs.current / dailyTotals.carbs.goal) * 100} className="h-1.5 mt-2" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Grasas</CardTitle>
              <Egg className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dailyTotals.fat.current}g</div>
              <p className="text-xs text-muted-foreground">de {dailyTotals.fat.goal}g</p>
              <Progress value={(dailyTotals.fat.current / dailyTotals.fat.goal) * 100} className="h-1.5 mt-2" />
            </CardContent>
          </Card>
        </div>

        {/* Plan de comidas */}
        <div className="space-y-4">
          {mealPlan.map((meal, idx) => (
            <Card key={idx}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{meal.meal}</CardTitle>
                  <Badge variant="outline">{meal.time}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {meal.foods.map((food, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                      <span className="font-medium text-sm">{food.name}</span>
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>{food.cal} kcal</span>
                        <span className="text-red-500">{food.protein}g P</span>
                        <span className="text-green-500">{food.carbs}g C</span>
                        <span className="text-yellow-500">{food.fat}g G</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="alimentos" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Salad className="h-5 w-5 text-primary" />
              Base de Datos de Alimentos
            </CardTitle>
            <CardDescription>Alimentos disponibles con información nutricional por 100g</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {foodDatabase.map((food, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 rounded-lg border">
                  <div>
                    <p className="font-medium">{food.name}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {food.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                      ))}
                      {food.allergies.map((a) => (
                        <Badge key={a} variant="destructive" className="text-xs">{a}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-5 text-sm text-right">
                    <div>
                      <p className="font-bold">{food.cal}</p>
                      <p className="text-xs text-muted-foreground">kcal</p>
                    </div>
                    <div>
                      <p className="font-bold text-red-500">{food.protein}g</p>
                      <p className="text-xs text-muted-foreground">Prot</p>
                    </div>
                    <div>
                      <p className="font-bold text-green-500">{food.carbs}g</p>
                      <p className="text-xs text-muted-foreground">Carbs</p>
                    </div>
                    <div>
                      <p className="font-bold text-yellow-500">{food.fat}g</p>
                      <p className="text-xs text-muted-foreground">Grasas</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default FitnessNutrition;
