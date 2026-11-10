import os
from typing import Optional
from app.repositories.base import JSONFileRepository
from app.models.user import User
from app.config import settings


class UserRepository(JSONFileRepository[User]):
    def __init__(self):
        super().__init__(
            file_path=os.path.join(settings.DATA_DIR, "users.json"),
            model_class=User,
            id_field="id",
        )

    def get_by_email(self, email: str) -> Optional[User]:
        return self.get_one_by_field("email", email.lower())

    def email_exists(self, email: str) -> bool:
        return self.get_by_email(email) is not None


import os
