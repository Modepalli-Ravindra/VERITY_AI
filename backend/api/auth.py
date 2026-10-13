import os
from pathlib import Path
from fastapi import Request, HTTPException, Depends
from supabase import create_client, Client
from dotenv import load_dotenv

# Robustly find project root and load .env.local and .env
current_file = Path(__file__).resolve()
project_root = current_file.parent.parent.parent

load_dotenv(project_root / '.env.local')
load_dotenv(project_root / '.env')
load_dotenv(current_file.parent.parent / '.env.local')
load_dotenv('.env.local')

SUPABASE_URL = (
    os.getenv("NEXT_PUBLIC_INSFORGE_URL")
    or os.getenv("VITE_INSFORGE_URL")
    or os.getenv("INSFORGE_URL")
    or "https://xga5neu3.us-east.insforge.app"
)
SUPABASE_KEY = (
    os.getenv("NEXT_PUBLIC_INSFORGE_ANON_KEY")
    or os.getenv("VITE_INSFORGE_ANON_KEY")
    or os.getenv("INSFORGE_ANON_KEY")
    or "anon_61d4fcb074bcc5e3a7b319420ea44caa0cd2edfec2c36a0b06c462862d6bc49c"
)

if SUPABASE_URL and SUPABASE_KEY:
    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception:
        supabase = None
else:
    supabase = None

def get_current_user(request: Request):
    if not supabase:
        raise HTTPException(status_code=500, detail="Insforge backend credentials missing")

    auth_header = request.headers.get("Authorization")
    if not auth_header:
        class GuestUser:
            def __init__(self, id="guest-workspace-user"):
                self.id = id
        return GuestUser()
    
    parts = auth_header.split(" ")
    if len(parts) != 2 or parts[0].lower() != "bearer":
        class GuestUser:
            def __init__(self, id="guest-workspace-user"):
                self.id = id
        return GuestUser()
        
    token = parts[1]
    
    try:
        import base64
        import json
        import time
        
        # Verify it's a 3-part JWT
        token_parts = token.split('.')
        if len(token_parts) != 3:
            raise HTTPException(status_code=401, detail="Invalid Authorization header format: Invalid JWT structure")
            
        # Decode payload
        payload_b64 = token_parts[1]
        # Add padding if needed
        payload_b64 += '=' * (-len(payload_b64) % 4)
        try:
            payload_json = base64.b64decode(payload_b64).decode('utf-8')
            payload = json.loads(payload_json)
        except Exception:
            raise HTTPException(status_code=401, detail="Authentication failed: Malformed token payload")
        
        # Basic validation: sub must be a non-empty string
        sub = payload.get("sub")
        if not sub or not isinstance(sub, str) or not sub.strip():
            raise HTTPException(status_code=401, detail="Authentication failed: Missing or invalid token subject")
            
        # Expiration check if exp claim is present
        if "exp" in payload:
            exp_val = payload["exp"]
            if isinstance(exp_val, (int, float)):
                # Allow 60 seconds clock skew tolerance
                if time.time() > exp_val + 60:
                    raise HTTPException(status_code=401, detail="Authentication failed: Token has expired")
            
        class FakeUser:
            def __init__(self, id):
                self.id = id
                
        return FakeUser(payload["sub"])
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Authentication failed: Invalid or malformed token")
