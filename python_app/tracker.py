# python_app/tracker.py

import uuid
import time
from datetime import datetime
import requests
from config import BACKEND_URL

# CodeCarbon import with graceful fallback
try:
    from codecarbon import EmissionsTracker
    CODECARBON_AVAILABLE = True
except ImportError:
    CODECARBON_AVAILABLE = False
    print("WARNING: codecarbon not installed - emissions estimated from duration only")


def _safe_float(value, default=0.0) -> float:
    """Convert value to float safely, return default on None / NaN / negative."""
    try:
        result = float(value)
        if result != result:   # NaN
            return default
        if result < 0:
            return default
        return result
    except (TypeError, ValueError):
        return default


def _estimate_emissions(duration_seconds: float, power_watts: float = 15.0) -> dict:
    """
    Fallback estimation when CodeCarbon data is unavailable.
    Uses a conservative average grid intensity of 500 gCO2/kWh.
    """
    energy_kwh     = (power_watts * duration_seconds / 3600) / 1000
    emissions_gco2 = energy_kwh * 500          # 500 gCO2/kWh average grid
    return {
        "energy_kwh":     energy_kwh,
        "emissions_gco2": emissions_gco2,
    }


def upload_emission(token: str, payload: dict) -> dict:
    """
    Upload emission data to the backend.
    Raises requests.HTTPError on non-2xx responses so the caller can log the
    full response body for debugging.
    """
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type":  "application/json",
    }

    print(f"Uploading emission payload: {payload}")

    resp = requests.post(
        f"{BACKEND_URL}/emissions/log",
        json=payload,
        headers=headers,
        timeout=15,
    )

    # Surface the full error body before raising so we can see what went wrong
    if not resp.ok:
        print(f"Upload failed - status {resp.status_code}: {resp.text}")
    resp.raise_for_status()
    return resp.json()


class TrackerSession:
    def __init__(self, user_id="local-user", device_id="dev-001", token=None):
        self.user_id    = user_id
        self.device_id  = device_id
        self.token      = token
        self.tracker    = None
        self.session_id = str(uuid.uuid4())
        self.running    = False
        self.start_time = None
        self._using_codecarbon = False

    # ── start ─────────────────────────────────────────────────────────────────

    def start(self):
        self.start_time = time.time()
        self.running    = True

        if CODECARBON_AVAILABLE:
            try:
                print("Starting CodeCarbon tracker...")
                self.tracker = EmissionsTracker(
                    project_name="DesktopTracker",
                    output_dir=".",
                    save_to_file=False,
                    allow_multiple_runs=True,   # prevent lock-file errors
                )
                self.tracker.start()
                self._using_codecarbon = True
                print("CodeCarbon tracker started.")
            except Exception as e:
                print(f"WARNING: CodeCarbon failed to start ({e}) – using fallback estimation")
                self.tracker         = None
                self._using_codecarbon = False
        else:
            print("Using fallback power estimation (codecarbon unavailable).")

    # ── stop ──────────────────────────────────────────────────────────────────

    def stop(self) -> dict | None:
        if not self.running:
            print("Tracker was not running.")
            return None

        duration_seconds = time.time() - self.start_time if self.start_time else 0
        self.running     = False

        energy_kwh     = 0.0
        emissions_gco2 = 0.0

        # ── Try to get real measurements from CodeCarbon ──────────────────────
        if self._using_codecarbon and self.tracker is not None:
            try:
                print("Stopping CodeCarbon tracker...")
                emissions_kg = self.tracker.stop()

                final_data = getattr(self.tracker, 'final_emissions_data', None)

                if final_data is not None:
                    energy_kwh     = _safe_float(getattr(final_data, 'energy_consumed', None))
                    emissions_gco2 = _safe_float(getattr(final_data, 'emissions', None)) * 1000
                elif emissions_kg is not None:
                    # final_emissions_data missing but we have the total kg value
                    emissions_gco2 = _safe_float(emissions_kg) * 1_000_000  # kg -> g
                    energy_kwh     = emissions_gco2 / 500 / 1000             # rough reverse

                print(f"CodeCarbon raw: energy={energy_kwh} kWh, emissions={emissions_gco2} gCO2")

            except Exception as e:
                print(f"WARNING: CodeCarbon stop() failed ({e}) – falling back to estimation")
                energy_kwh     = 0.0
                emissions_gco2 = 0.0

        # ── Fallback: estimate from wall-clock duration ───────────────────────
        # Also used when CodeCarbon returned zeros (e.g. session < 15 s)
        if energy_kwh == 0.0 and emissions_gco2 == 0.0:
            print("Using fallback estimation (no CodeCarbon data or zero values)")
            estimated      = _estimate_emissions(duration_seconds)
            energy_kwh     = estimated["energy_kwh"]
            emissions_gco2 = estimated["emissions_gco2"]

        # ── Build validated payload ───────────────────────────────────────────
        payload = {
            "session_id":       self.session_id,
            "device_id":        self.device_id,
            "timestamp":        datetime.utcnow().isoformat() + "Z",
            "energy_kwh":       round(energy_kwh,     8),
            "emissions_gco2":   round(emissions_gco2, 6),
            "duration_seconds": round(duration_seconds, 2),
            "metadata": {
                "source": "codecarbon" if self._using_codecarbon else "estimated",
            },
        }

        # Guard: ensure required numeric fields are valid before sending
        for field in ("energy_kwh", "emissions_gco2", "duration_seconds"):
            if not isinstance(payload[field], (int, float)) or payload[field] < 0:
                print(f"ERROR: invalid value for {field}: {payload[field]}")
                return None

        result = {
            "session_id":       self.session_id,
            "device_id":        self.device_id,
            "timestamp":        payload["timestamp"],
            "energy_kwh":       energy_kwh,
            "emissions_gco2":   emissions_gco2,
            "duration_seconds": duration_seconds,
        }

        print(f"Tracking result: {result}")

        # ── Upload ────────────────────────────────────────────────────────────
        if self.token:
            try:
                upload_result = upload_emission(self.token, payload)
                print(f"Upload successful: {upload_result}")
            except requests.HTTPError as e:
                # Error body already printed inside upload_emission()
                print(f"HTTP error uploading emissions: {e}")
            except requests.ConnectionError:
                print("Upload failed: could not connect to backend (is it running?)")
            except Exception as e:
                print(f"Unexpected upload error: {e}")

        return result