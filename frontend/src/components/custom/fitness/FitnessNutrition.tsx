import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, Salad, Flame, Apple, Egg, Beef } from "lucide-react";

const API_URL = "http://localhost:8000";

const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("access_token")}`,
});

interface Alimento {
  nombre: string;
  cantidad_g: number;
  calorias: number;
  proteinas: number;
  carbohidratos: number;
  grasas: number;
}

interface Comida {
  nombre: string;
  hora: string;
  alimentos: Alimento[];
  total_calorias: number;
}

interface MacrosObjetivo {
  proteinas_g: number;
  carbohidratos_g: number;
  grasas_g: number;
}

interface MealPlan {
  id: number;
  semana_inicio: string;
  calorias_objetivo: number;
  plan: {
    calorias_objetivo: number;
    macros_objetivo: MacrosObjetivo;
    comidas: Comida[];
    consejos: string[];
  };
}

interface FoodItem {
  id: number;
  nombre: string;
  calorias: number;
  proteinas: number;
  carbohidratos: number;
  grasas: number;
  alergias: string[];
  tags: string[];
}

const FitnessNutrition = () => {
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [loadingFoods, setLoadingFoods] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMealPlan = async () => {
      try {
        const res = await fetch(`${API_URL}/fitness/meal-plan/current`, {
          headers: getAuthHeaders(),
        });
        if (res.ok) setMealPlan(await res.json());
      } catch {
        // sin plan
      } finally {
        setLoading(false);
      }
    };
    fetchMealPlan();
  }, []);

  const loadFoods = async () => {
    if (foods.length > 0) return;
    setLoadingFoods(true);
    try {
      const res = await fetch(`${API_URL}/fitness/foods`, { headers: getAuthHeaders() });
      if (res.ok) setFoods(await res.json());
    } catch {
      // error silencioso
    } finally {
      setLoadingFoods(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/fitness/meal-plan/generate`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        setMealPlan(await res.json());
      } else {
        const err = await res.json();
        setError(err.detail ?? "Error al generar el plan");
      }
    } catch {
      setError("Error de conexión al generar el plan");
    } finally {
      setGenerating(false);
    }
  };

  const totalMacros = mealPlan?.plan?.comidas?.reduce(
    (acc, comida) => {
      comida.alimentos.forEach((a) => {
        acc.calorias += a.calorias;
        acc.proteinas += a.proteinas;
        acc.carbohidratos += a.carbohidratos;
        acc.grasas += a.grasas;
      });
      return acc;
    },
    { calorias: 0, proteinas: 0, carbohidratos: 0, grasas: 0 }
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        Cargando plan nutricional...
      </div>
    );
  }

  return (
    <Tabs defaultValue="plan" className="space-y-4" onValueChange={(v) => v === "alimentos" && loadFoods()}>
      <TabsList>
        <TabsTrigger value="plan">Plan del día</TabsTrigger>
        <TabsTrigger value="alimentos">Base de alimentos</TabsTrigger>
      </TabsList>

      {/* ── Plan del día ────────────────────────────────────── */}
      <TabsContent value="plan" className="space-y-4">
        {!mealPlan ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="p-4 rounded-full bg-green-500/10">
                <Salad className="h-8 w-8 text-green-600" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-lg">Sin plan nutricional esta semana</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Genera un plan de alimentación adaptado a tu perfil y objetivos
                </p>
              </div>
              {error && (
                <p className="text-sm text-red-600 bg-red-500/10 px-3 py-2 rounded-lg border border-red-500/20">
                  {error}
                </p>
              )}
              <Button
                className="bg-green-600 hover:bg-green-700 text-white gap-2"
                onClick={handleGenerate}
                disabled={generating}
              >
                {generating ? (
                  <><Loader2 className="h-4 w-4 animate-spin" />Generando plan...</>
                ) : (
                  <><Sparkles className="h-4 w-4" />Generar plan con IA</>
                )}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Macros resumen */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Calorías</CardTitle>
                  <Flame className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    {Math.round(totalMacros?.calorias ?? 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    de {mealPlan.calorias_objetivo} kcal objetivo
                  </p>
                  <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-orange-500"
                      style={{ width: `${Math.min(100, ((totalMacros?.calorias ?? 0) / mealPlan.calorias_objetivo) * 100)}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Proteínas</CardTitle>
                  <Beef className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {Math.round(totalMacros?.proteinas ?? 0)}g
                  </div>
                  <p className="text-xs text-muted-foreground">
                    obj: {mealPlan.plan.macros_objetivo?.proteinas_g ?? "—"}g
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Carbohidratos</CardTitle>
                  <Apple className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {Math.round(totalMacros?.carbohidratos ?? 0)}g
                  </div>
                  <p className="text-xs text-muted-foreground">
                    obj: {mealPlan.plan.macros_objetivo?.carbohidratos_g ?? "—"}g
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Grasas</CardTitle>
                  <Egg className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">
                    {Math.round(totalMacros?.grasas ?? 0)}g
                  </div>
                  <p className="text-xs text-muted-foreground">
                    obj: {mealPlan.plan.macros_objetivo?.grasas_g ?? "—"}g
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Comidas */}
            <div className="space-y-3">
              {mealPlan.plan.comidas?.map((comida, idx) => (
                <Card key={idx}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{comida.nombre}</CardTitle>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground border px-2 py-0.5 rounded-full">
                          {comida.hora}
                        </span>
                        <span className="text-xs font-medium text-orange-600">
                          {Math.round(comida.total_calorias)} kcal
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {comida.alimentos.map((alimento, i) => (
                        <div key={i} className="flex items-center justify-between p-2.5 rounded-lg border bg-muted/30">
                          <div>
                            <span className="text-sm font-medium">{alimento.nombre}</span>
                            <span className="text-xs text-muted-foreground ml-2">{alimento.cantidad_g}g</span>
                          </div>
                          <div className="flex gap-3 text-xs text-muted-foreground">
                            <span className="text-orange-600 font-medium">{Math.round(alimento.calorias)} kcal</span>
                            <span className="text-red-500">{Math.round(alimento.proteinas)}g P</span>
                            <span className="text-green-500">{Math.round(alimento.carbohidratos)}g C</span>
                            <span className="text-yellow-500">{Math.round(alimento.grasas)}g G</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Consejos */}
            {mealPlan.plan.consejos?.length > 0 && (
              <Card className="bg-green-500/5 border-green-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 text-green-700">
                    <Sparkles className="h-4 w-4" />
                    Consejos nutricionales
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {mealPlan.plan.consejos.map((c, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex gap-2">
                        <span className="text-green-500 font-bold shrink-0">·</span>
                        {c}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={handleGenerate}
                disabled={generating}
              >
                {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                Nuevo plan
              </Button>
            </div>
          </>
        )}
      </TabsContent>

      {/* ── Base de alimentos ───────────────────────────────── */}
      <TabsContent value="alimentos">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Salad className="h-5 w-5 text-green-600" />
              Base de Datos de Alimentos
            </CardTitle>
            <CardDescription>Información nutricional por 100g</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingFoods ? (
              <div className="flex items-center justify-center py-10 text-muted-foreground gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Cargando alimentos...
              </div>
            ) : (
              <div className="space-y-2">
                {foods.map((food) => (
                  <div key={food.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                    <div>
                      <p className="font-medium text-sm">{food.nombre}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {food.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="text-xs px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-700 border border-green-500/20">
                            {tag}
                          </span>
                        ))}
                        {food.alergias.map((a) => (
                          <span key={a} className="text-xs px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-700 border border-red-500/20">
                            {a}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-4 text-sm text-right">
                      <div>
                        <p className="font-bold text-orange-600">{food.calorias}</p>
                        <p className="text-xs text-muted-foreground">kcal</p>
                      </div>
                      <div>
                        <p className="font-bold text-red-500">{food.proteinas}g</p>
                        <p className="text-xs text-muted-foreground">Prot</p>
                      </div>
                      <div>
                        <p className="font-bold text-green-500">{food.carbohidratos}g</p>
                        <p className="text-xs text-muted-foreground">Carbs</p>
                      </div>
                      <div>
                        <p className="font-bold text-yellow-500">{food.grasas}g</p>
                        <p className="text-xs text-muted-foreground">Grasas</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default FitnessNutrition;
