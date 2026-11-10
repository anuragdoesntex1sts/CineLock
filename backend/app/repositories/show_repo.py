import os
from typing import List, Optional
from datetime import datetime
from app.repositories.base import JSONFileRepository
from app.models.show import Show
from app.config import settings


class ShowRepository(JSONFileRepository[Show]):
    def __init__(self):
        super().__init__(
            file_path=os.path.join(settings.DATA_DIR, "shows.json"),
            model_class=Show,
            id_field="id",
        )

    def get_by_movie(self, movie_id: str) -> List[Show]:
        return self.get_by_field("movie_id", movie_id)

    def get_by_theater(self, theater_id: str) -> List[Show]:
        return self.get_by_field("theater_id", theater_id)

    def get_by_screen(self, screen_id: str) -> List[Show]:
        return self.get_by_field("screen_id", screen_id)

    def get_by_movie_and_date(self, movie_id: str, date_str: str) -> List[Show]:
        """Get shows for a movie on a specific date (YYYY-MM-DD)."""
        shows = self.get_by_movie(movie_id)
        target_date = date_str[:10]  # YYYY-MM-DD
        return [s for s in shows if s.start_time[:10] == target_date and s.is_active]

    def get_by_theater_and_date(self, theater_id: str, date_str: str) -> List[Show]:
        """Get shows for a theater on a specific date."""
        shows = self.get_by_theater(theater_id)
        target_date = date_str[:10]
        return [s for s in shows if s.start_time[:10] == target_date and s.is_active]

    def get_upcoming(self, movie_id: str = "", theater_id: str = "", limit: int = 50) -> List[Show]:
        """Get upcoming shows, optionally filtered by movie/theater."""
        all_shows = self.get_all()
        now = datetime.now().isoformat()

        filtered = [s for s in all_shows if s.is_active and s.start_time >= now]

        if movie_id:
            filtered = [s for s in filtered if s.movie_id == movie_id]
        if theater_id:
            filtered = [s for s in filtered if s.theater_id == theater_id]

        filtered.sort(key=lambda s: s.start_time)
        return filtered[:limit]

    def get_dates_with_shows(self, movie_id: str = "", theater_id: str = "") -> List[str]:
        """Get list of dates (YYYY-MM-DD) that have shows."""
        shows = self.get_upcoming(movie_id, theater_id, limit=1000)
        dates = set(s.start_time[:10] for s in shows)
        return sorted(dates)
