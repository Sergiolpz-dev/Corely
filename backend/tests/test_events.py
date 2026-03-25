import pytest
from datetime import datetime

from models.event import Event
from models.google_calendar_token import GoogleCalendarToken


# ── Helpers ────────────────────────────────────────────────────────────────────

def _event_payload(**kwargs):
    base = {
        "title": "Reunión de equipo",
        "start_datetime": "2026-04-01T10:00:00",
        "event_type": "meeting",
    }
    base.update(kwargs)
    return base


# ── CRUD Tests ─────────────────────────────────────────────────────────────────

def test_create_event(client, auth_headers):
    response = client.post("/events", headers=auth_headers, json=_event_payload())
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Reunión de equipo"
    assert data["event_type"] == "meeting"
    assert data["is_google_event"] is False
    assert data["google_event_id"] is None


def test_create_event_with_all_fields(client, auth_headers):
    payload = _event_payload(
        title="Workshop de diseño",
        description="Taller de UX",
        end_datetime="2026-04-01T12:00:00",
        event_type="workshop",
        location="Sala A",
    )
    response = client.post("/events", headers=auth_headers, json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["description"] == "Taller de UX"
    assert data["location"] == "Sala A"
    assert data["end_datetime"] is not None


def test_list_events_empty(client, auth_headers):
    response = client.get("/events", headers=auth_headers)
    assert response.status_code == 200
    assert response.json() == []


def test_list_events(client, auth_headers, db, test_user):
    db.add(Event(id_user=test_user.id, title="Evento 1", start_datetime=datetime(2026, 4, 1, 10, 0), event_type="other"))
    db.add(Event(id_user=test_user.id, title="Evento 2", start_datetime=datetime(2026, 4, 2, 10, 0), event_type="meeting"))
    db.commit()

    response = client.get("/events", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    # Deben estar ordenados por start_datetime
    assert data[0]["title"] == "Evento 1"
    assert data[1]["title"] == "Evento 2"


def test_list_events_only_own(client, auth_headers, second_auth_headers, db, test_user, second_user):
    db.add(Event(id_user=test_user.id, title="Mío", start_datetime=datetime(2026, 4, 1, 10, 0), event_type="other"))
    db.add(Event(id_user=second_user.id, title="Ajeno", start_datetime=datetime(2026, 4, 1, 10, 0), event_type="other"))
    db.commit()

    response = client.get("/events", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["title"] == "Mío"


def test_list_events_filter_by_start(client, auth_headers, db, test_user):
    db.add(Event(id_user=test_user.id, title="Pasado", start_datetime=datetime(2026, 1, 1, 10, 0), event_type="other"))
    db.add(Event(id_user=test_user.id, title="Futuro", start_datetime=datetime(2026, 12, 1, 10, 0), event_type="other"))
    db.commit()

    response = client.get("/events?start=2026-06-01T00:00:00", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["title"] == "Futuro"


def test_list_events_filter_by_range(client, auth_headers, db, test_user):
    db.add(Event(id_user=test_user.id, title="Enero", start_datetime=datetime(2026, 1, 15, 10, 0), event_type="other"))
    db.add(Event(id_user=test_user.id, title="Abril", start_datetime=datetime(2026, 4, 15, 10, 0), event_type="other"))
    db.add(Event(id_user=test_user.id, title="Diciembre", start_datetime=datetime(2026, 12, 15, 10, 0), event_type="other"))
    db.commit()

    response = client.get("/events?start=2026-03-01T00:00:00&end=2026-06-01T00:00:00", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["title"] == "Abril"


def test_update_event(client, auth_headers, db, test_user):
    event = Event(id_user=test_user.id, title="Original", start_datetime=datetime(2026, 4, 1, 10, 0), event_type="other")
    db.add(event)
    db.commit()
    db.refresh(event)

    response = client.put(f"/events/{event.id}", headers=auth_headers, json={"title": "Actualizado", "event_type": "meeting"})
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Actualizado"
    assert data["event_type"] == "meeting"


def test_update_event_partial(client, auth_headers, db, test_user):
    event = Event(id_user=test_user.id, title="Sin cambiar", start_datetime=datetime(2026, 4, 1, 10, 0), event_type="other", location="Madrid")
    db.add(event)
    db.commit()
    db.refresh(event)

    # Solo actualizar location
    response = client.put(f"/events/{event.id}", headers=auth_headers, json={"location": "Barcelona"})
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Sin cambiar"  # No cambia
    assert data["location"] == "Barcelona"  # Sí cambia


def test_update_event_not_found(client, auth_headers):
    response = client.put("/events/9999", headers=auth_headers, json={"title": "x"})
    assert response.status_code == 404


def test_update_event_other_user(client, second_auth_headers, db, test_user):
    event = Event(id_user=test_user.id, title="No mío", start_datetime=datetime(2026, 4, 1, 10, 0), event_type="other")
    db.add(event)
    db.commit()
    db.refresh(event)

    response = client.put(f"/events/{event.id}", headers=second_auth_headers, json={"title": "Intento cambiar"})
    assert response.status_code == 404


def test_delete_event(client, auth_headers, db, test_user):
    event = Event(id_user=test_user.id, title="A borrar", start_datetime=datetime(2026, 4, 1, 10, 0), event_type="other")
    db.add(event)
    db.commit()
    db.refresh(event)

    response = client.delete(f"/events/{event.id}", headers=auth_headers)
    assert response.status_code == 204

    assert db.query(Event).filter(Event.id == event.id).first() is None


def test_delete_event_not_found(client, auth_headers):
    response = client.delete("/events/9999", headers=auth_headers)
    assert response.status_code == 404


def test_delete_event_other_user(client, second_auth_headers, db, test_user):
    event = Event(id_user=test_user.id, title="No mío", start_datetime=datetime(2026, 4, 1, 10, 0), event_type="other")
    db.add(event)
    db.commit()
    db.refresh(event)

    response = client.delete(f"/events/{event.id}", headers=second_auth_headers)
    assert response.status_code == 404


# ── Google Calendar Tests ──────────────────────────────────────────────────────

def test_google_status_not_connected(client, auth_headers):
    response = client.get("/events/google/status", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["connected"] is False


def test_google_status_connected(client, auth_headers, db, test_user):
    token = GoogleCalendarToken(
        id_user=test_user.id,
        access_token="fake_access_token",
        refresh_token="fake_refresh_token",
    )
    db.add(token)
    db.commit()

    response = client.get("/events/google/status", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["connected"] is True


def test_google_status_no_refresh_token(client, auth_headers, db, test_user):
    # Token sin refresh_token → no considerado "conectado"
    token = GoogleCalendarToken(
        id_user=test_user.id,
        access_token="fake_access_token",
        refresh_token=None,
    )
    db.add(token)
    db.commit()

    response = client.get("/events/google/status", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["connected"] is False


def test_sync_google_no_token(client, auth_headers):
    response = client.post("/events/sync-google", headers=auth_headers)
    assert response.status_code == 400
    assert "no está conectado" in response.json()["detail"].lower()


def test_events_require_auth(client):
    response = client.get("/events")
    assert response.status_code == 401
