import requests

def test_piped():
    instances = [
        "https://pipedapi.kavin.rocks",
        "https://pipedapi.tokhmi.xyz",
        "https://pipedapi.smnz.de",
        "https://api.piped.projectsegfau.lt",
        "https://pipedapi.lunar.icu",
        "https://pipedapi.r4fo.com"
    ]
    video_id = "Y4baVj4ohac"
    for instance in instances:
        try:
            api_url = f"{instance}/streams/{video_id}"
            res = requests.get(api_url, timeout=5)
            if res.status_code == 200:
                data = res.json()
                if "audioStreams" in data and len(data["audioStreams"]) > 0:
                    print(f"✅ Success Piped: {instance}")
                else:
                    print(f"❌ Failed Piped (No audio): {instance}")
            else:
                print(f"❌ Failed Piped (Status {res.status_code}): {instance}")
        except Exception as e:
            print(f"❌ Failed Piped (Error): {instance} - {type(e).__name__}")

def test_cobalt():
    instances = [
        "https://api.cobalt.tools/api/json",
        "https://co.wuk.sh/api/json",
        "https://cobalt.qwy2.dev/api/json",
        "https://cobalt.knot.app/api/json",
        "https://api.cobalt.zipline.moe/api/json"
    ]
    url = "https://www.youtube.com/watch?v=Y4baVj4ohac"
    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    payload = {
        "url": url,
        "isAudioOnly": True,
        "aFormat": "mp3"
    }
    
    for instance in instances:
        try:
            res = requests.post(instance, json=payload, headers=headers, timeout=5)
            if res.status_code == 200:
                data = res.json()
                if data.get("status") in ["redirect", "stream"]:
                    print(f"✅ Success Cobalt: {instance}")
                else:
                    print(f"❌ Failed Cobalt (Bad status {data.get('status')}): {instance}")
            else:
                print(f"❌ Failed Cobalt (Status {res.status_code}): {instance}")
        except Exception as e:
            print(f"❌ Failed Cobalt (Error): {instance} - {type(e).__name__}")

if __name__ == "__main__":
    test_piped()
    test_cobalt()
