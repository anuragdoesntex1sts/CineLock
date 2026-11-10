from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class MovieBase(BaseModel):
    tmdb_id: int
    title: str
    overview: str = ""
    poster_path: str = ""
    backdrop_path: str = ""
    release_date: str = ""
    runtime: int = 0
    genres: List[str] = []
    vote_average: float = 0.0
    vote_count: int = 0
    popularity: float = 0.0
    original_language: str = "en"
    adult: bool = False


class MovieCreate(MovieBase):
    pass


class MovieUpdate(BaseModel):
    title: Optional[str] = None
    overview: Optional[str] = None
    poster_path: Optional[str] = None
    backdrop_path: Optional[str] = None
    release_date: Optional[str] = None
    runtime: Optional[int] = None
    genres: Optional[List[str]] = None
    vote_average: Optional[float] = None
    vote_count: Optional[int] = None
    popularity: Optional[float] = None
    original_language: Optional[str] = None
    adult: Optional[bool] = None


class MovieResponse(MovieBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class MovieListResponse(BaseModel):
    movies: List[MovieResponse]
    total: int
    page: int
    page_size: int
    total_pages: int