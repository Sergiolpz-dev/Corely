import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Save, Loader2 } from "lucide-react";

const API_URL = "http://localhost:8000";

const allergiesOptions = ["Gluten", "Lactosa", "Frutos secos", "Mariscos", "Huevo", "Soja"];
const equipmentOptions = ["Pesas libres", "Mancuernas", "Barra", "Máquinas", "Bandas elásticas", "Sin material"];

interface UserProfile {
  altura: string;
  peso: string;
  edad: string;
  nivel: string;
  grupo_muscular: string;
  objetivo: string;
  preferencia_dieta: string;
  velocidad: string;
  alergias: string[];
  material: string[];
}

const defaultProfile: UserProfile = {
  altura: "",
  peso: "",
  edad: "",
  nivel: "intermedio",
  grupo_muscular: "full-body",
  objetivo: "hipertrofia",
  preferencia_dieta: "normal",
  velocidad: "normal",
  alergias: [],
  material: [],
};

const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("access_token")}`,
});

interface FitnessUserProfileProps {
  onSave?: () => void;
}

const FitnessUserProfile = ({ onSave }: FitnessUserProfileProps) => {
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API_URL}/fitness/profile`, {
          headers: getAuthHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          setProfile({
            altura: data.altura?.toString() ?? "",
            peso: data.peso?.toString() ?? "",
            edad: data.edad?.toString() ?? "",
            nivel: data.nivel,
            grupo_muscular: data.grupo_muscular,
            objetivo: data.objetivo,
            preferencia_dieta: data.preferencia_dieta,
            velocidad: data.velocidad,
            alergias: data.alergias ?? [],
            material: data.material ?? [],
          });
        }
      } catch {
        // perfil no existe aún, usamos defaults
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const toggleAllergy = (allergy: string) => {
    setProfile((prev) => ({
      ...prev,
      alergias: prev.alergias.includes(allergy)
        ? prev.alergias.filter((a) => a !== allergy)
        : [...prev.alergias, allergy],
    }));
  };

  const toggleEquipment = (item: string) => {
    setProfile((prev) => ({
      ...prev,
      material: prev.material.includes(item)
        ? prev.material.filter((m) => m !== item)
        : [...prev.material, item],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const body = {
        altura: profile.altura ? parseFloat(profile.altura) : null,
        peso: profile.peso ? parseFloat(profile.peso) : null,
        edad: profile.edad ? parseInt(profile.edad) : null,
        nivel: profile.nivel,
        grupo_muscular: profile.grupo_muscular,
        objetivo: profile.objetivo,
        preferencia_dieta: profile.preferencia_dieta,
        velocidad: profile.velocidad,
        alergias: profile.alergias,
        material: profile.material,
      };
      const res = await fetch(`${API_URL}/fitness/profile`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      });
      if (res.ok) {
        onSave?.();
      }
    } catch (err) {
      console.error("Error guardando perfil:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        Cargando perfil...
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-2">
      {/* Datos básicos */}
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-3">Datos personales</p>
        <div className="grid gap-4 grid-cols-2">
          <div className="space-y-2">
            <Label>Altura (cm)</Label>
            <Input
              type="number"
              placeholder="175"
              value={profile.altura}
              onChange={(e) => setProfile({ ...profile, altura: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Peso (kg)</Label>
            <Input
              type="number"
              placeholder="75"
              value={profile.peso}
              onChange={(e) => setProfile({ ...profile, peso: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Edad</Label>
            <Input
              type="number"
              placeholder="25"
              value={profile.edad}
              onChange={(e) => setProfile({ ...profile, edad: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Nivel físico</Label>
            <Select
              value={profile.nivel}
              onValueChange={(v) => setProfile({ ...profile, nivel: v })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="principiante">Principiante</SelectItem>
                <SelectItem value="intermedio">Intermedio</SelectItem>
                <SelectItem value="avanzado">Avanzado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Separator />

      {/* Objetivos */}
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-3">Objetivos de entrenamiento</p>
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label>Objetivo principal</Label>
            <Select
              value={profile.objetivo}
              onValueChange={(v) => setProfile({ ...profile, objetivo: v })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="hipertrofia">Hipertrofia</SelectItem>
                <SelectItem value="perdida-grasa">Pérdida de grasa</SelectItem>
                <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                <SelectItem value="resistencia">Resistencia</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Grupo muscular preferido</Label>
            <Select
              value={profile.grupo_muscular}
              onValueChange={(v) => setProfile({ ...profile, grupo_muscular: v })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="full-body">Full Body</SelectItem>
                <SelectItem value="tren-superior">Tren Superior</SelectItem>
                <SelectItem value="tren-inferior">Tren Inferior</SelectItem>
                <SelectItem value="core">Core</SelectItem>
                <SelectItem value="pecho">Pecho</SelectItem>
                <SelectItem value="espalda">Espalda</SelectItem>
                <SelectItem value="piernas">Piernas</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Velocidad de progreso</Label>
            <Select
              value={profile.velocidad}
              onValueChange={(v) => setProfile({ ...profile, velocidad: v })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="lenta">Lenta (2 días/semana)</SelectItem>
                <SelectItem value="normal">Normal (3 días/semana)</SelectItem>
                <SelectItem value="rapida">Rápida (4 días/semana)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Separator />

      {/* Dieta */}
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-3">Alimentación</p>
        <div className="space-y-2">
          <Label>Preferencia alimenticia</Label>
          <Select
            value={profile.preferencia_dieta}
            onValueChange={(v) => setProfile({ ...profile, preferencia_dieta: v })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">Sin restricciones</SelectItem>
              <SelectItem value="vegano">Vegano</SelectItem>
              <SelectItem value="vegetariano">Vegetariano</SelectItem>
              <SelectItem value="keto">Keto</SelectItem>
              <SelectItem value="paleo">Paleo</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-3 mt-4">
          <Label>Alergias alimentarias</Label>
          <div className="flex flex-wrap gap-3">
            {allergiesOptions.map((allergy) => (
              <label key={allergy} className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={profile.alergias.includes(allergy)}
                  onCheckedChange={() => toggleAllergy(allergy)}
                />
                <span className="text-sm">{allergy}</span>
              </label>
            ))}
          </div>
          {profile.alergias.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {profile.alergias.map((a) => (
                <Badge key={a} className="text-xs bg-red-500/10 text-red-700 border border-red-500/30">{a}</Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* Material */}
      <div className="space-y-3">
        <Label>Material disponible</Label>
        <div className="flex flex-wrap gap-3">
          {equipmentOptions.map((item) => (
            <label key={item} className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={profile.material.includes(item)}
                onCheckedChange={() => toggleEquipment(item)}
              />
              <span className="text-sm">{item}</span>
            </label>
          ))}
        </div>
        {profile.material.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {profile.material.map((m) => (
              <Badge key={m} className="text-xs bg-blue-500/10 text-blue-700 border border-blue-500/30">{m}</Badge>
            ))}
          </div>
        )}
      </div>

      <Button
        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Guardando...</>
        ) : (
          <><Save className="mr-2 h-4 w-4" />Guardar perfil</>
        )}
      </Button>
    </div>
  );
};

export default FitnessUserProfile;
