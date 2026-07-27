import re
import io
import asyncio
import socket
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, select, cast, Numeric, or_
from sqlalchemy.dialects.postgresql import insert as pg_insert
from typing import List, Optional
from pydantic import BaseModel

from app.database import get_db
from app.models.user import User, UserRole
from app.models.parameter import Parameter
from app.models.scorecard import Scorecard
from app.models.score import Score
from app.schemas.parameter import ParameterResponse
from app.schemas.scorecard import ScorecardCreate, ScorecardResponse, ScoreItem
from app.auth.hashing import hash_password
from app.auth.jwt import require_admin

router = APIRouter(prefix="/api/admin", tags=["Admin"])


# ── helpers ─────────────────────────────────────────────────────────────────

async def _domain_has_mx(email: str) -> bool:
    try:
        domain = email.strip().split("@")[1]
        loop   = asyncio.get_event_loop()
        await loop.run_in_executor(None, socket.getaddrinfo, domain, None)
        return True
    except Exception:
        return False


def _make_username(name: str, db: Session) -> str:
    parts    = name.strip().lower().split()
    base     = re.sub(r"[^a-z0-9]", "", parts[0][0] + parts[-1])
    username = base
    counter  = 1
    while db.query(User).filter(User.username == username).first():
        username = base + str(counter)
        counter += 1
    return username


def _upsert_score(db: Session, scorecard_id: int, parameter_id: int, score: int):
    stmt = (
        pg_insert(Score)
        .values(scorecard_id=scorecard_id, parameter_id=parameter_id, score=score)
        .on_conflict_do_update(
            index_elements=["scorecard_id", "parameter_id"],
            set_={"score": score},
        )
    )
    db.execute(stmt)


# ── POST /api/admin/employees (create candidate) ────────────────────────────

class CreateEmployeeBody(BaseModel):
    name:  str
    email: str

@router.post("/employees")
async def create_employee(
    body: CreateEmployeeBody,
    db:   Session = Depends(get_db),
    _:    User    = Depends(require_admin),
):
    name  = body.name.strip()
    email = body.email.strip()
    if not name or not email:
        raise HTTPException(status_code=400, detail="Name and email are required")
    if not await _domain_has_mx(email):
        raise HTTPException(status_code=400, detail="Email domain does not exist or cannot receive emails.")
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=400, detail="Email already exists")

    username = _make_username(name, db)
    employee = User(
        username = username,
        password = hash_password("Emp@1234"),
        role     = UserRole.employee,
        name     = name,
        email    = email,
    )
    db.add(employee)
    db.commit()
    db.refresh(employee)
    return {"id": employee.id, "username": employee.username, "name": employee.name, "email": employee.email}


# ── GET /api/admin/parameters ────────────────────────────────────────────────

