"""Security utilities: password hashing, JWT, refresh tokens."""
import secrets
from datetime import datetime, timedelta, timezone

import bcrypt
from jose import JWTError, jwt
from fastapi import HTTPException, status

from app.core.config import settings

# ---------------------------------------------------------------------------
# Password hashing — bcrypt (direct usage, compatible with Python 3.14)
# ---------------------------------------------------------------------------
BCRYPT_ROUNDS = 12


def hash_password(plain: str) -> str:
    """Hash password using bcrypt with 12 rounds."""
    pwd_bytes = plain.encode('utf-8')
    salt = bcrypt.gensalt(rounds=BCRYPT_ROUNDS)
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode('utf-8')


def verify_password(plain: str, hashed: str) -> bool:
    """Verify password against bcrypt hash."""
    pwd_bytes = plain.encode('utf-8')
    hash_bytes = hashed.encode('utf-8')
    return bcrypt.checkpw(pwd_bytes, hash_bytes)


# ---------------------------------------------------------------------------
# JWT access tokens
# ---------------------------------------------------------------------------
_ALGORITHM = settings.JWT_ALGORITHM
_ACCESS_EXPIRE = settings.ACCESS_TOKEN_EXPIRE_MINUTES


def create_access_token(user_id: str) -> str:
    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=_ACCESS_EXPIRE)
    payload = {
        "sub": user_id,
        "iat": now,
        "exp": expire,
        "type": "access",
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=_ALGORITHM)


def decode_access_token(token: str) -> dict:
    """Decode and validate an access token.

    Raises HTTPException(401) on any failure.
    """
    credentials_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[_ALGORITHM])
        if payload.get("type") != "access":
            raise credentials_exc
        sub: str | None = payload.get("sub")
        if sub is None:
            raise credentials_exc
        return payload
    except JWTError:
        raise credentials_exc


# ---------------------------------------------------------------------------
# Refresh tokens — random, stored as bcrypt hash
# ---------------------------------------------------------------------------
def generate_refresh_token() -> str:
    """Return a cryptographically secure random 32-byte URL-safe token."""
    return secrets.token_urlsafe(32)


def hash_refresh_token(token: str) -> str:
    """Hash a raw refresh token for DB storage."""
    token_bytes = token.encode('utf-8')
    salt = bcrypt.gensalt(rounds=BCRYPT_ROUNDS)
    hashed = bcrypt.hashpw(token_bytes, salt)
    return hashed.decode('utf-8')


def verify_refresh_token(raw: str, hashed: str) -> bool:
    """Verify a raw refresh token against its hash."""
    raw_bytes = raw.encode('utf-8')
    hash_bytes = hashed.encode('utf-8')
    return bcrypt.checkpw(raw_bytes, hash_bytes)
