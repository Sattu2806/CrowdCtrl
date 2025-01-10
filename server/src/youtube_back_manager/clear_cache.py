from django.core.cache import cache

def flush_redis_cache():
    """
    Flush all keys in Redis using the Django cache framework.
    """
    try:
        cache.clear()  # Clears all keys in the current cache
        print("Redis cache cleared successfully.")
    except Exception as e:
        print(f"Error clearing Redis cache: {e}")

flush_redis_cache()
