from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class ShowBase(BaseModel):
    movie_id: str
    theater_id: str
    screen_id: str
    start_time: str  # ISO format
    end_time: str    # ISO format
    price: float = Field(..., ge=0)
    language: str = "English"
    format: str = "2D"
    is_active: bool = True
    is_demo: bool = False


class ShowCreate(ShowBase):
    pass


class ShowUpdate(BaseModel):
    movie_id: Optional[str] = None
    theater_id: Optional[str] = None
    screen_id: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    price: Optional[float] = Field(default=None, ge=0)
    language: Optional[str] = None
    format: Optional[str] = None
    is_active: Optional[bool] = None


class ShowResponse(ShowBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ShowWithDetails(ShowResponse):
    movie_title: str = ""
    movie_poster: str = ""
    theater_name: str = ""
    screen_name: str = ""
    available_seats: int = 0
    total_seats: int = 0


class ShowListResponse(BaseModel):
    shows: List[ShowWithDetails]
    total: int
