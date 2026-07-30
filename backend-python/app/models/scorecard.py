from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.sql import func
from app.database import Base

class Scorecard(Base):
    __tablename__ = "scorecards"

    id             = Column(Integer, primary_key=True, autoincrement=True)
    employee_id    = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    applicant_name = Column(String)
    client         = Column(String)
    position       = Column(String)
    jd_shared      = Column(Boolean, default=False)
    jd_shared_date = Column(DateTime(timezone=True), nullable=True)
    remarks        = Column(String)
    created_at     = Column(DateTime, server_default=func.now())
    updated_at     = Column(DateTime, server_default=func.now(), onupdate=func.now())
    updated_at_history = Column(ARRAY(DateTime(timezone=True)), nullable=False, server_default='{}')
