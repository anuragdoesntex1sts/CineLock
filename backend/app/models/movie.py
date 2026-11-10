from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Optional
import uuid


@dataclass
class Movie:
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    tmdb_id: int = 0
    title: str = ""
    overview: str = ""
    poster_path: str = ""
    backdrop_path: str = ""
    release_date: str = ""
    runtime: int = 0
    genres: List[str] = field(default_factory=list)
    vote_average: float = 0.0
    vote_count: int = 0
    popularity: float = 0.0
    original_language: str = "en"
    adult: bool = False
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "tmdb_id": self.tmdb_id,
            "title": self.title,
            "overview": self.overview,
            "poster_path": self.poster_path,
            "backdrop_path": self.backdrop_path,
            "release_date": self.release_date,
            "runtime": self.runtime,
            "genres": self.genres,
            "vote_average": self.vote_average,
            "vote_count": self.vote_count,
            "popularity": self.popularity,
            "original_language": self.original_language,
            "adult": self.adult,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }

    @classmethod
    def from_dict(cls, data: dict) -> "Movie":
        movie = cls(
            id=data.get("id", str(uuid.uuid4())),
            tmdb_id=data.get("tmdb_id", 0),
            title=data.get("title", ""),
            overview=data.get("overview", ""),
            poster_path=data.get("poster_path", ""),
            backdrop_path=data.get("backdrop_path", ""),
            release_date=data.get("release_date", ""),
            runtime=data.get("runtime", 0),
            genres=data.get("genres", []),
            vote_average=data.get("vote_average", 0.0),
            vote_count=data.get("vote_count", 0),
            popularity=data.get("popularity", 0.0),
            original_language=data.get("original_language", "en"),
            adult=data.get("adult", False),
        )
        if "created_at" in data:
            movie.created_at = datetime.fromisoformat(data["created_at"])
        if "updated_at" in data:
            movie.updated_at = datetime.fromisoformat(data["updated_at"])
        return movie