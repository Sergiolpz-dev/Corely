from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from typing import Optional, List

import httpx

from events.schemas import EventCreate, EventUpdate, EventResponse
from auth.dependencies import get_current_user, get_db
from auth.utils import create_access_token, verify_token
from models.event import Event
from models.google_calendar_token import GoogleCalendarToken
from models.user import User
from config import settings

router = APIRouter(prefix="/events", tags=["Events"])

CALENDAR_SCOPES = [
    "https://www.googleapis.com/auth/calendar.readonly",
    "https://www.googleapis.com/auth/calendar.events",
]
GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3"


# ── CRUD ──────────────────────────────────────────────────────────────────────

@router.get("", response_model=List[EventResponse])
async def list_events(
    start: Optional[datetime] = Query(None),
    end: Optional[datetime] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Lista eventos del usuario, opcionalmente filtrados por rango de fechas."""
    query = db.query(Event).filter(Event.id_user == current_user.id)
    if start:
        query = query.filter(Event.start_datetime >= start)
    if end:
        query = query.filter(Event.start_datetime <= end)
    return query.order_by(Event.start_datetime).all()


@router.post("", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
async def create_event(
    event_data: EventCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Crea un nuevo evento. Si create_in_google=True y el usuario tiene token, crea también en Google Calendar."""
    new_event = Event(
        id_user=current_user.id,
        title=event_data.title,
        description=event_data.description,
        start_datetime=event_data.start_datetime,
        end_datetime=event_data.end_datetime,
        event_type=event_data.event_type,
        location=event_data.location,
        is_google_event=False,
    )

    if event_data.create_in_google:
        token_record = db.query(GoogleCalendarToken).filter(
            GoogleCalendarToken.id_user == current_user.id
        ).first()
        if token_record:
            google_event_id = await _create_google_event(event_data, token_record, db)
            if google_event_id:
                new_event.google_event_id = google_event_id

    db.add(new_event)
    db.commit()
    db.refresh(new_event)
    return new_event


@router.put("/{event_id}", response_model=EventResponse)
async def update_event(
    event_id: int,
    event_data: EventUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Edita un evento. Si tiene google_event_id, lo actualiza también en Google Calendar.
    sync_action='add_to_google' lo enlaza; sync_action='remove_from_google' lo desvincula."""
    event = db.query(Event).filter(
        Event.id == event_id,
        Event.id_user == current_user.id,
    ).first()

    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Evento no encontrado")

    sync_action = event_data.sync_action

    # Aplicar cambios de datos (excluir sync_action, que no es columna de BD)
    update_fields = event_data.model_dump(exclude_unset=True, exclude={"sync_action"})
    for field, value in update_fields.items():
        setattr(event, field, value)

    db.commit()
    db.refresh(event)

    # Gestión de Google Calendar (errores son silenciosos para no bloquear)
    token_record = db.query(GoogleCalendarToken).filter(
        GoogleCalendarToken.id_user == current_user.id
    ).first()

    if token_record:
        if sync_action == "add_to_google" and not event.google_event_id:
            # Crear en Google Calendar y guardar el ID
            from events.schemas import EventCreate as _EC
            payload = _EC(
                title=event.title,
                description=event.description,
                start_datetime=event.start_datetime,
                end_datetime=event.end_datetime,
                location=event.location,
            )
            google_id = await _create_google_event(payload, token_record, db)
            if google_id:
                event.google_event_id = google_id
                db.commit()
                db.refresh(event)

        elif sync_action == "remove_from_google" and event.google_event_id:
            # Eliminar de Google Calendar y limpiar el ID
            await _delete_google_event(event.google_event_id, token_record, db)
            event.google_event_id = None
            db.commit()
            db.refresh(event)

        elif event.google_event_id:
            # El evento ya estaba en Google → actualizarlo
            await _update_google_event(event, token_record, db)

    return event


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_event(
    event_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Elimina un evento. Si tiene google_event_id, lo elimina también de Google Calendar."""
    event = db.query(Event).filter(
        Event.id == event_id,
        Event.id_user == current_user.id,
    ).first()

    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Evento no encontrado")

    # Intentar eliminar de Google Calendar (silencioso si falla)
    if event.google_event_id:
        token_record = db.query(GoogleCalendarToken).filter(
            GoogleCalendarToken.id_user == current_user.id
        ).first()
        if token_record:
            await _delete_google_event(event.google_event_id, token_record, db)

    db.delete(event)
    db.commit()


# ── GOOGLE CALENDAR ───────────────────────────────────────────────────────────

@router.get("/google/status")
async def google_calendar_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Indica si el usuario tiene Google Calendar conectado."""
    token = db.query(GoogleCalendarToken).filter(
        GoogleCalendarToken.id_user == current_user.id
    ).first()
    return {"connected": token is not None and token.refresh_token is not None}


@router.get("/google/auth-url")
async def google_calendar_auth_url(
    current_user: User = Depends(get_current_user),
):
    """Devuelve la URL para autorizar acceso a Google Calendar."""
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google OAuth no está configurado en el servidor",
        )

    # Codificar user_id en el state para recuperarlo en el callback
    state = create_access_token(data={"user_id": current_user.id, "purpose": "gcal"})
    redirect_uri = f"{settings.BACKEND_URL}/events/google/callback"
    scope = "%20".join(CALENDAR_SCOPES)

    url = (
        f"{GOOGLE_AUTH_URL}"
        f"?client_id={settings.GOOGLE_CLIENT_ID}"
        f"&redirect_uri={redirect_uri}"
        f"&response_type=code"
        f"&scope={scope}"
        f"&access_type=offline"
        f"&prompt=consent"
        f"&state={state}"
    )
    return {"url": url}


@router.get("/google/callback")
async def google_calendar_callback(
    code: str,
    state: str,
    db: Session = Depends(get_db),
):
    """Callback OAuth de Google Calendar. Guarda tokens y redirige al frontend."""
    # Verificar state para obtener el user_id
    payload = verify_token(state)
    if not payload or payload.get("purpose") != "gcal":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="State inválido")

    user_id = payload.get("user_id")
    redirect_uri = f"{settings.BACKEND_URL}/events/google/callback"

    async with httpx.AsyncClient() as client:
        token_response = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "code": code,
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "redirect_uri": redirect_uri,
                "grant_type": "authorization_code",
            },
        )

    if token_response.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Error al obtener tokens de Google",
        )

    tokens = token_response.json()
    access_token = tokens.get("access_token")
    refresh_token = tokens.get("refresh_token")
    expires_in = tokens.get("expires_in", 3600)
    expiry = datetime.utcnow() + timedelta(seconds=expires_in)

    # Guardar o actualizar el token
    token_record = db.query(GoogleCalendarToken).filter(
        GoogleCalendarToken.id_user == user_id
    ).first()

    if token_record:
        token_record.access_token = access_token
        if refresh_token:
            token_record.refresh_token = refresh_token
        token_record.token_expiry = expiry
    else:
        token_record = GoogleCalendarToken(
            id_user=user_id,
            access_token=access_token,
            refresh_token=refresh_token,
            token_expiry=expiry,
        )
        db.add(token_record)

    db.commit()
    return RedirectResponse(url=f"{settings.FRONTEND_URL}/calendario?google_connected=true")


@router.post("/sync-google", response_model=List[EventResponse])
async def sync_google_calendar(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Sincroniza eventos de Google Calendar desde hoy en adelante (upsert por google_event_id)."""
    token_record = db.query(GoogleCalendarToken).filter(
        GoogleCalendarToken.id_user == current_user.id
    ).first()

    if not token_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google Calendar no está conectado. Conéctalo primero.",
        )

    access_token = await _get_valid_access_token(token_record, db)
    time_min = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{GOOGLE_CALENDAR_API}/calendars/primary/events",
            headers={"Authorization": f"Bearer {access_token}"},
            params={
                "timeMin": time_min,
                "maxResults": 250,
                "singleEvents": True,
                "orderBy": "startTime",
            },
        )

    if response.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Error al obtener eventos de Google Calendar",
        )

    google_events = response.json().get("items", [])
    synced: List[Event] = []

    for g_event in google_events:
        google_event_id = g_event.get("id")
        if not google_event_id:
            continue

        title = g_event.get("summary") or "Sin título"
        description = g_event.get("description")
        location = g_event.get("location")
        start_dt = _parse_google_datetime(g_event.get("start", {}))
        end_dt = _parse_google_datetime(g_event.get("end", {}))

        if not start_dt:
            continue

        # Upsert: buscar si ya existe este evento de Google para este usuario
        existing = db.query(Event).filter(
            Event.id_user == current_user.id,
            Event.google_event_id == google_event_id,
        ).first()

        if existing:
            existing.title = title
            existing.description = description
            existing.start_datetime = start_dt
            existing.end_datetime = end_dt
            existing.location = location
            db.commit()
            db.refresh(existing)
            synced.append(existing)
        else:
            new_event = Event(
                id_user=current_user.id,
                title=title,
                description=description,
                start_datetime=start_dt,
                end_datetime=end_dt,
                event_type="other",
                location=location,
                is_google_event=True,
                google_event_id=google_event_id,
            )
            db.add(new_event)
            db.commit()
            db.refresh(new_event)
            synced.append(new_event)

    return synced


