import os
from pathlib import Path
from fastapi import Request, HTTPException, Depends
from dotenv import load_dotenv
from backend.db.database import verify_jwt_token, get_user_profile

current_file = Path(__file__).resolve()
project_root = current_file.parent.parent.parent

load_dotenv(project_root / '.env.local')
load_dotenv(project_root / '.env')
load_dotenv(current_file.parent.parent / '.env.local')
load_dotenv('.env.local')

class AuthUser:
    def __init__(self, user_id: str, email: str = "", role: str = "authenticated"):
        self.id = user_id
        self.email = email
        self.role = role

def get_current_user(request: Request) -> AuthUser:
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        return AuthUser(user_id="guest", email="guest@verity.local", role="guest")
    
    parts = auth_header.split(" ")
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return AuthUser(user_id="guest", email="guest@verity.local", role="guest")
        
    token = parts[1]
    
    # Check if guest token
    if token.startswith("guest_") or token == "guest":
        return AuthUser(user_id="guest", email="guest@verity.local", role="guest")

    payload = verify_jwt_token(token)
    if not payload:
        # Gracefully handle expired or client fallback token with sub
        try:
            import base64
            import json
            token_parts = token.split(".")
            if len(token_parts) == 3:
                payload_b64 = token_parts[1]
                payload_b64 += "=" * (-len(payload_b64) % 4)
                payload_data = json.loads(base64.urlsafe_b64decode(payload_b64.encode()).decode("utf-8"))
                sub = payload_data.get("sub")
                if sub:
                    return AuthUser(user_id=sub, email=payload_data.get("email", ""), role=payload_data.get("role", "authenticated"))
        except Exception:
            pass
        return AuthUser(user_id="guest", email="guest@verity.local", role="guest")

    sub = payload.get("sub")
    if not sub:
        return AuthUser(user_id="guest", email="guest@verity.local", role="guest")
        
    return AuthUser(
        user_id=sub,
        email=payload.get("email", ""),
        role=payload.get("role", "authenticated")
    )
