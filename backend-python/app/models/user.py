from sqlalchemy import Column, Integer, String, Enum
from app.database import Base
import enum

class UserRole(enum.Enum):
    admin    = "admin"
    employee = "employee"

class User(Base):
    __tablename__ = "users"

    id       = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    role     = Column(Enum(UserRole), nullable=False, default=UserRole.employee)
    name     = Column(String, nullable=False)
    email    = Column(String, unique=True, nullable=False)