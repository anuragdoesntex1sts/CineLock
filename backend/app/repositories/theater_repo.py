import os
from typing import List, Optional
from app.repositories.base import JSONFileRepository
from app.models.theater import Theater, Screen
from app.config import settings


class TheaterRepository(JSONFileRepository[Theater]):
    def __init__(self):
        super().__init__(
            file_path=os.path.join(settings.DATA_DIR, "theaters.json"),
            model_class=Theater,
            id_field="id",
        )

    def get_by_city(self, city: str) -> List[Theater]:
        return self.get_by_field("city", city)

    def get_with_screens(self, theater_id: str) -> Optional[Theater]:
        return self.get_by_id(theater_id)

    def get_all_cities(self) -> List[str]:
        theaters = self.get_all()
        return sorted(list(set(t.city for t in theaters)))


class ScreenRepository(JSONFileRepository[Screen]):
    def __init__(self):
        # Screens are embedded in theaters.json, so we read from there
        super().__init__(
            file_path=os.path.join(settings.DATA_DIR, "theaters.json"),
            model_class=Screen,
            id_field="id",
        )

    def get_all(self) -> List[Screen]:
        # Override to extract screens from theaters
        with self._lock:
            data = self._read_data()
            screens = []
            for theater_data in data:
                for screen_data in theater_data.get("screens", []):
                    screens.append(Screen.from_dict(screen_data))
            return screens

    def get_by_id(self, id_value: str) -> Optional[Screen]:
        screens = self.get_all()
        for screen in screens:
            if screen.id == id_value:
                return screen
        return None

    def get_by_theater(self, theater_id: str) -> List[Screen]:
        theater_repo = TheaterRepository()
        theater = theater_repo.get_by_id(theater_id)
        if theater:
            return theater.screens
        return []

    def get_by_theater_and_id(self, theater_id: str, screen_id: str) -> Optional[Screen]:
        screens = self.get_by_theater(theater_id)
        for screen in screens:
            if screen.id == screen_id:
                return screen
        return None