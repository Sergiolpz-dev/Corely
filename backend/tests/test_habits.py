"""
Pruebas del módulo de hábitos.
Cubre operaciones CRUD y la lógica de racha individual (toggle).
"""
from datetime import date, timedelta

from models.habits import Habit

HABIT_DATA = {
    "name": "Meditar",
    "goal": 30,
    "color": "azul",
}


def test_create_habit(client, test_user, auth_headers):
    """Crear un hábito devuelve 201 con streak inicial = 0."""
    response = client.post("/habits", json=HABIT_DATA, headers=auth_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == HABIT_DATA["name"]
    assert data["goal"] == HABIT_DATA["goal"]
    assert data["streak"] == 0


def test_create_habit_duplicate_name(client, test_user, auth_headers):
    """Crear dos hábitos con el mismo nombre para un usuario devuelve 400."""
    client.post("/habits", json=HABIT_DATA, headers=auth_headers)
    response = client.post("/habits", json=HABIT_DATA, headers=auth_headers)
    assert response.status_code == 400


def test_get_habits(client, test_user, auth_headers):
    """GET /habits devuelve la lista de hábitos del usuario."""
    client.post("/habits", json=HABIT_DATA, headers=auth_headers)
    response = client.get("/habits", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == HABIT_DATA["name"]


def test_update_habit(client, test_user, auth_headers):
    """PUT /habits/{id} actualiza los campos del hábito correctamente."""
    create_response = client.post("/habits", json=HABIT_DATA, headers=auth_headers)
    habit_id = create_response.json()["id"]

    response = client.put(f"/habits/{habit_id}", json={"goal": 60}, headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["goal"] == 60


def test_delete_habit(client, test_user, auth_headers):
    """DELETE /habits/{id} elimina el hábito y devuelve 204."""
    create_response = client.post("/habits", json=HABIT_DATA, headers=auth_headers)
    habit_id = create_response.json()["id"]

    response = client.delete(f"/habits/{habit_id}", headers=auth_headers)
    assert response.status_code == 204


def test_toggle_first_time(client, test_user, auth_headers):
    """El primer toggle de un hábito establece streak = 1."""
    create_response = client.post("/habits", json=HABIT_DATA, headers=auth_headers)
    habit_id = create_response.json()["id"]

    response = client.post(f"/habits/{habit_id}/toggle", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["streak"] == 1


def test_toggle_undo_today(client, test_user, auth_headers):
    """Marcar y desmarcar un hábito el mismo día reduce el streak."""
    create_response = client.post("/habits", json=HABIT_DATA, headers=auth_headers)
    habit_id = create_response.json()["id"]

    client.post(f"/habits/{habit_id}/toggle", headers=auth_headers)  # streak = 1
    response = client.post(f"/habits/{habit_id}/toggle", headers=auth_headers)  # deshacer
    assert response.status_code == 200
    assert response.json()["streak"] == 0


def test_toggle_grace_period(client, db, test_user, auth_headers):
    """Saltar un día no rompe la racha gracias al período de gracia."""
    two_days_ago = date.today() - timedelta(days=2)
    habit = Habit(
        name="Leer",
        goal=60,
        id_user=test_user.id,
        streak=5,
        last_completed_date=two_days_ago,
    )
    db.add(habit)
    db.commit()

    response = client.post(f"/habits/{habit.id}/toggle", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["streak"] == 6


def test_toggle_broken_streak(client, db, test_user, auth_headers):
    """Superar el período de gracia reinicia la racha a 1."""
    three_days_ago = date.today() - timedelta(days=3)
    habit = Habit(
        name="Correr",
        goal=365,
        id_user=test_user.id,
        streak=10,
        last_completed_date=three_days_ago,
    )
    db.add(habit)
    db.commit()

    response = client.post(f"/habits/{habit.id}/toggle", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["streak"] == 1
