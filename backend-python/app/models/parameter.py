from sqlalchemy import Column, Integer, String
from app.database import Base

class Parameter(Base):
    __tablename__ = "parameters"

    id          = Column(Integer, primary_key=True)
    name        = Column(String, nullable=False)
    description = Column(String)
    weightage   = Column(Integer, nullable=False)
