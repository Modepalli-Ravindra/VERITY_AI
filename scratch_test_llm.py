import asyncio
import os
import sys
from pathlib import Path
from dotenv import load_dotenv
import httpx

root_dir = Path(__file__).resolve().parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

load_dotenv()

async def try_model(provider, url, headers, json_data):
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, headers=headers, json=json_data)
            if resp.status_code == 200:
                print(f"{provider} {json_data.get('model', '')}: SUCCESS - {resp.json()}")
            else:
                print(f"{provider} {json_data.get('model', '')}: {resp.status_code} - {resp.text}")
    except Exception as e:
        print(f"{provider} Failed: {str(e)}")

async def try_google(model):
    api_key = os.getenv("GOOGLE_API_KEY")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    json_data = {"contents": [{"parts": [{"text": "Hello"}]}]}
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, json=json_data)
            if resp.status_code == 200:
                print(f"Google {model}: SUCCESS - {resp.json()}")
            else:
                print(f"Google {model}: {resp.status_code} - {resp.text}")
    except Exception as e:
        print(f"Google Failed: {str(e)}")


async def main():
    await asyncio.gather(
        try_google("gemini-3.8-flash"),
        try_model("Nvidia", "https://integrate.api.nvidia.com/v1/chat/completions", {"Authorization": f"Bearer {os.getenv('NVIDIA_API_KEY')}"}, {"model": "meta/llama-3.2-90b-vision-instruct", "messages": [{"role": "user", "content": "Hello"}]}),
        try_model("Nvidia", "https://integrate.api.nvidia.com/v1/chat/completions", {"Authorization": f"Bearer {os.getenv('NVIDIA_API_KEY')}"}, {"model": "meta/llama2-70b", "messages": [{"role": "user", "content": "Hello"}]})
    )

if __name__ == '__main__':
    asyncio.run(main())
