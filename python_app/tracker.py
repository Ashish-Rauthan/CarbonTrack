# tracker.py
import uuid, time
from datetime import datetime
from codecarbon import EmissionsTracker
# snippet: upload_emission in tracker.py
import requests
from config import BACKEND_URL

def upload_emission(token, payload):
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    resp = requests.post(f"{BACKEND_URL}/emissions/log", json=payload, headers=headers, timeout=15)
    resp.raise_for_status()
    return resp.json()

class TrackerSession:
    def __init__(self, user_id="local-user", device_id="dev-001"):
        self.user_id = user_id
        self.device_id = device_id
        self.tracker = None
        self.session_id = str(uuid.uuid4())
        self.running = False

    def start(self):
        print("Starting CodeCarbon tracker...")
        self.tracker = EmissionsTracker(project_name="DesktopTracker", output_dir=".")
        self.tracker.start()
        self.running = True

    def stop(self):
        if not self.tracker:
            return None
        print("Stopping tracker...")
        emissions = self.tracker.stop()
        self.running = False
        result = {
            "session_id": self.session_id,
            "timestamp": datetime.utcnow().isoformat(),
            "energy_kwh": emissions.get("energy_consumed"),
            "emissions_gco2": emissions.get("emissions"),
        }
        print("Tracking result:", result)
        return result
