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
        Parameter(id=1,  name="Urgency / Active Search",                     description="",                     weightage=12),
        Parameter(id=2,  name="Counter-Offer & Competitive Position",        description="",                     weightage=10),
        Parameter(id=3,  name="Joining & Timeline Fit",                      description="",                     weightage=10),
        Parameter(id=4,  name="Compensation Expectations & Flexibility",     description="",                     weightage=4),
        Parameter(id=5,  name="Process Engagement",                         description="Closure Probability",  weightage=4),
        Parameter(id=6,  name="Work Emotion Grid (WEG)",                    description="",                     weightage=6),
        Parameter(id=7,  name="Work-Life & Location Fit",                   description="",                     weightage=6),
        Parameter(id=8,  name="Communication & Clarity",                    description="",                     weightage=10),
        Parameter(id=9,  name="Candidate Fit",                              description="",                     weightage=16),
        Parameter(id=10, name="Process Engagement",                        description="Risk Control",         weightage=10),
        Parameter(id=11, name="Risk to Joining / Untoward Scenarios",       description="",                     weightage=12),
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
