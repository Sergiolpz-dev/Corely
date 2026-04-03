import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { User } from "lucide-react";
import FitnessUserProfile from "@/components/custom/fitness/FitnessUserProfile";
import FitnessStats from "@/components/custom/fitness/FitnessStats";
import FitnessWeekly from "@/components/custom/fitness/FitnessWeekly";
import FitnessRoutines from "@/components/custom/fitness/FitnessRoutines";
import FitnessExercises from "@/components/custom/fitness/FitnessExercises";
import FitnessNutrition from "@/components/custom/fitness/FitnessNutrition";
import FitnessProgress from "@/components/custom/fitness/FitnessProgress";

export const FitnessPage = () => {
  const [profileOpen, setProfileOpen] = useState(false);
  // refreshKey incrementa cuando el perfil se guarda → hijos se vuelven a renderizar
  const [refreshKey, setRefreshKey] = useState(0);

  const handleProfileSaved = () => {
    setProfileOpen(false);
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fitness</h1>
          <p className="text-muted-foreground">
            Entrenamientos, nutrición y progreso físico personalizado
          </p>
        </div>
        <Button variant="outline" onClick={() => setProfileOpen(true)}>
          <User className="mr-2 h-4 w-4" />
          Mi Perfil
        </Button>
      </div>

      <FitnessStats key={`stats-${refreshKey}`} />
      <FitnessWeekly key={`weekly-${refreshKey}`} />

      <Tabs defaultValue="rutinas" className="space-y-4">
        <TabsList>
          <TabsTrigger value="rutinas">Rutinas</TabsTrigger>
          <TabsTrigger value="ejercicios">Ejercicios</TabsTrigger>
          <TabsTrigger value="nutricion">Nutrición</TabsTrigger>
          <TabsTrigger value="progreso">Progreso y Logros</TabsTrigger>
        </TabsList>

        <TabsContent value="rutinas">
          <FitnessRoutines key={`routines-${refreshKey}`} />
        </TabsContent>

        <TabsContent value="ejercicios">
          <FitnessExercises />
        </TabsContent>

        <TabsContent value="nutricion">
          <FitnessNutrition key={`nutrition-${refreshKey}`} />
        </TabsContent>

        <TabsContent value="progreso">
          <FitnessProgress />
        </TabsContent>
      </Tabs>

      <Sheet open={profileOpen} onOpenChange={setProfileOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-2xl overflow-y-auto"
        >
          <SheetHeader className="pb-2">
            <SheetTitle>Mi Perfil Fitness</SheetTitle>
            <SheetDescription>
              Configura tus datos personales y preferencias de entrenamiento
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-6">
            <FitnessUserProfile onSave={handleProfileSaved} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};
