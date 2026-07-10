from typing import Optional
from sqlalchemy.orm import Session
from app.models.user import User
from app.auth.jwt import get_password_hash


class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, user_id: int) -> Optional[User]:
        return self.db.query(User).filter(User.id == user_id).first()

    def get_by_email(self, email: str) -> Optional[User]:
        return self.db.query(User).filter(User.email == email).first()

    def create(self, email: str, password: str, full_name: Optional[str] = None, is_admin: bool = False) -> User:
        user = User(
            email=email,
            hashed_password=get_password_hash(password),
            full_name=full_name,
            is_admin=is_admin,
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def ensure_admin_exists(self, email: str, password: str) -> User:
        existing = self.get_by_email(email)
        if existing:
            return existing
        return self.create(email=email, password=password, full_name="System Admin", is_admin=True)
