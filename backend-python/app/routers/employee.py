from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, UserRole
from app.models.scorecard import Scorecard
from app.models.score import Score
from app.models.parameter import Parameter
from app.auth.jwt import get_current_user

router = APIRouter(prefix="/api/employee", tags=["Employee"])


@router.get("/scorecard")
def get_my_scorecard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != UserRole.employee:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Employee access required")

    scorecard = db.query(Scorecard).filter(Scorecard.employee_id == current_user.id).first()
    if not scorecard:
        return {"scorecard": None, "scores": []}

    scores = (
        db.query(
            Score.parameter_id,
            Score.score,
            Parameter.name,
            Parameter.description,
            Parameter.weightage,
        )
        .join(Parameter, Score.parameter_id == Parameter.id)
        .filter(Score.scorecard_id == scorecard.id)
        .order_by(Parameter.id)
        .all()
    )

    return {
        "scorecard": {
            "id":             scorecard.id,
            "employee_id":    scorecard.employee_id,
            "applicant_name": scorecard.applicant_name,
            "client":         scorecard.client,
            "position":       scorecard.position,
            "jd_shared":      scorecard.jd_shared,
            "remarks":        scorecard.remarks,
            "created_at":     scorecard.created_at,
            "updated_at":     scorecard.updated_at,
        },
        "scores": [
            {
                "parameter_id": s.parameter_id,
                "score":        s.score,
                "name":         s.name,
                "description":  s.description,
                "weightage":    s.weightage,
            }
            for s in scores
        ],
    }
