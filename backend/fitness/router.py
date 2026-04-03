from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from datetime import date, timedelta
from typing import Optional, List

from fitness.schemas import (
    FitnessProfileUpsert, FitnessProfileResponse,
    ExerciseResponse, FoodResponse,
    WorkoutRoutineResponse, WorkoutLogUpdate, WorkoutLogResponse,
    MealPlanResponse, FitnessStatsResponse,
)
from fitness.ai import generate_weekly_routine, generate_meal_plan
from auth.dependencies import get_current_user, get_db
from models.fitness import (
    UserFitnessProfile, Exercise, Food,
    WorkoutRoutine, WorkoutLog, MealPlan,
)
from models.user import User

router = APIRouter(prefix="/fitness", tags=["Fitness"])


def _monday_of_week(d: date = None) -> str:
    d = d or date.today()
    monday = d - timedelta(days=d.weekday())
    return monday.isoformat()


# ── Profile ──────────────────────────────────────────────────────────────────

@router.get("/profile", response_model=FitnessProfileResponse)
async def get_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = db.query(UserFitnessProfile).filter(
        UserFitnessProfile.id_user == current_user.id
    ).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Perfil no encontrado")
    return profile


@router.post("/profile", response_model=FitnessProfileResponse)
async def upsert_profile(
    data: FitnessProfileUpsert,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = db.query(UserFitnessProfile).filter(
        UserFitnessProfile.id_user == current_user.id
    ).first()

    if profile:
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(profile, field, value)
    else:
        profile = UserFitnessProfile(id_user=current_user.id, **data.model_dump())
        db.add(profile)

    db.commit()
    db.refresh(profile)
    return profile


# ── Exercises ────────────────────────────────────────────────────────────────

@router.get("/exercises", response_model=List[ExerciseResponse])
async def list_exercises(
    grupo_muscular: Optional[str] = Query(None),
    dificultad: Optional[str] = Query(None),
    tipo: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(Exercise)
    if grupo_muscular and grupo_muscular != "Todos":
        q = q.filter(Exercise.grupo_muscular == grupo_muscular)
    if dificultad and dificultad != "Todos":
        q = q.filter(Exercise.dificultad == dificultad)
    if tipo and tipo != "Todos":
        q = q.filter(Exercise.tipo == tipo)
    if search:
        q = q.filter(Exercise.nombre.ilike(f"%{search}%"))
    return q.order_by(Exercise.grupo_muscular, Exercise.nombre).all()


# ── Foods ────────────────────────────────────────────────────────────────────

@router.get("/foods", response_model=List[FoodResponse])
async def list_foods(
    tag: Optional[str] = Query(None),
    excluir_alergias: Optional[str] = Query(None),  # "Gluten,Lactosa"
    search: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    foods = db.query(Food).all()

    if search:
        foods = [f for f in foods if search.lower() in f.nombre.lower()]

    if tag:
        foods = [f for f in foods if tag in (f.tags or [])]

    if excluir_alergias:
        alergias_list = [a.strip() for a in excluir_alergias.split(",")]
        foods = [
            f for f in foods
            if not any(a in (f.alergias or []) for a in alergias_list)
        ]

    return foods


# ── Routines ─────────────────────────────────────────────────────────────────

@router.get("/routine/current", response_model=Optional[WorkoutRoutineResponse])
async def get_current_routine(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    semana = _monday_of_week()
    routine = db.query(WorkoutRoutine).filter(
        WorkoutRoutine.id_user == current_user.id,
        WorkoutRoutine.semana_inicio == semana,
    ).first()
    return routine


@router.post("/routine/generate", response_model=WorkoutRoutineResponse, status_code=201)
async def generate_routine(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = db.query(UserFitnessProfile).filter(
        UserFitnessProfile.id_user == current_user.id
    ).first()
    if not profile:
        raise HTTPException(status_code=400, detail="Configura tu perfil fitness primero")

    # Filtrar ejercicios según perfil
    exercises_q = db.query(Exercise)
    if profile.nivel == "principiante":
        exercises_q = exercises_q.filter(Exercise.dificultad.in_(["Principiante"]))
    elif profile.nivel == "intermedio":
        exercises_q = exercises_q.filter(Exercise.dificultad.in_(["Principiante", "Intermedio"]))
    # avanzado = todos

    if profile.material:
        tipo_map = {
            "Pesas libres": ["Barra", "Mancuernas"],
            "Mancuernas": ["Mancuernas"],
            "Barra": ["Barra"],
            "Máquinas": ["Máquinas"],
            "Bandas elásticas": ["Bandas"],
            "Sin material": ["Peso corporal"],
        }
        tipos_permitidos = set()
        for mat in profile.material:
            tipos_permitidos.update(tipo_map.get(mat, []))
        tipos_permitidos.add("Peso corporal")  # siempre incluir ejercicios de peso corporal
        exercises_q = exercises_q.filter(Exercise.tipo.in_(list(tipos_permitidos)))

    exercises = exercises_q.all()
    exercises_data = [
        {
            "id": ex.id,
            "nombre": ex.nombre,
            "grupo_muscular": ex.grupo_muscular,
            "dificultad": ex.dificultad,
            "tipo": ex.tipo,
            "series_recomendadas": ex.series_recomendadas,
            "repeticiones_recomendadas": ex.repeticiones_recomendadas,
        }
        for ex in exercises
    ]

    profile_data = {
        "nivel": profile.nivel,
        "objetivo": profile.objetivo,
        "grupo_muscular": profile.grupo_muscular,
        "velocidad": profile.velocidad,
        "peso": profile.peso,
    }

    try:
        plan = await generate_weekly_routine(profile_data, exercises_data)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Error al generar rutina con IA: {str(e)}")

    semana = _monday_of_week()

    # Eliminar rutina existente de esta semana si la hay
    db.query(WorkoutRoutine).filter(
        WorkoutRoutine.id_user == current_user.id,
        WorkoutRoutine.semana_inicio == semana,
    ).delete()

    routine = WorkoutRoutine(
        id_user=current_user.id,
        semana_inicio=semana,
        plan=plan,
    )
    db.add(routine)
    db.commit()
    db.refresh(routine)
    return routine


@router.get("/routine/{routine_id}/logs", response_model=List[WorkoutLogResponse])
async def get_routine_logs(
    routine_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    routine = db.query(WorkoutRoutine).filter(
        WorkoutRoutine.id == routine_id,
        WorkoutRoutine.id_user == current_user.id,
    ).first()
    if not routine:
        raise HTTPException(status_code=404, detail="Rutina no encontrada")
    return db.query(WorkoutLog).filter(WorkoutLog.routine_id == routine_id).all()


@router.post("/routine/{routine_id}/log", response_model=WorkoutLogResponse, status_code=201)
async def log_workout(
    routine_id: int,
    data: WorkoutLogUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    routine = db.query(WorkoutRoutine).filter(
        WorkoutRoutine.id == routine_id,
        WorkoutRoutine.id_user == current_user.id,
    ).first()
    if not routine:
        raise HTTPException(status_code=404, detail="Rutina no encontrada")

    log = db.query(WorkoutLog).filter(
        WorkoutLog.routine_id == routine_id,
        WorkoutLog.dia == data.dia,
    ).first()

    if log:
        log.completado = data.completado
        log.notas = data.notas
        log.fecha = date.today().isoformat()
    else:
        log = WorkoutLog(
            id_user=current_user.id,
            routine_id=routine_id,
            dia=data.dia,
            completado=data.completado,
            notas=data.notas,
            fecha=date.today().isoformat(),
        )
        db.add(log)

    db.commit()
    db.refresh(log)
    return log


# ── Meal Plans ───────────────────────────────────────────────────────────────

@router.get("/meal-plan/current", response_model=Optional[MealPlanResponse])
async def get_current_meal_plan(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    semana = _monday_of_week()
    plan = db.query(MealPlan).filter(
        MealPlan.id_user == current_user.id,
        MealPlan.semana_inicio == semana,
    ).first()
    return plan


@router.post("/meal-plan/generate", response_model=MealPlanResponse, status_code=201)
async def generate_meal_plan_endpoint(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = db.query(UserFitnessProfile).filter(
        UserFitnessProfile.id_user == current_user.id
    ).first()
    if not profile:
        raise HTTPException(status_code=400, detail="Configura tu perfil fitness primero")

    # Filtrar alimentos según alergias y dieta
    foods = db.query(Food).all()

    if profile.alergias:
        foods = [f for f in foods if not any(a in (f.alergias or []) for a in profile.alergias)]

    dieta = profile.preferencia_dieta
    if dieta in ("vegano", "vegetariano", "keto"):
        foods = [f for f in foods if dieta in (f.tags or [])]

    foods_data = [
        {
            "id": f.id,
            "nombre": f.nombre,
            "calorias": f.calorias,
            "proteinas": f.proteinas,
            "carbohidratos": f.carbohidratos,
            "grasas": f.grasas,
            "tags": f.tags,
        }
        for f in foods
    ]

    profile_data = {
        "peso": profile.peso,
        "objetivo": profile.objetivo,
        "preferencia_dieta": profile.preferencia_dieta,
        "velocidad": profile.velocidad,
    }

    try:
        plan_data = await generate_meal_plan(profile_data, foods_data)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Error al generar plan con IA: {str(e)}")

    semana = _monday_of_week()

    db.query(MealPlan).filter(
        MealPlan.id_user == current_user.id,
        MealPlan.semana_inicio == semana,
    ).delete()

    meal_plan = MealPlan(
        id_user=current_user.id,
        semana_inicio=semana,
        plan=plan_data,
        calorias_objetivo=plan_data.get("calorias_objetivo"),
    )
    db.add(meal_plan)
    db.commit()
    db.refresh(meal_plan)
    return meal_plan


# ── Stats ─────────────────────────────────────────────────────────────────────

@router.get("/stats", response_model=FitnessStatsResponse)
async def get_fitness_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    semana = _monday_of_week()

    routine = db.query(WorkoutRoutine).filter(
        WorkoutRoutine.id_user == current_user.id,
        WorkoutRoutine.semana_inicio == semana,
    ).first()

    entrenamientos_completados = 0
    entrenamientos_objetivo = 3
    calorias_semana = 0
    tiempo_total_min = 0

    if routine:
        logs = db.query(WorkoutLog).filter(
            WorkoutLog.routine_id == routine.id,
            WorkoutLog.completado == 1,
        ).all()
        entrenamientos_completados = len(logs)

        dias = routine.plan.get("dias", [])
        entrenamientos_objetivo = sum(1 for d in dias if not d.get("descanso", False))

        # Estimación: cada sesión ~45 min, ~300 kcal quemadas
        tiempo_total_min = entrenamientos_completados * 45
        calorias_semana = entrenamientos_completados * 300

    # Racha: días consecutivos con al menos 1 entreno completado
    all_logs = (
        db.query(WorkoutLog)
        .filter(WorkoutLog.id_user == current_user.id, WorkoutLog.completado == 1)
        .order_by(WorkoutLog.fecha.desc())
        .all()
    )
    racha = 0
    if all_logs:
        fechas = sorted({log.fecha for log in all_logs if log.fecha}, reverse=True)
        today = date.today()
        for i, fecha_str in enumerate(fechas):
            esperado = (today - timedelta(days=i)).isoformat()
            if fecha_str == esperado:
                racha += 1
            else:
                break

    return FitnessStatsResponse(
        entrenamientos_completados=entrenamientos_completados,
        entrenamientos_objetivo=entrenamientos_objetivo,
        calorias_semana=calorias_semana,
        tiempo_total_min=tiempo_total_min,
        racha_dias=racha,
    )
