from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ScoreItem(BaseModel):
    parameter_id: int
    score:        int

class ScorecardCreate(BaseModel):
    employee_name:  Optional[str] = None
    email:          Optional[str] = None
    applicant_name: Optional[str] = None
    client:         Optional[str] = None
    position:       Optional[str] = None
    jd_shared:      Optional[bool] = False
    jd_shared_date: Optional[datetime] = None
    remarks:        Optional[str] = None
    scores:         Optional[List[ScoreItem]] = []

class ScorecardResponse(BaseModel):
    id:             int
    employee_id:    int
    applicant_name: Optional[str] = None
    client:         Optional[str] = None
    position:       Optional[str] = None
    jd_shared:      Optional[bool] = None
    jd_shared_date: Optional[datetime] = None
    remarks:        Optional[str] = None
    created_at:     Optional[datetime] = None
    updated_at:     Optional[datetime] = None

    class Config:
        from_attributes = True
