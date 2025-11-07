# auth.py
import requests
from config import BACKEND_URL

def login(email, password):
    """
    Calls backend /api/auth/login
    Returns: token (string) or None
    """
    try:
        r = requests.post(
            f"{BACKEND_URL}/auth/login", 
            json={"email": email, "password": password}, 
            timeout=10
        )
        if r.status_code == 200:
            data = r.json()
            # Return just the token
            return data.get("token")
    except Exception as e:
        print("Login failed:", e)
    return None