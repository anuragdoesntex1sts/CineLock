from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Optional
import uuid


@dataclass
class Screen:
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    theater_id: str = ""
    name: str = ""
    rows: int = 10
    seats_per_row: int = 15
    aisle_after_row: int = 0  # 0 = no aisle
    wheelchair_positions: List[str] = field(default_factory=list)  # e.g., ["A1", "A2"]
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "theater_id": self.theater_id,
            "name": self.name,
            "rows": self.rows,
            "seats_per_row": self.seats_per_row,
            "aisle_after_row": self.aisle_after_row,
            "wheelchair_positions": self.wheelchair_positions,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }

    @classmethod
    def from_dict(cls, data: dict) -> "Screen":
        screen = cls(
            id=data.get("id", str(uuid.uuid4())),
            theater_id=data.get("theater_id", ""),
            name=data.get("name", ""),
            rows=data.get("rows", 10),
            seats_per_row=data.get("seats_per_row", 15),
            aisle_after_row=data.get("aisle_after_row", 0),
            wheelchair_positions=data.get("wheelchair_positions", []),
        )
        if "created_at" in data:
            screen.created_at = datetime.fromisoformat(data["created_at"])
        if "updated_at" in data:
            screen.updated_at = datetime.fromisoformat(data["updated_at"])
        return screen


@dataclass
class Theater:
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    name: str = ""
    address: str = ""
    city: str = ""
    phone: str = ""
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    external_place_id: Optional[str] = None
    is_demo: bool = False
    facilities: List[str] = field(default_factory=list)  # e.g., ["Parking", "Food Court", "Dolby Atmos"]
    screens: List[Screen] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "address": self.address,
            "city": self.city,
            "phone": self.phone,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "external_place_id": self.external_place_id,
            "is_demo": self.is_demo,
            "facilities": self.facilities,
            "screens": [s.to_dict() for s in self.screens],
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }

    @classmethod
    def from_dict(cls, data: dict) -> "Theater":
        theater = cls(
            id=data.get("id", str(uuid.uuid4())),
            name=data.get("name", ""),
            address=data.get("address", ""),
            city=data.get("city", ""),
            phone=data.get("phone", ""),
            latitude=data.get("latitude"),
            longitude=data.get("longitude"),
            external_place_id=data.get("external_place_id"),
            is_demo=data.get("is_demo", False),
            facilities=data.get("facilities", []),
        )
        theater.screens = [Screen.from_dict(s) for s in data.get("screens", [])]
        if "created_at" in data:
            theater.created_at = datetime.fromisoformat(data["created_at"])
        if "updated_at" in data:
            theater.updated_at = datetime.fromisoformat(data["updated_at"])
        return theater
