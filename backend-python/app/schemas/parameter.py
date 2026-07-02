from pydantic import BaseModel
from typing import Optional

class ParameterResponse(BaseModel):
    id:          int
    name:        str
    description: Optional[str] = None
    weightage:   int

    class Config:
        from_attributes = True
