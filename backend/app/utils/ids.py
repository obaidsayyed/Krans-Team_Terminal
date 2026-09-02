from datetime import datetime, timezone
import secrets


def generate_tracking_id() -> str:
    now = datetime.now(timezone.utc)

    date_part = now.strftime("%Y%m%d")

    random_part = secrets.token_hex(3).upper()

    return f"GRV-{date_part}-{random_part}"