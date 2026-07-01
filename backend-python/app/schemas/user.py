from pydantic import BaseModel
from app.models.user import UserRole

class UserCreate(BaseModel):
    username: str
    password: str
    role: UserRole
    name: str
    email: str

class UserResponse(BaseModel):
    id: int
    username: str
    role: UserRole
    name: str
    email: str

    class Config:
        from_attributes = True