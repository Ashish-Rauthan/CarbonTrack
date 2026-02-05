# python_app/cloud_service.py

import requests
from config import BACKEND_URL

class CloudService:
    """API client for cloud services through backend"""
    
    def __init__(self, token):
        self.token = token
        self.headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        self.base_url = f"{BACKEND_URL}/cloud"
    
    def test_connection(self, provider):
        """Test connection to cloud provider"""
        url = f"{self.base_url}/test-connection/{provider}"
        
        try:
            response = requests.get(url, headers=self.headers, timeout=15)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Error testing {provider} connection: {e}")
            return {'success': False, 'error': str(e)}
    
    def get_available_regions(self, provider=None):
        """Get available cloud regions sorted by carbon intensity"""
        url = f"{self.base_url}/regions"
        params = {"provider": provider} if provider else {}
        
        try:
            response = requests.get(url, headers=self.headers, params=params, timeout=10)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Error fetching regions: {e}")
            return None
    
    def calculate_savings(self, workload_type, duration_hours, power_watts, target_region_id):
        """Calculate potential carbon savings"""
        url = f"{self.base_url}/calculate-savings"
        payload = {
            "workloadType": workload_type,
            "estimatedDurationHours": duration_hours,
            "estimatedPowerWatts": power_watts,
            "targetRegion": target_region_id
        }
        
        try:
            response = requests.post(url, json=payload, headers=self.headers, timeout=10)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Error calculating savings: {e}")
            return None
    
    def launch_instance(self, provider, region, zone, instance_type, workload_type, duration_hours):
        """Launch a cloud instance"""
        url = f"{self.base_url}/launch-instance"
        payload = {
            "provider": provider,
            "region": region,
            "zone": zone,
            "instanceType": instance_type,
            "workloadType": workload_type,
            "estimatedDurationHours": duration_hours
        }
        
        # Remove None values
        payload = {k: v for k, v in payload.items() if v is not None}
        
        print(f"Launching instance - URL: {url}")
        print(f"Payload: {payload}")
        print(f"Headers: {self.headers}")
        
        try:
            response = requests.post(url, json=payload, headers=self.headers, timeout=30)
            
            print(f"Response status: {response.status_code}")
            print(f"Response headers: {response.headers}")
            print(f"Response body: {response.text}")
            
            response.raise_for_status()
            return response.json()
        except requests.exceptions.HTTPError as e:
            print(f"HTTP Error: {e}")
            print(f"Response content: {e.response.text if hasattr(e, 'response') else 'No response'}")
            return {
                'message': f'HTTP Error: {str(e)}', 
                'success': False,
                'error': e.response.text if hasattr(e, 'response') else str(e)
            }
        except Exception as e:
            print(f"Error launching instance: {e}")
            return {'message': f'Error: {str(e)}', 'success': False}
    
    def terminate_instance(self, provider, instance_id, region=None, zone=None, workload_id=None):
        """Terminate a cloud instance"""
        url = f"{self.base_url}/terminate-instance"
        payload = {
            "provider": provider,
            "instanceId": instance_id,
            "region": region,
            "zone": zone,
            "workloadId": workload_id
        }
        
        payload = {k: v for k, v in payload.items() if v is not None}
        
        try:
            response = requests.post(url, json=payload, headers=self.headers, timeout=30)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Error terminating instance: {e}")
            return {'message': f'Error: {str(e)}', 'success': False}
    
    def get_instance_status(self, provider, instance_id, region=None, zone=None):
        """Get instance status"""
        url = f"{self.base_url}/instance-status/{provider}/{instance_id}"
        params = {}
        if region:
            params['region'] = region
        if zone:
            params['zone'] = zone
        
        try:
            response = requests.get(url, headers=self.headers, params=params, timeout=10)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Error getting instance status: {e}")
            return {'success': False, 'error': str(e)}
    
    def list_instances(self, provider, region=None, zone=None):
        """List all instances for a provider"""
        url = f"{self.base_url}/instances/{provider}"
        params = {}
        if region:
            params['region'] = region
        if zone:
            params['zone'] = zone
        
        try:
            response = requests.get(url, headers=self.headers, params=params, timeout=10)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Error listing instances: {e}")
            return {'success': False, 'error': str(e), 'instances': []}
    
    def submit_workload(self, workload_data):
        """Submit a cloud workload (manual/simulated)"""
        url = f"{self.base_url}/workloads"
        
        try:
            response = requests.post(url, json=workload_data, headers=self.headers, timeout=10)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Error submitting workload: {e}")
            return None
    
    def get_workloads(self, status=None, provider=None, limit=50):
        """Get user's cloud workloads"""
        url = f"{self.base_url}/workloads"
        params = {'limit': limit}
        if status:
            params['status'] = status
        if provider:
            params['provider'] = provider
        
        try:
            response = requests.get(url, headers=self.headers, params=params, timeout=10)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Error fetching workloads: {e}")
            return None
    
    def get_workload_details(self, workload_id):
        """Get details of a specific workload"""
        url = f"{self.base_url}/workloads/{workload_id}"
        
        try:
            response = requests.get(url, headers=self.headers, timeout=10)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Error fetching workload details: {e}")
            return None