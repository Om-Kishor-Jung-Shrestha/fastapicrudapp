import json
from typing import Any, Optional

import redis

from app.core.config import settings

redis_client = redis.Redis(
    host=settings.REDIS_HOST,
    port=settings.REDIS_PORT,
    db=settings.REDIS_DB,
    decode_responses=True,
)


class CacheService:
    """Thin wrapper around redis for JSON get/set and pattern invalidation."""

    def __init__(self, client: redis.Redis, default_ttl: int):
        self.client = client
        self.default_ttl = default_ttl

    def get(self, key: str) -> Optional[Any]:
        try:
            value = self.client.get(key)
            return json.loads(value) if value else None
        except redis.RedisError:
            return None

    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        try:
            self.client.set(key, json.dumps(value, default=str), ex=ttl or self.default_ttl)
        except redis.RedisError:
            pass

    def delete(self, key: str) -> None:
        try:
            self.client.delete(key)
        except redis.RedisError:
            pass

    def delete_pattern(self, pattern: str) -> None:
        try:
            keys = list(self.client.scan_iter(match=pattern))
            if keys:
                self.client.delete(*keys)
        except redis.RedisError:
            pass


cache_service = CacheService(redis_client, settings.CACHE_TTL_SECONDS)
