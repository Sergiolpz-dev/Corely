from pydantic import BaseModel, field_validator
from typing import Optional, Literal
from datetime import date, datetime


# ─── Transaction ─────────────────────────────────────────────────────────────

class TransactionCreate(BaseModel):
    description: str
    amount: float
    type: Literal["ingreso", "gasto"]
    category: Optional[str] = None
    date: date
    notes: Optional[str] = None

    @field_validator("amount")
    @classmethod
    def amount_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("El importe debe ser mayor que 0")
        return v


class TransactionUpdate(BaseModel):
    description: Optional[str] = None
    amount: Optional[float] = None
    type: Optional[Literal["ingreso", "gasto"]] = None
    category: Optional[str] = None
    date: Optional[date] = None
    notes: Optional[str] = None


class TransactionResponse(BaseModel):
    id: int
    id_user: int
    description: str
    amount: float
    type: str
    category: Optional[str]
    date: date
    notes: Optional[str]
    created_at: datetime
    recurring_id: Optional[int] = None

    class Config:
        from_attributes = True


# ─── IncomeSource ─────────────────────────────────────────────────────────────

class IncomeSourceCreate(BaseModel):
    name: str
    category: Literal["nomina", "freelance", "alquiler", "pension", "otro"]
    amount: float
    frequency: Literal["mensual", "semanal", "anual", "puntual"]
    description: Optional[str] = None
    is_active: bool = True

    @field_validator("amount")
    @classmethod
    def amount_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("El importe debe ser mayor que 0")
        return v


class IncomeSourceUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[Literal["nomina", "freelance", "alquiler", "pension", "otro"]] = None
    amount: Optional[float] = None
    frequency: Optional[Literal["mensual", "semanal", "anual", "puntual"]] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class IncomeSourceResponse(BaseModel):
    id: int
    id_user: int
    name: str
    category: str
    amount: float
    frequency: str
    description: Optional[str]
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ─── SavingsGoal ─────────────────────────────────────────────────────────────

class SavingsGoalCreate(BaseModel):
    name: str
    target_amount: float
    current_amount: float = 0.0
    color: Optional[str] = None
    deadline: Optional[date] = None

    @field_validator("target_amount")
    @classmethod
    def target_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("El objetivo debe ser mayor que 0")
        return v


class SavingsGoalUpdate(BaseModel):
    name: Optional[str] = None
    target_amount: Optional[float] = None
    current_amount: Optional[float] = None
    color: Optional[str] = None
    deadline: Optional[date] = None


class SavingsGoalResponse(BaseModel):
    id: int
    id_user: int
    name: str
    target_amount: float
    current_amount: float
    color: Optional[str]
    deadline: Optional[date]
    created_at: datetime

    class Config:
        from_attributes = True


# ─── ExpenseBudget ────────────────────────────────────────────────────────────

class ExpenseBudgetCreate(BaseModel):
    category: str
    budget: float

    @field_validator("budget")
    @classmethod
    def budget_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("El presupuesto debe ser mayor que 0")
        return v


class ExpenseBudgetResponse(BaseModel):
    id: int
    id_user: int
    category: str
    budget: float

    class Config:
        from_attributes = True


# ─── RecurringTransaction ────────────────────────────────────────────────────

class RecurringTransactionCreate(BaseModel):
    description: str
    amount: float
    type: Literal["ingreso", "gasto"]
    category: Optional[str] = None
    day_of_month: int
    notes: Optional[str] = None

    @field_validator("amount")
    @classmethod
    def amount_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("El importe debe ser mayor que 0")
        return v

    @field_validator("day_of_month")
    @classmethod
    def valid_day(cls, v: int) -> int:
        if not (1 <= v <= 28):
            raise ValueError("El día debe estar entre 1 y 28")
        return v


class RecurringTransactionUpdate(BaseModel):
    description: Optional[str] = None
    amount: Optional[float] = None
    type: Optional[Literal["ingreso", "gasto"]] = None
    category: Optional[str] = None
    day_of_month: Optional[int] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None


class RecurringTransactionResponse(BaseModel):
    id: int
    id_user: int
    description: str
    amount: float
    type: str
    category: Optional[str]
    day_of_month: int
    notes: Optional[str]
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Summary ─────────────────────────────────────────────────────────────────

class FinanceSummaryResponse(BaseModel):
    total_ingresos: float
    total_gastos: float
    balance: float
    projected_monthly_income: float
    savings_rate: float
