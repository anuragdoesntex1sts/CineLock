from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional
import uuid


@dataclass
class User:
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    email: str = ""
    password_hash: str = ""
    full_name: str = ""
    is_active: bool = True
    is_admin: bool = False
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "email": self.email,
            "password_hash": self.password_hash,
            "full_name": self.full_name,
            "is_active": self.is_active,
            "is_admin": self.is_admin,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }

    @classmethod
    def from_dict(cls, data: dict) -> "User":
        user = cls(
            id=data.get("id", str(uuid.uuid4())),
            email=data.get("email", ""),
            password_hash=data.get("password_hash", ""),
            full_name=data.get("full_name", ""),
            is_active=data.get("is_active", True),
            is_admin=data.get("is_admin", False),
        )
        if "created_at" in data:
            user.created_at = datetime.fromisoformat(data["created_at"])
        if "updated_at" in data:
            user.updated_at = datetime.fromisoformat(data["updated_at"])
        return user