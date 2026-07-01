from fastapi import FastAPI
from app.database import engine, Base
from app.models import User
from app.routers import users

app = FastAPI()

Base.metadata.create_all(bind=engine)

app.include_router(users.router)

@app.get("/")
def root():
    return {"message": "Applicant Scorecard API running"}