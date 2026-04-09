from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import extract
from typing import Optional
from datetime import date
from calendar import monthrange

from auth.dependencies import get_current_user, get_db
from models.user import User
from models.finance import Transaction, IncomeSource, SavingsGoal, ExpenseBudget, RecurringTransaction
from finance.schemas import (
    TransactionCreate, TransactionUpdate, TransactionResponse,
    IncomeSourceCreate, IncomeSourceUpdate, IncomeSourceResponse,
    SavingsGoalCreate, SavingsGoalUpdate, SavingsGoalResponse,
    ExpenseBudgetCreate, ExpenseBudgetResponse,
    FinanceSummaryResponse,
    RecurringTransactionCreate, RecurringTransactionUpdate, RecurringTransactionResponse,
)

router = APIRouter(prefix="/finance", tags=["Finance"])


def _materialize_recurring(db: Session, user_id: int, year: int, month: int) -> None:
    """Auto-create Transaction rows from active recurring templates for the given month."""
    today = date.today()
    if (year, month) > (today.year, today.month):
        return  # never pre-create future months

    active = db.query(RecurringTransaction).filter(
        RecurringTransaction.id_user == user_id,
        RecurringTransaction.is_active == True,  # noqa: E712
    ).all()

    changed = False
    for rt in active:
        # Only materialize from the month the template was created
        if (year, month) < (rt.created_at.year, rt.created_at.month):
            continue
        already = db.query(Transaction).filter(
            Transaction.id_user == user_id,
            Transaction.recurring_id == rt.id,
            extract("year", Transaction.date) == year,
            extract("month", Transaction.date) == month,
        ).first()
        if not already:
            _, last_day = monthrange(year, month)
            day = min(rt.day_of_month, last_day)
            db.add(Transaction(
                id_user=user_id,
                description=rt.description,
                amount=rt.amount,
                type=rt.type,
                category=rt.category,
                date=date(year, month, day),
                notes=rt.notes,
                recurring_id=rt.id,
            ))
            changed = True
    if changed:
        db.commit()


FREQUENCY_TO_MONTHLY = {
    "mensual": 1.0,
    "semanal": 4.33,
    "anual": 1 / 12,
    "puntual": 1 / 12,
}


# ─── Transactions ─────────────────────────────────────────────────────────────

