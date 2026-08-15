from database import Base, engine
import models


def init_db():
    """
    Initializes the PostgreSQL database by creating all defined tables.
    """
    print("Connecting to PostgreSQL database...")
    try:
        # Create all tables defined in SQLAlchemy models (e.g. 'metrics')
        Base.metadata.create_all(bind=engine)
        print("Successfully connected to PostgreSQL database!")
        print("Database table 'metrics' verified/created successfully.")
    except Exception as err:
        print(f"Failed to connect to PostgreSQL database: {err}")
        print("\nTroubleshooting tips:")
        print("1. Ensure PostgreSQL is installed and running on your system.")
        print("2. Verify credentials in your .env file match your PostgreSQL installation.")
        print("3. Ensure the database 'devops_monitor' exists in PostgreSQL.")


if __name__ == "__main__":
    init_db()
