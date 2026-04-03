from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime


# ── Fitness Profile ──────────────────────────────────────────────────────────

class FitnessProfileUpsert(BaseModel):
    altura: Optional[float] = None
    peso: Optional[float] = None
    edad: Optional[int] = None
    nivel: Optional[str] = "intermedio"
    grupo_muscular: Optional[str] = "full-body"
    objetivo: Optional[str] = "hipertrofia"
    preferencia_dieta: Optional[str] = "normal"
    velocidad: Optional[str] = "normal"
    alergias: Optional[List[str]] = []
    material: Optional[List[str]] = []


class FitnessProfileResponse(BaseModel):
    id: int
    id_user: int
    altura: Optional[float] = None
    peso: Optional[float] = None
    edad: Optional[int] = None
    nivel: str
    grupo_muscular: str
    objetivo: str
    preferencia_dieta: str
    velocidad: str
    alergias: List[str] = []
    material: List[str] = []
    updated_at: datetime

    class Config:
        from_attributes = True


# ── Exercises ────────────────────────────────────────────────────────────────

class ExerciseResponse(BaseModel):
    id: int
    nombre: str
    grupo_muscular: str
    dificultad: str
    tipo: str
    series_recomendadas: int
    repeticiones_recomendadas: int
    descripcion: Optional[str] = None

    class Config:
        from_attributes = True


# ── Foods ────────────────────────────────────────────────────────────────────

class FoodResponse(BaseModel):
    id: int
    nombre: str
    calorias: float
    proteinas: float
    carbohidratos: float
    grasas: float
    alergias: List[str] = []
    tags: List[str] = []

    class Config:
        from_attributes = True


# ── Routines ─────────────────────────────────────────────────────────────────

class WorkoutRoutineResponse(BaseModel):
    id: int
    id_user: int
    semana_inicio: str
    plan: Any
    created_at: datetime

    class Config:
        from_attributes = True


class WorkoutLogUpdate(BaseModel):
    dia: str
    completado: int     # 0 o 1
    notas: Optional[str] = None


class WorkoutLogResponse(BaseModel):
    id: int
    dia: str
    completado: int
    fecha: Optional[str] = None
    notas: Optional[str] = None

    class Config:
        from_attributes = True


# ── Meal Plans ───────────────────────────────────────────────────────────────

class MealPlanResponse(BaseModel):
    id: int
    id_user: int
    semana_inicio: str
    plan: Any
    calorias_objetivo: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ── Stats ────────────────────────────────────────────────────────────────────

class FitnessStatsResponse(BaseModel):
    entrenamientos_completados: int
    entrenamientos_objetivo: int
    calorias_semana: int
    tiempo_total_min: int
    racha_dias: int
