import requests

class CloudAPIClient:
    def __init__(self, token):
        self.base_url = "http://localhost:5000/api/cloud"
        self.headers = {
            "Authorization": f"Bearer {token}"
        }

    def test_connection(self, provider):
        r = requests.get(
            f"{self.base_url}/test-connection/{provider}",
            headers=self.headers,
            timeout=10
        )
        return r.json()

    def get_regions(self):
        return requests.get(
            f"{self.base_url}/regions",
            headers=self.headers
        ).json()
