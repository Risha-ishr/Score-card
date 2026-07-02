from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base, SessionLocal
from app.models import Parameter
from app.routers import users, auth, admin, employee

app = FastAPI(title="Applicant Scorecard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

_seed_done = False

@app.on_event("startup")
def seed():
    global _seed_done
    if _seed_done:
        return
    _seed_done = True
    db = SessionLocal()
    try:
        _seed_parameters(db)
    finally:
        db.close()


def _seed_parameters(db):
    if db.query(Parameter).count():
        return
    params = [
        Parameter(id=1,  name="Urgency",                               description="Urgency for the candidate", weightage=1),
        Parameter(id=2,  name="Actively Looking Out",                  description="Other positions/offers",    weightage=1),
        Parameter(id=3,  name="Joining/Start Date",                    description="Notice dependency",         weightage=1),
        Parameter(id=4,  name="Salary/Earnings Expectations",          description="",                          weightage=2),
        Parameter(id=5,  name="Availability & Accessibility on Calls", description="",                          weightage=2),
        Parameter(id=6,  name="WorkEmotion Grid (WEG) & W/L Balance",  description="",                          weightage=2),
        Parameter(id=7,  name="Communication",                         description="",                          weightage=3),
        Parameter(id=8,  name="Untoward/Emergency Scenarios",          description="",                          weightage=2),
        Parameter(id=9,  name="Completeness",                          description="Meets JD",                  weightage=2),
        Parameter(id=10, name="Risk to Joining",                       description="Other offers",              weightage=1),
    ]
    db.add_all(params)
    db.commit()


app.include_router(auth.router)
app.include_router(users.router)
app.include_router(admin.router)
app.include_router(employee.router)


@app.get("/")
def root():
    return {"message": "Applicant Scorecard API running"}
