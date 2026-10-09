import time
import threading
from typing import Any, Optional, Dict, Tuple

class SimpleMemoryCache:
    """
    Lightweight, thread-safe, in-memory TTL cache for public endpoints.
    Protects Supabase PostgreSQL connection pools from exhaustion
    under high concurrent public visitor traffic.
    Strictly isolated: NEVER used for admin, private, or authentication data.
    """
    def __init__(self, max_size: int = 500):
        self._cache: Dict[str, Tuple[Any, float]] = {}
        self._lock = threading.Lock()
        self._max_size = max_size

    def get(self, key: str) -> Optional[Any]:
        with self._lock:
            entry = self._cache.get(key)
            if not entry:
                return None
            value, expires_at = entry
            if time.time() > expires_at:
                # Expired
                self._cache.pop(key, None)
                return None
            return value

    def set(self, key: str, value: Any, ttl_seconds: int = 15):
        with self._lock:
            # Simple eviction if cache exceeds max_size
            if len(self._cache) >= self._max_size:
                now = time.time()
                # Clean up all expired entries
                expired_keys = [k for k, (_, exp) in self._cache.items() if now > exp]
                for k in expired_keys:
                    self._cache.pop(k, None)
                # If still full, pop first 50 keys
                if len(self._cache) >= self._max_size:
                    for k in list(self._cache.keys())[:50]:
                        self._cache.pop(k, None)

            expires_at = time.time() + ttl_seconds
            self._cache[key] = (value, expires_at)

    def invalidate(self, prefix: Optional[str] = None):
        with self._lock:
            if prefix is None:
                self._cache.clear()
            else:
                keys_to_delete = [k for k in self._cache.keys() if k.startswith(prefix)]
                for k in keys_to_delete:
                    self._cache.pop(k, None)

    def size(self) -> int:
        with self._lock:
            return len(self._cache)

# Global singleton instance for public read endpoints
public_cache = SimpleMemoryCache()
