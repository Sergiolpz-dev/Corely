from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from models.user import Base


class GoogleCalendarToken(Base):
    __tablename__ = "google_calendar_tokens"

    id_user = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    access_token = Column(Text, nullable=False)
    refresh_token = Column(Text, nullable=True)
    token_expiry = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="google_calendar_token")