# ── HELPERS ───────────────────────────────────────────────────────────────────

def _parse_google_datetime(time_info: dict) -> Optional[datetime]:
    """Parsea el formato de fecha/hora de Google Calendar a datetime naive UTC."""
    if not time_info:
        return None
    dt_str = time_info.get("dateTime") or time_info.get("date")
    if not dt_str:
        return None
    try:
        if "T" in dt_str:
            dt = datetime.fromisoformat(dt_str.replace("Z", "+00:00"))
            return dt.replace(tzinfo=None)
        else:
            # Evento de día completo
            return datetime.strptime(dt_str, "%Y-%m-%d")
    except Exception:
        return None


async def _get_valid_access_token(token_record: GoogleCalendarToken, db: Session) -> str:
    """Devuelve access_token válido, refrescándolo si ha expirado."""
    now = datetime.utcnow()
    if token_record.token_expiry and token_record.token_expiry > now:
        return token_record.access_token

    if not token_record.refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de Google Calendar expirado. Vuelve a conectar Google Calendar.",
        )

    async with httpx.AsyncClient() as client:
        response = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "refresh_token": token_record.refresh_token,
                "grant_type": "refresh_token",
            },
        )

    if response.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No se pudo refrescar el token de Google Calendar.",
        )

    tokens = response.json()
    token_record.access_token = tokens["access_token"]
    token_record.token_expiry = datetime.utcnow() + timedelta(seconds=tokens.get("expires_in", 3600))
    db.commit()

    return token_record.access_token


