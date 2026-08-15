import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Load environment variables from .env file
load_dotenv()

# Read the database URL from the environment variable (never hardcoded)
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://devops_user:devops_password@localhost:5432/devops_monitor"
)

# Create the SQLAlchemy engine for PostgreSQL
engine = create_engine(DATABASE_URL, echo=False)

# Create a session factory for database operations
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for SQLAlchemy ORM models
Base = declarative_base()


def get_db():
    """
    Dependency helper that yields a database session and closes it after use.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
