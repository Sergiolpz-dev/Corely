from sqlalchemy import Column, Integer, String, Numeric, Boolean, Date, DateTime, Text, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from models.user import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    id_user = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    description = Column(String(100), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)  # always positive
    type = Column(String(10), nullable=False)         # "ingreso" | "gasto"
    category = Column(String(50), nullable=True)
    date = Column(Date, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    recurring_id = Column(Integer, ForeignKey("recurring_transactions.id", ondelete="SET NULL"), nullable=True)

    user = relationship("User", back_populates="transactions")
    recurring = relationship("RecurringTransaction", back_populates="transactions")


class IncomeSource(Base):
    __tablename__ = "income_sources"

    id = Column(Integer, primary_key=True, index=True)
    id_user = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    category = Column(String(30), nullable=False)   # "nomina"|"freelance"|"alquiler"|"pension"|"otro"
    amount = Column(Numeric(10, 2), nullable=False)
    frequency = Column(String(20), nullable=False)  # "mensual"|"semanal"|"anual"|"puntual"
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="income_sources")

    __table_args__ = (
        UniqueConstraint("name", "id_user", name="uq_income_source_name_user"),
    )


class SavingsGoal(Base):
    __tablename__ = "savings_goals"

    id = Column(Integer, primary_key=True, index=True)
    id_user = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    target_amount = Column(Numeric(10, 2), nullable=False)
    current_amount = Column(Numeric(10, 2), default=0.00, nullable=False)
    color = Column(String(20), nullable=True)
    deadline = Column(Date, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="savings_goals")

    __table_args__ = (
        UniqueConstraint("name", "id_user", name="uq_savings_goal_name_user"),
    )


class ExpenseBudget(Base):
    __tablename__ = "expense_budgets"

    id = Column(Integer, primary_key=True, index=True)
    id_user = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    category = Column(String(50), nullable=False)
    budget = Column(Numeric(10, 2), nullable=False)

    user = relationship("User", back_populates="expense_budgets")

    __table_args__ = (
        UniqueConstraint("category", "id_user", name="uq_expense_budget_category_user"),
    )


class RecurringTransaction(Base):
    """Template for transactions that auto-materialize monthly."""
    __tablename__ = "recurring_transactions"

    id = Column(Integer, primary_key=True, index=True)
    id_user = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    description = Column(String(100), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    type = Column(String(10), nullable=False)    # "ingreso" | "gasto"
    category = Column(String(50), nullable=True)
    day_of_month = Column(Integer, nullable=False, default=1)  # 1-28
    notes = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="recurring_transactions")
    transactions = relationship("Transaction", back_populates="recurring")
