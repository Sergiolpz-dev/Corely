from contextlib import asynccontextmanager
import time
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.exc import OperationalError
import os

# Importar configuración y modelos
from config import settings
from models.user import Base, User
from models.social_account import SocialAccount
from models.task import Task    # noqa: F401 - necesario para que SQLAlchemy registre la tabla
from models.habits import Habit        # noqa: F401 - necesario para que SQLAlchemy registre la tabla
from models.user_stats import UserHabitStats  # noqa: F401 - necesario para que SQLAlchemy registre la tabla
from models.event import Event  # noqa: F401
from models.google_calendar_token import GoogleCalendarToken  # noqa: F401
from models.fitness import UserFitnessProfile, Exercise, Food, WorkoutRoutine, WorkoutLog, MealPlan  # noqa: F401
from models.finance import Transaction, IncomeSource, SavingsGoal, ExpenseBudget, RecurringTransaction  # noqa: F401
from auth.router import router as auth_router
from auth.oauth import router as oauth_router
from tasks.router import router as tasks_router
from habits.router import router as habits_router
from events.router import router as events_router
from news.router import router as news_router
from fitness.router import router as fitness_router
from fitness.seeds import run_seeds
from finance.router import router as finance_router

# 1. URL de conexión para MariaDB/MySQL
DATABASE_URL = settings.DATABASE_URL

# El resto es prácticamente IGUAL que antes
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)



# Crear tablas
def wait_for_db():
    for i in range(10):
        try:
            Base.metadata.create_all(bind=engine)
            return
        except OperationalError:
            print("Esperando a la base de datos...")
            time.sleep(2)
    raise Exception("La BD no respondió")


def run_migrations():
    """Aplica migraciones incrementales sin Alembic."""
    with engine.connect() as conn:
        # Añadir recurring_id a transactions si no existe
        conn.execute(text(
            "ALTER TABLE transactions ADD COLUMN IF NOT EXISTS recurring_id INT NULL"
        ))
        # Añadir FK si no existe ya (comprobar en information_schema)
        fk_exists = conn.execute(text("""
            SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
            WHERE CONSTRAINT_SCHEMA = DATABASE()
              AND TABLE_NAME = 'transactions'
              AND CONSTRAINT_NAME = 'fk_tx_recurring'
        """)).scalar()
        if not fk_exists:
            try:
                conn.execute(text(
                    "ALTER TABLE transactions ADD CONSTRAINT fk_tx_recurring "
                    "FOREIGN KEY (recurring_id) REFERENCES recurring_transactions(id) ON DELETE SET NULL"
                ))
            except Exception as e:
                print(f"FK ya existe o no aplicable: {e}")
        conn.commit()


# ------------------------------------------

@asynccontextmanager
async def lifespan(_: FastAPI):
    wait_for_db()
    run_migrations()
    db = SessionLocal()
    try:
        run_seeds(db)
    finally:
        db.close()
    yield

app = FastAPI(lifespan=lifespan)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],  ## EN PRODUCCIÓN (corely.es) CAMBIAR "*" POR LA URL DEL FRONTEND
    allow_headers=["*"],
)

# Incluir routers de autenticación
app.include_router(auth_router)
app.include_router(oauth_router)
app.include_router(tasks_router)
app.include_router(habits_router)
app.include_router(events_router)
app.include_router(news_router)
app.include_router(fitness_router)
app.include_router(finance_router)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()






@app.get("/")
def home():
    return {"status": "Backend con MariaDB funcionando"}
