import httpx
import json

def check_servers():
    print("Checking VERITY Backend Server (http://127.0.0.1:8000)...")
    try:
        r1 = httpx.get("http://127.0.0.1:8000/api/health", timeout=5.0)
        print("  Backend Health Status:", r1.status_code, r1.json())
        
        r2 = httpx.get("http://127.0.0.1:8000/api/transformer-status", timeout=10.0)
        print("  Transformer Status:", r2.status_code, r2.json())
    except Exception as e:
        print("  Backend Error:", e)

    print("\nChecking VERITY Frontend Server (http://localhost:5173)...")
    try:
        r3 = httpx.get("http://localhost:5173", timeout=5.0)
        print("  Frontend Dev Server Status:", r3.status_code, "OK")
    except Exception as e:
        print("  Frontend Error:", e)

if __name__ == "__main__":
    check_servers()
