from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class EventCreate(BaseModel):
    title: str
    description: Optional[str] = None
    start_datetime: datetime
    end_datetime: Optional[datetime] = None
    event_type: str = "other"
    location: Optional[str] = None
    create_in_google: bool = False


class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start_datetime: Optional[datetime] = None
    end_datetime: Optional[datetime] = None
    event_type: Optional[str] = None
    location: Optional[str] = None
    sync_action: Optional[str] = None  # "add_to_google" | "remove_from_google"


class EventResponse(BaseModel):
    id: int
    id_user: int
    title: str
    description: Optional[str] = None
    start_datetime: datetime
    end_datetime: Optional[datetime] = None
    event_type: str
    location: Optional[str] = None
    is_google_event: bool
    google_event_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
