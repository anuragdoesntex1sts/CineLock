from datetime import timedelta
from typing import Optional
from app.repositories.user_repo import UserRepository
from app.models.user import User
from app.utils import hash_password, verify_password, create_access_token, create_refresh_token, verify_refresh_token
from app.schemas.auth import UserRegister, UserLogin, AuthResponse, UserResponse, Token


class AuthService:
    def __init__(self):
        self.user_repo = UserRepository()

    def register(self, user_data: UserRegister) -> AuthResponse:
        if self.user_repo.email_exists(user_data.email):
            raise ValueError("Email already registered")

        # Truncate password to 72 bytes for bcrypt limit
        pwd_bytes = user_data.password.encode('utf-8')[:72]
        user = User(
            email=user_data.email.lower(),
            password_hash=hash_password(pwd_bytes.decode('utf-8', errors='ignore')),
            full_name=user_data.full_name,
        )
        self.user_repo.create(user)

        access_token = create_access_token({"sub": user.id, "email": user.email})
        refresh_token = create_refresh_token({"sub": user.id, "email": user.email})

        return AuthResponse(
            user=UserResponse(
                id=user.id,
                email=user.email,
                full_name=user.full_name,
                is_active=user.is_active,
                is_admin=user.is_admin,
                created_at=user.created_at,
            ),
            tokens=Token(
                access_token=access_token,
                refresh_token=refresh_token,
                expires_in=30 * 60,  # 30 minutes
            ),
        )

    def login(self, credentials: UserLogin) -> AuthResponse:
        user = self.user_repo.get_by_email(credentials.email)
        if not user or not verify_password(credentials.password, user.password_hash):
            raise ValueError("Invalid email or password")

        if not user.is_active:
            raise ValueError("Account is deactivated")

        access_token = create_access_token({"sub": user.id, "email": user.email})
        refresh_token = create_refresh_token({"sub": user.id, "email": user.email})

        return AuthResponse(
            user=UserResponse(
                id=user.id,
                email=user.email,
                full_name=user.full_name,
                is_active=user.is_active,
                is_admin=user.is_admin,
                created_at=user.created_at,
            ),
            tokens=Token(
                access_token=access_token,
                refresh_token=refresh_token,
                expires_in=30 * 60,
            ),
        )

    def refresh_token(self, refresh_token: str) -> Token:
        user_id = verify_refresh_token(refresh_token)
        if not user_id:
            raise ValueError("Invalid or expired refresh token")

        user = self.user_repo.get_by_id(user_id)
        if not user or not user.is_active:
            raise ValueError("User not found or inactive")

        access_token = create_access_token({"sub": user.id, "email": user.email})
        new_refresh_token = create_refresh_token({"sub": user.id, "email": user.email})

        return Token(
            access_token=access_token,
            refresh_token=new_refresh_token,
            expires_in=30 * 60,
        )

    def get_user_by_id(self, user_id: str) -> Optional[User]:
        return self.user_repo.get_by_id(user_id)

    def get_user_by_email(self, email: str) -> Optional[User]:
        return self.user_repo.get_by_email(email)