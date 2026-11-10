from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Optional
import uuid


@dataclass
class Show:
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    movie_id: str = ""
    theater_id: str = ""
    screen_id: str = ""
    start_time: str = ""  # ISO format datetime
    end_time: str = ""    # ISO format datetime
    price: float = 0.0
    language: str = "English"
    format: str = "2D"  # 2D, 3D, IMAX, 4DX
    is_active: bool = True
    is_demo: bool = False
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "movie_id": self.movie_id,
            "theater_id": self.theater_id,
            "screen_id": self.screen_id,
            "start_time": self.start_time,
            "end_time": self.end_time,
            "price": self.price,
            "language": self.language,
            "format": self.format,
            "is_active": self.is_active,
            "is_demo": self.is_demo,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }

    @classmethod
    def from_dict(cls, data: dict) -> "Show":
        show = cls(
            id=data.get("id", str(uuid.uuid4())),
            movie_id=data.get("movie_id", ""),
            theater_id=data.get("theater_id", ""),
            screen_id=data.get("screen_id", ""),
            start_time=data.get("start_time", ""),
            end_time=data.get("end_time", ""),
            price=data.get("price", 0.0),
            language=data.get("language", "English"),
            format=data.get("format", "2D"),
            is_active=data.get("is_active", True),
            is_demo=data.get("is_demo", False),
        )
        if "created_at" in data:
            show.created_at = datetime.fromisoformat(data["created_at"])
        if "updated_at" in data:
            show.updated_at = datetime.fromisoformat(data["updated_at"])
        return show