@router.get("/parameters", response_model=List[ParameterResponse])
def get_parameters(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return db.query(Parameter).order_by(Parameter.id).all()


# ── GET /api/admin/employees ─────────────────────────────────────────────────

@router.get("/employees")
def get_employees(
    db: Session = Depends(get_db),
    page: int = Query(1,  description="Page number, starting at one"),
    page_number = Query(20, description="Items per page"),
    search: Optional[str] = Query(None, description="Search by name, applicant, client or position"),
    # _: User = Depends(require_admin),
):
    weighted_subq = (
        select(func.sum(Score.score * (4 - Parameter.weightage)))
        .join(Parameter, Score.parameter_id == Parameter.id)
        .where(Score.scorecard_id == Scorecard.id)
        .scalar_subquery()
    )

    q = (
        db.query(
            User.id,
            User.username,
            User.name,
            User.email,
            Scorecard.id.label("scorecard_id"),
            Scorecard.applicant_name,
            Scorecard.client,
            Scorecard.position,
            Scorecard.updated_at,
            func.round(cast(weighted_subq * 100.0 / 115, Numeric), 1).label("weighted_pct"),
        )
        .outerjoin(Scorecard, Scorecard.employee_id == User.id)
        .filter(User.role == UserRole.employee)
    )

    if search and search.strip():
        like = f"%{search.strip()}%"
        q = q.filter(
            or_(
                User.name.ilike(like),
                Scorecard.applicant_name.ilike(like),
                Scorecard.client.ilike(like),
                Scorecard.position.ilike(like),
            )
        )

    rows = q.order_by(User.id).all()

    return [
        {
            "id":             r.id,
            "username":       r.username,
            "name":           r.name,
            "email":          r.email,
            "scorecard_id":   r.scorecard_id,
            "applicant_name": r.applicant_name,
            "client":         r.client,
            "position":       r.position,
            "updated_at":     r.updated_at,
            "weighted_pct":   float(r.weighted_pct) if r.weighted_pct is not None else None,
        }
        for r in rows
    ]


# ── GET /api/admin/employees/{id}/scorecard ───────────────────────────────────

@router.get("/employees/{employee_id}/scorecard")
def get_employee_scorecard(
    employee_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    employee = (
        db.query(User)
        .filter(User.id == employee_id, User.role == UserRole.employee)
        .first()
    )
    if not employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")

    scorecard = db.query(Scorecard).filter(Scorecard.employee_id == employee_id).first()

    employee_data = {
        "id":       employee.id,
        "username": employee.username,
        "name":     scorecard.applicant_name if scorecard else employee.name,
        "email":    employee.email,
    }

    if not scorecard:
        return {"employee": employee_data, "scorecard": None, "scores": []}

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
        "employee":  employee_data,
        "scorecard": {
            "id":             scorecard.id,
            "employee_id":    scorecard.employee_id,
            "applicant_name": scorecard.applicant_name,
            "client":         scorecard.client,
            "position":       scorecard.position,
            "jd_shared":      scorecard.jd_shared,
            "jd_shared_date": scorecard.jd_shared_date,
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


# ── POST /api/admin/employees/{id}/scorecard ──────────────────────────────────

@router.post("/employees/{employee_id}/scorecard")
async def save_employee_scorecard(
    employee_id: int,
    body: ScorecardCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    employee = (
        db.query(User)
        .filter(User.id == employee_id, User.role == UserRole.employee)
        .first()
    )
    if not employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")

    if body.email:
        if not await _domain_has_mx(body.email):
            raise HTTPException(status_code=400, detail="Email domain does not exist or cannot receive emails.")

    if body.email:
        employee.email = body.email.strip()

    scorecard = db.query(Scorecard).filter(Scorecard.employee_id == employee_id).first()
    if scorecard:
        scorecard.applicant_name = body.applicant_name
        scorecard.client         = body.client
        scorecard.position       = body.position
        scorecard.jd_shared      = body.jd_shared
        scorecard.remarks        = body.remarks
        scorecard.jd_shared_date = body.jd_shared_date
        scorecard.updated_at     = func.now()
    else:
        scorecard = Scorecard(
            employee_id    = employee_id,
            applicant_name = body.applicant_name,
            client         = body.client,
            position       = body.position,
            jd_shared      = body.jd_shared,
            remarks        = body.remarks,
        )
        db.add(scorecard)
        db.flush()

    if body.scores:
        for s in body.scores:
            _upsert_score(db, scorecard.id, s.parameter_id, s.score)

    db.commit()
    return {"success": True, "scorecard_id": scorecard.id}


# ── POST /api/admin/upload-excel ─────────────────────────────────────────────

PARAM_COLS = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14]

@router.post("/upload-excel")
async def upload_excel(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    try:
        import openpyxl
    except ImportError:
        raise HTTPException(status_code=500, detail="openpyxl not installed")

    content = await file.read()
    wb      = openpyxl.load_workbook(io.BytesIO(content), data_only=True)
    ws      = wb.active

    rows = list(ws.iter_rows(values_only=True))
    if len(rows) < 2:
        return {"success": True, "results": []}

    results = []
    for row in rows[1:]:
        if not row or not row[1]:
            continue

        applicant_name = str(row[1]).strip()
        if not applicant_name:
            continue

        employee = (
            db.query(User)
            .filter(
                User.role == UserRole.employee,
                func.lower(func.trim(User.name)) == applicant_name.lower(),
            )
            .first()
        )

        is_new = False
        if not employee:
            username = _make_username(applicant_name, db)
            email    = applicant_name + "@scorecard.com"
            employee = User(
                username = username,
                password = hash_password("Emp@1234"),
                role     = UserRole.employee,
                name     = applicant_name,
                email    = email,
            )
            db.add(employee)
            db.flush()
            is_new = True

        client   = str(row[2]) if row[2] is not None else ""
        position = str(row[3]) if row[3] is not None else ""
        jd_shared = str(row[4]).lower() == "yes" if row[4] is not None else False

        scorecard = db.query(Scorecard).filter(Scorecard.employee_id == employee.id).first()
        if scorecard:
            scorecard.applicant_name = applicant_name
            scorecard.client         = client
            scorecard.position       = position
            scorecard.jd_shared      = jd_shared
            scorecard.updated_at     = func.now()
        else:
            scorecard = Scorecard(
                employee_id    = employee.id,
                applicant_name = applicant_name,
                client         = client,
                position       = position,
                jd_shared      = jd_shared,
            )
            db.add(scorecard)
            db.flush()

        for param_idx, col_idx in enumerate(PARAM_COLS):
            val = row[col_idx] if col_idx < len(row) else None
            try:
                score = int(val)
            except (TypeError, ValueError):
                continue
            if 1 <= score <= 5:
                _upsert_score(db, scorecard.id, param_idx + 1, score)

        db.commit()
        results.append({"name": applicant_name, "status": "created" if is_new else "updated"})

    return {"success": True, "results": results}
