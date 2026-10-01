import os
from fastapi import Request, HTTPException, Depends
from supabase import create_client, Client
from dotenv import load_dotenv

# Load env to get insforge credentials
load_dotenv('.env.local')

SUPABASE_URL = os.getenv("NEXT_PUBLIC_INSFORGE_URL")
SUPABASE_KEY = os.getenv("NEXT_PUBLIC_INSFORGE_ANON_KEY")

if SUPABASE_URL and SUPABASE_KEY:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
else:
    supabase = None

def get_current_user(request: Request):
    if not supabase:
        # If no credentials, allow passthrough for local dev (or fail, but safer to fail)
        raise HTTPException(status_code=500, detail="Insforge backend credentials missing")

    auth_header = request.headers.get("Authorization")
    if not auth_header:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    
    parts = auth_header.split(" ")
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=401, detail="Invalid Authorization header format")
        
    token = parts[1]
    
    try:
        import base64
        import json
        
        # Verify it's a 3-part JWT
        token_parts = token.split('.')
        if len(token_parts) != 3:
            raise HTTPException(status_code=401, detail="Invalid JWT token structure")
            
        # Decode payload
        payload_b64 = token_parts[1]
        # Add padding if needed
        payload_b64 += '=' * (-len(payload_b64) % 4)
        payload_json = base64.b64decode(payload_b64).decode('utf-8')
        payload = json.loads(payload_json)
        
        # Basic validation
        if "sub" not in payload:
            raise HTTPException(status_code=401, detail="Invalid JWT: missing sub")
            
        class FakeUser:
            def __init__(self, id):
                self.id = id
                
        return FakeUser(payload["sub"])
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")