@router.get("/transactions", response_model=list[TransactionResponse])
async def list_transactions(
    month: Optional[str] = Query(None, description="Formato YYYY-MM"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Transaction).filter(Transaction.id_user == current_user.id)
    if month:
        try:
            year, m = int(month[:4]), int(month[5:7])
        except (ValueError, IndexError):
            raise HTTPException(status_code=400, detail="Formato de mes inválido. Usa YYYY-MM")
        _materialize_recurring(db, current_user.id, year, m)
        query = query.filter(
            extract("year", Transaction.date) == year,
            extract("month", Transaction.date) == m,
        )
    return query.order_by(Transaction.date.desc()).all()


@router.post("/transactions", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
async def create_transaction(
    data: TransactionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    transaction = Transaction(**data.model_dump(), id_user=current_user.id)
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction


@router.put("/transactions/{transaction_id}", response_model=TransactionResponse)
async def update_transaction(
    transaction_id: int,
    data: TransactionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    transaction = db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.id_user == current_user.id,
    ).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transacción no encontrada")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(transaction, field, value)
    db.commit()
    db.refresh(transaction)
    return transaction


@router.delete("/transactions/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_transaction(
    transaction_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    transaction = db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.id_user == current_user.id,
    ).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transacción no encontrada")
    db.delete(transaction)
    db.commit()


# ─── Income Sources ───────────────────────────────────────────────────────────

@router.get("/income-sources", response_model=list[IncomeSourceResponse])
async def list_income_sources(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return db.query(IncomeSource).filter(IncomeSource.id_user == current_user.id).all()


@router.post("/income-sources", response_model=IncomeSourceResponse, status_code=status.HTTP_201_CREATED)
async def create_income_source(
    data: IncomeSourceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    existing = db.query(IncomeSource).filter(
        IncomeSource.name == data.name,
        IncomeSource.id_user == current_user.id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Ya existe una fuente de ingresos con ese nombre")
    source = IncomeSource(**data.model_dump(), id_user=current_user.id)
    db.add(source)
    db.commit()
    db.refresh(source)
    return source


@router.put("/income-sources/{source_id}", response_model=IncomeSourceResponse)
async def update_income_source(
    source_id: int,
    data: IncomeSourceUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    source = db.query(IncomeSource).filter(
        IncomeSource.id == source_id,
        IncomeSource.id_user == current_user.id,
    ).first()
    if not source:
        raise HTTPException(status_code=404, detail="Fuente de ingresos no encontrada")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(source, field, value)
    db.commit()
    db.refresh(source)
    return source


@router.delete("/income-sources/{source_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_income_source(
    source_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    source = db.query(IncomeSource).filter(
        IncomeSource.id == source_id,
        IncomeSource.id_user == current_user.id,
    ).first()
    if not source:
        raise HTTPException(status_code=404, detail="Fuente de ingresos no encontrada")
    db.delete(source)
    db.commit()


# ─── Savings Goals ────────────────────────────────────────────────────────────

@router.get("/savings-goals", response_model=list[SavingsGoalResponse])
async def list_savings_goals(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return db.query(SavingsGoal).filter(SavingsGoal.id_user == current_user.id).all()


@router.post("/savings-goals", response_model=SavingsGoalResponse, status_code=status.HTTP_201_CREATED)
async def create_savings_goal(
    data: SavingsGoalCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    existing = db.query(SavingsGoal).filter(
        SavingsGoal.name == data.name,
        SavingsGoal.id_user == current_user.id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Ya existe una meta de ahorro con ese nombre")
    goal = SavingsGoal(**data.model_dump(), id_user=current_user.id)
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return goal


@router.put("/savings-goals/{goal_id}", response_model=SavingsGoalResponse)
async def update_savings_goal(
    goal_id: int,
    data: SavingsGoalUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    goal = db.query(SavingsGoal).filter(
        SavingsGoal.id == goal_id,
        SavingsGoal.id_user == current_user.id,
    ).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Meta de ahorro no encontrada")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(goal, field, value)
    db.commit()
    db.refresh(goal)
    return goal


@router.delete("/savings-goals/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_savings_goal(
    goal_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    goal = db.query(SavingsGoal).filter(
        SavingsGoal.id == goal_id,
        SavingsGoal.id_user == current_user.id,
    ).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Meta de ahorro no encontrada")
    db.delete(goal)
    db.commit()


# ─── Expense Budgets ──────────────────────────────────────────────────────────

@router.get("/budgets", response_model=list[ExpenseBudgetResponse])
async def list_budgets(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return db.query(ExpenseBudget).filter(ExpenseBudget.id_user == current_user.id).all()


@router.put("/budgets/{category}", response_model=ExpenseBudgetResponse)
async def upsert_budget(
    category: str,
    data: ExpenseBudgetCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    budget = db.query(ExpenseBudget).filter(
        ExpenseBudget.category == category,
        ExpenseBudget.id_user == current_user.id,
    ).first()
    if budget:
        budget.budget = data.budget
    else:
        budget = ExpenseBudget(category=category, budget=data.budget, id_user=current_user.id)
        db.add(budget)
    db.commit()
    db.refresh(budget)
    return budget


# ─── Summary ─────────────────────────────────────────────────────────────────

@router.get("/summary", response_model=FinanceSummaryResponse)
async def get_summary(
    month: Optional[str] = Query(None, description="Formato YYYY-MM"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not month:
        month = date.today().strftime("%Y-%m")

    try:
        year, m = int(month[:4]), int(month[5:7])
    except (ValueError, IndexError):
        raise HTTPException(status_code=400, detail="Formato de mes inválido. Usa YYYY-MM")

    _materialize_recurring(db, current_user.id, year, m)

    transactions = db.query(Transaction).filter(
        Transaction.id_user == current_user.id,
        extract("year", Transaction.date) == year,
        extract("month", Transaction.date) == m,
    ).all()

    total_ingresos = sum(float(t.amount) for t in transactions if t.type == "ingreso")
    total_gastos = sum(float(t.amount) for t in transactions if t.type == "gasto")
    balance = total_ingresos - total_gastos

    sources = db.query(IncomeSource).filter(
        IncomeSource.id_user == current_user.id,
        IncomeSource.is_active == True,  # noqa: E712
    ).all()
    projected = sum(
        float(s.amount) * FREQUENCY_TO_MONTHLY.get(s.frequency, 1.0)
        for s in sources
    )

    savings_rate = (balance / total_ingresos * 100) if total_ingresos > 0 else 0.0

    return FinanceSummaryResponse(
        total_ingresos=round(total_ingresos, 2),
        total_gastos=round(total_gastos, 2),
        balance=round(balance, 2),
        projected_monthly_income=round(projected, 2),
        savings_rate=round(savings_rate, 1),
    )


# ─── Recurring Transactions ───────────────────────────────────────────────────

@router.get("/recurring", response_model=list[RecurringTransactionResponse])
async def list_recurring(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return db.query(RecurringTransaction).filter(
        RecurringTransaction.id_user == current_user.id
    ).order_by(RecurringTransaction.created_at.desc()).all()


@router.post("/recurring", response_model=RecurringTransactionResponse, status_code=status.HTTP_201_CREATED)
async def create_recurring(
    data: RecurringTransactionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rt = RecurringTransaction(**data.model_dump(), id_user=current_user.id)
    db.add(rt)
    db.commit()
    db.refresh(rt)
    # Auto-materialize for the current month immediately
    today = date.today()
    _materialize_recurring(db, current_user.id, today.year, today.month)
    return rt


@router.put("/recurring/{rt_id}", response_model=RecurringTransactionResponse)
async def update_recurring(
    rt_id: int,
    data: RecurringTransactionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rt = db.query(RecurringTransaction).filter(
        RecurringTransaction.id == rt_id,
        RecurringTransaction.id_user == current_user.id,
    ).first()
    if not rt:
        raise HTTPException(status_code=404, detail="Transacción recurrente no encontrada")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(rt, field, value)
    db.commit()
    db.refresh(rt)
    return rt


@router.delete("/recurring/{rt_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_recurring(
    rt_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rt = db.query(RecurringTransaction).filter(
        RecurringTransaction.id == rt_id,
        RecurringTransaction.id_user == current_user.id,
    ).first()
    if not rt:
        raise HTTPException(status_code=404, detail="Transacción recurrente no encontrada")
    db.delete(rt)
    db.commit()
