import hashlib
import string

from app.config import settings

ALPHABET = string.ascii_letters + string.digits


def generate_slug(url: str, user_id: int = 0, length: int | None = None) -> str:
    """Genera un slug determinista a partir de la URL y user_id usando SHA-256."""
    length = length or settings.slug_length
    digest = hashlib.sha256(f"{url}{user_id}".encode()).digest()

    num = int.from_bytes(digest[:8], "big")
    slug = []
    while len(slug) < length:
        slug.append(ALPHABET[num % 62])
        num //= 62

    return "".join(slug)


def generate_unique_slug(url: str, user_id: int = 0, attempt: int = 0) -> str:
    """Si hay colisión, agrega un sufijo basado en el intento."""
    if attempt == 0:
        return generate_slug(url, user_id)
    return generate_slug(f"{url}:{attempt}", user_id)
