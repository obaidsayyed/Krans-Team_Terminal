from supabase import Client, create_client

from app.core.config import settings


print("URL:", settings.SUPABASE_URL)

print(
    "KEY TYPE:",
    settings.SUPABASE_SECRET_KEY[:10],
)

supabase: Client = create_client(
    settings.SUPABASE_URL.strip(),
    settings.SUPABASE_SECRET_KEY.strip(),
)