async def _update_google_event(
    event: Event,
    token_record: GoogleCalendarToken,
    db: Session,
) -> None:
    """Actualiza el evento en Google Calendar. Silencioso si falla."""
    try:
        access_token = await _get_valid_access_token(token_record, db)
        end_dt = event.end_datetime or event.start_datetime
        body = {
            "summary": event.title,
            "description": event.description,
            "location": event.location,
            "start": {"dateTime": event.start_datetime.isoformat(), "timeZone": "UTC"},
            "end": {"dateTime": end_dt.isoformat(), "timeZone": "UTC"},
        }
        async with httpx.AsyncClient() as client:
            await client.patch(
                f"{GOOGLE_CALENDAR_API}/calendars/primary/events/{event.google_event_id}",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json",
                },
                json=body,
            )
    except Exception:
        pass


async def _delete_google_event(
    google_event_id: str,
    token_record: GoogleCalendarToken,
    db: Session,
) -> None:
    """Elimina el evento de Google Calendar. Silencioso si falla."""
    try:
        access_token = await _get_valid_access_token(token_record, db)
        async with httpx.AsyncClient() as client:
            await client.delete(
                f"{GOOGLE_CALENDAR_API}/calendars/primary/events/{google_event_id}",
                headers={"Authorization": f"Bearer {access_token}"},
            )
    except Exception:
        pass


async def _create_google_event(
    event_data: EventCreate,
    token_record: GoogleCalendarToken,
    db: Session,
) -> Optional[str]:
    """Crea un evento en Google Calendar y devuelve su ID. Devuelve None si falla."""
    try:
        access_token = await _get_valid_access_token(token_record, db)
        end_dt = event_data.end_datetime or event_data.start_datetime

        google_event = {
            "summary": event_data.title,
            "description": event_data.description,
            "location": event_data.location,
            "start": {"dateTime": event_data.start_datetime.isoformat(), "timeZone": "UTC"},
            "end": {"dateTime": end_dt.isoformat(), "timeZone": "UTC"},
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{GOOGLE_CALENDAR_API}/calendars/primary/events",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json",
                },
                json=google_event,
            )

        if response.status_code == 200:
            return response.json().get("id")
    except Exception:
        pass
    return None
