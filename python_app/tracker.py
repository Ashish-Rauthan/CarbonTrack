# tracker.py
import uuid
import time
from datetime import datetime
from codecarbon import EmissionsTracker
import requests
from config import BACKEND_URL

def upload_emission(token, payload):
    """Upload emission data to backend"""
    headers = {
        "Authorization": f"Bearer {token}", 
        "Content-Type": "application/json"
    }
    resp = requests.post(
        f"{BACKEND_URL}/emissions/log", 
        json=payload, 
        headers=headers, 
        timeout=15
    )
    resp.raise_for_status()
    return resp.json()

class TrackerSession:
    def __init__(self, user_id="local-user", device_id="dev-001", token=None):
        self.user_id = user_id
        self.device_id = device_id
        self.token = token
        self.tracker = None
        self.session_id = str(uuid.uuid4())
        self.running = False
        self.start_time = None

    def start(self):
        print("Starting CodeCarbon tracker...")
        self.tracker = EmissionsTracker(
            project_name="DesktopTracker", 
            output_dir=".",
            save_to_file=False  # Don't save to CSV, we'll upload to API
        )
        self.tracker.start()
        self.start_time = time.time()
        self.running = True

    def stop(self):
        if not self.tracker:
            return None
        
        print("Stopping tracker...")
        emissions_kg = self.tracker.stop()  # Returns float (kg CO2)
        self.running = False
        
        # Calculate duration
        duration_seconds = time.time() - self.start_time if self.start_time else 0
        
        # Access the final emissions data from tracker
        final_data = self.tracker.final_emissions_data
        
        result = {
            "session_id": self.session_id,
            "device_id": self.device_id,
            "timestamp": datetime.utcnow().isoformat(),
            "energy_kwh": final_data.energy_consumed,
            "emissions_gco2": final_data.emissions * 1000,  # Convert kg to g
            "duration_seconds": duration_seconds
        }
        
        print("Tracking result:", result)
        
        # Upload to backend if token is available
        if self.token:
            try:
                upload_result = upload_emission(self.token, result)
                print("Upload successful:", upload_result)
            except Exception as e:
                print(f"Failed to upload emissions: {e}")
        
        return result