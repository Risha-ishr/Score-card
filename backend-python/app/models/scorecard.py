from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
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
    remarks        = Column(String)
    created_at     = Column(DateTime, server_default=func.now())
    updated_at     = Column(DateTime, server_default=func.now(), onupdate=func.now())
