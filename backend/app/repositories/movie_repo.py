import os
from typing import List, Optional
from app.repositories.base import JSONFileRepository
from app.models.movie import Movie
from app.config import settings


class MovieRepository(JSONFileRepository[Movie]):
    def __init__(self):
        super().__init__(
            file_path=os.path.join(settings.DATA_DIR, "movies.json"),
            model_class=Movie,
            id_field="id",
        )

    def search(self, query: str = "", genre: str = "", page: int = 1, page_size: int = 20) -> tuple[List[Movie], int]:
        all_movies = self.get_all()

        # Filter
        if query:
            q = query.lower()
            all_movies = [m for m in all_movies if q in m.title.lower() or q in m.overview.lower()]
        if genre:
            all_movies = [m for m in all_movies if genre in m.genres]

        total = len(all_movies)

        # Paginate
        start = (page - 1) * page_size
        end = start + page_size
        return all_movies[start:end], total

    def get_by_tmdb_id(self, tmdb_id: int) -> Optional[Movie]:
        return self.get_one_by_field("tmdb_id", tmdb_id)

    def get_popular(self, limit: int = 10) -> List[Movie]:
        all_movies = self.get_all()
        return sorted(all_movies, key=lambda m: m.popularity, reverse=True)[:limit]