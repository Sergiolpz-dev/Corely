from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime

from models.user import Base


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    id_user = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    start_datetime = Column(DateTime, nullable=False)
    end_datetime = Column(DateTime, nullable=True)
    event_type = Column(String(20), default="other")  # meeting|presentation|planning|workshop|other
    location = Column(String(100), nullable=True)
    is_google_event = Column(Boolean, default=False)
    google_event_id = Column(String(255), nullable=True)  # ID del evento en Google Calendar
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="events")

    __table_args__ = (UniqueConstraint("id_user", "google_event_id"),)
