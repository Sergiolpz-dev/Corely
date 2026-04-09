from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(50), unique=True, index=True, nullable=False)
    full_name = Column(String(100), nullable=False)
    hashed_password = Column(String(255), nullable=True)  # Nullable para usuarios OAuth
    avatar_url = Column(Text, nullable=True)
    is_email_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relacion con cuentas sociales
    social_accounts = relationship(
        "SocialAccount", back_populates="user", cascade="all, delete-orphan"
    )

    # Relacion con tareas
    tasks = relationship("Task", back_populates="user", cascade="all, delete-orphan")

    # Relacion con hábitos
    habits = relationship("Habit", back_populates="user", cascade="all, delete-orphan")

    # Relacion con eventos
    events = relationship("Event", back_populates="user", cascade="all, delete-orphan")

    # Token de Google Calendar
    google_calendar_token = relationship(
        "GoogleCalendarToken", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )

    # Finanzas
    transactions = relationship("Transaction", back_populates="user", cascade="all, delete-orphan")
    income_sources = relationship("IncomeSource", back_populates="user", cascade="all, delete-orphan")
    savings_goals = relationship("SavingsGoal", back_populates="user", cascade="all, delete-orphan")
    expense_budgets = relationship("ExpenseBudget", back_populates="user", cascade="all, delete-orphan")
    recurring_transactions = relationship("RecurringTransaction", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, username={self.username})>"

    @property
    def has_password(self) -> bool:
        """Indica si el usuario tiene password configurada"""
        return self.hashed_password is not None
