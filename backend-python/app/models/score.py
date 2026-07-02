from sqlalchemy import Column, Integer, ForeignKey, UniqueConstraint
from app.database import Base

class Score(Base):
    __tablename__ = "scores"

    id           = Column(Integer, primary_key=True, autoincrement=True)
    scorecard_id = Column(Integer, ForeignKey("scorecards.id"), nullable=False)
    parameter_id = Column(Integer, ForeignKey("parameters.id"), nullable=False)
    score        = Column(Integer, nullable=False)

    __table_args__ = (UniqueConstraint("scorecard_id", "parameter_id"),)
