import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient
from unittest.mock import patch

from models.user import Base, User
from models.task import Task          # noqa: F401 - registra la tabla
from models.habits import Habit       # noqa: F401 - registra la tabla
from models.user_stats import UserHabitStats  # noqa: F401 - registra la tabla
from models.social_account import SocialAccount  # noqa: F401 - registra la tabla
from models.event import Event  # noqa: F401 - registra la tabla
from models.google_calendar_token import GoogleCalendarToken  # noqa: F401 - registra la tabla
from auth.utils import hash_password, create_access_token
from auth.dependencies import get_db

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(autouse=True)
def reset_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield


@pytest.fixture
def db(reset_db):
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(db):
    def override_get_db():
        yield db

    from main import app
    app.dependency_overrides[get_db] = override_get_db
    with patch("main.wait_for_db"):
        with TestClient(app) as c:
            yield c
    app.dependency_overrides.clear()


@pytest.fixture
def test_user(db):
    user = User(
        email="test@example.com",
        username="testuser",
        full_name="Usuario de Prueba",
        hashed_password=hash_password("password123"),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def auth_headers(test_user):
    token = create_access_token(data={"user_id": test_user.id, "email": test_user.email})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def second_user(db):
    user = User(
        email="otro@example.com",
        username="otrousuario",
        full_name="Otro Usuario",
        hashed_password=hash_password("password123"),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def second_auth_headers(second_user):
    token = create_access_token(data={"user_id": second_user.id, "email": second_user.email})
    return {"Authorization": f"Bearer {token}"}
