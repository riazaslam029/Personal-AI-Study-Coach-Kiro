"""Authentication service: register, login, token management."""
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import (
    hash_password,
    verify_password,
    generate_refresh_token,
    hash_refresh_token,
    verify_refresh_token,
)
from app.core.config import settings
from app.models.user import User
from app.models.refresh_token import RefreshToken


async def register_user(
    db: AsyncSession,
    email: str,
    password: str,
    full_name: str | None = None,
) -> User:
    """Create a new user. Raises 409 if email already exists."""
    # Check uniqueness
    result = await db.execute(select(User).where(User.email == email.lower()))
    if result.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    user = User(
        email=email.lower(),
        password_hash=hash_password(password),
        full_name=full_name,
    )
    db.add(user)
    # commit() flushes the INSERT with a RETURNING clause, so `user.id` and
    # any server_default fields (timestamps, uuid) are populated automatically.
    # An explicit db.refresh(user) here would be a second round-trip to Neon
    # for data we already have.
    await db.commit()
    return user


async def authenticate_user(
    db: AsyncSession,
    email: str,
    password: str,
) -> User:
    """Validate credentials. Raises 401 on failure."""
    result = await db.execute(select(User).where(User.email == email.lower()))
    user = result.scalar_one_or_none()
    if user is None or not verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
        )
    return user


async def create_refresh_token_record(
    db: AsyncSession,
    user_id: str,
) -> str:
    """Generate a refresh token, persist its hash, and return the raw token."""
    raw_token = generate_refresh_token()
    expires_at = datetime.now(timezone.utc) + timedelta(
        days=settings.REFRESH_TOKEN_EXPIRE_DAYS
    )
    record = RefreshToken(
        user_id=user_id,
        token_hash=hash_refresh_token(raw_token),
        expires_at=expires_at,
    )
    db.add(record)
    await db.commit()
    return raw_token


async def rotate_refresh_token(
    db: AsyncSession,
    raw_token: str,
) -> tuple[User, str]:
    """Validate a refresh token, rotate it, return (user, new_raw_token).

    O(1) direct lookup by SHA-256 hash of the token — no linear scan.
    Raises 401 if token not found or expired.
    """
    now = datetime.now(timezone.utc)
    token_hash = hash_refresh_token(raw_token)

    result = await db.execute(
        select(RefreshToken).where(RefreshToken.token_hash == token_hash)
    )
    matched = result.scalar_one_or_none()

    if matched is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token.",
        )

    if matched.expires_at.replace(tzinfo=timezone.utc) < now:
        await db.delete(matched)
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has expired. Please log in again.",
        )

    user_result = await db.execute(select(User).where(User.id == matched.user_id))
    user = user_result.scalar_one_or_none()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found."
        )

    # Rotate: delete old, insert new — one round-trip via delete().execute().
    await db.delete(matched)

    new_raw_token = generate_refresh_token()
    expires_at = now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    new_record = RefreshToken(
        user_id=str(user.id),
        token_hash=hash_refresh_token(new_raw_token),
        expires_at=expires_at,
    )
    db.add(new_record)
    await db.commit()
    return user, new_raw_token


async def revoke_refresh_token(db: AsyncSession, raw_token: str) -> None:
    """Revoke a refresh token (logout). O(1) direct lookup by hash."""
    token_hash = hash_refresh_token(raw_token)
    await db.execute(
        delete(RefreshToken).where(RefreshToken.token_hash == token_hash)
    )
    await db.commit()
