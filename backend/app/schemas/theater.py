from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class ScreenBase(BaseModel):
    name: str
    rows: int = Field(..., ge=1, le=50)
    seats_per_row: int = Field(..., ge=1, le=50)
    aisle_after_row: int = Field(default=0, ge=0)
    wheelchair_positions: List[str] = []


class ScreenCreate(ScreenBase):
    theater_id: str


class ScreenUpdate(BaseModel):
    name: Optional[str] = None
    rows: Optional[int] = Field(default=None, ge=1, le=50)
    seats_per_row: Optional[int] = Field(default=None, ge=1, le=50)
    aisle_after_row: Optional[int] = Field(default=None, ge=0)
    wheelchair_positions: Optional[List[str]] = None


class ScreenResponse(ScreenBase):
    id: str
    theater_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TheaterBase(BaseModel):
    name: str
    address: str
    city: str
    phone: str = ""
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    external_place_id: Optional[str] = None
    is_demo: bool = False
    facilities: List[str] = []


class TheaterCreate(TheaterBase):
    pass


class TheaterUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    phone: Optional[str] = None
    facilities: Optional[List[str]] = None


class TheaterResponse(TheaterBase):
    id: str
    screens: List[ScreenResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TheaterListResponse(BaseModel):
    theaters: List[TheaterResponse]
    total: int
