from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime

from models.user import Base


class UserFitnessProfile(Base):
    __tablename__ = "fitness_profiles"

    id = Column(Integer, primary_key=True, index=True)
    id_user = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    altura = Column(Float, nullable=True)          # cm
    peso = Column(Float, nullable=True)            # kg
    edad = Column(Integer, nullable=True)
    nivel = Column(String(20), default="intermedio")           # principiante|intermedio|avanzado
    grupo_muscular = Column(String(30), default="full-body")
    objetivo = Column(String(30), default="hipertrofia")       # hipertrofia|perdida-grasa|mantenimiento|resistencia
    preferencia_dieta = Column(String(20), default="normal")   # normal|vegano|vegetariano|keto|paleo
    velocidad = Column(String(10), default="normal")           # lenta|normal|rapida
    alergias = Column(JSON, default=list)          # ["Gluten", "Lactosa", ...]
    material = Column(JSON, default=list)          # ["Pesas libres", "Mancuernas", ...]
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", backref="fitness_profile")


class Exercise(Base):
    __tablename__ = "fitness_exercises"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False, index=True)
    grupo_muscular = Column(String(50), nullable=False, index=True)
    dificultad = Column(String(20), nullable=False)    # principiante|intermedio|avanzado
    tipo = Column(String(30), nullable=False)          # peso corporal|barra|mancuernas|máquinas|bandas
    series_recomendadas = Column(Integer, default=3)
    repeticiones_recomendadas = Column(Integer, default=12)
    descripcion = Column(Text, nullable=True)


class Food(Base):
    __tablename__ = "fitness_foods"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False, index=True)
    calorias = Column(Float, nullable=False)       # por 100g
    proteinas = Column(Float, nullable=False)      # g por 100g
    carbohidratos = Column(Float, nullable=False)  # g por 100g
    grasas = Column(Float, nullable=False)         # g por 100g
    alergias = Column(JSON, default=list)          # ["Gluten", "Lactosa", ...]
    tags = Column(JSON, default=list)              # ["vegano", "keto", "alto proteina", ...]


class WorkoutRoutine(Base):
    __tablename__ = "fitness_routines"

    id = Column(Integer, primary_key=True, index=True)
    id_user = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    semana_inicio = Column(String(10), nullable=False)   # YYYY-MM-DD del lunes
    plan = Column(JSON, nullable=False)                  # estructura semanal completa
    created_at = Column(DateTime, default=datetime.utcnow)

    logs = relationship("WorkoutLog", back_populates="routine", cascade="all, delete-orphan")


class WorkoutLog(Base):
    __tablename__ = "fitness_workout_logs"

    id = Column(Integer, primary_key=True, index=True)
    id_user = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    routine_id = Column(Integer, ForeignKey("fitness_routines.id", ondelete="CASCADE"), nullable=False)
    dia = Column(String(10), nullable=False)              # lunes|martes|...
    completado = Column(Integer, default=0)               # 0=pendiente, 1=completado
    fecha = Column(String(10), nullable=True)             # YYYY-MM-DD
    notas = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    routine = relationship("WorkoutRoutine", back_populates="logs")


class MealPlan(Base):
    __tablename__ = "fitness_meal_plans"

    id = Column(Integer, primary_key=True, index=True)
    id_user = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    semana_inicio = Column(String(10), nullable=False)   # YYYY-MM-DD del lunes
    plan = Column(JSON, nullable=False)                  # plan de alimentación semanal
    calorias_objetivo = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
