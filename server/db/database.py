"""SQLite 연결 및 세션 관리 (SQLModel 사용)"""

from sqlmodel import SQLModel, create_engine, Session

DATABASE_URL = "sqlite:///./kb_balance.db"
engine = create_engine(DATABASE_URL, echo=False)


def init_db():
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session