# python_app/config.py

import os
from dotenv import load_dotenv

load_dotenv()

# Backend URLs
BACKEND_URL = os.getenv('BACKEND_URL', 'http://localhost:5000/api')
DASHBOARD_URL = os.getenv('DASHBOARD_URL', 'http://localhost:3000')

# AWS Configuration
AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY_ID')
AWS_SECRET_ACCESS_KEY = os.getenv('AWS_SECRET_ACCESS_KEY')
AWS_REGION = os.getenv('AWS_REGION', 'us-east-1')

# Features
ENABLE_CLOUD_FEATURES = os.getenv('ENABLE_CLOUD_FEATURES', 'false').lower() == 'true'

# Validate cloud configuration
def validate_cloud_config():
    """Check if cloud services are properly configured"""
    aws_configured = bool(AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY)
    
    return {
        'aws': aws_configured,
        'gcp': False,  # Not supported in AWS-only mode
        'any': aws_configured
    }

def get_cloud_status():
    """Get detailed cloud configuration status"""
    config = validate_cloud_config()
    
    status = {
        'enabled': ENABLE_CLOUD_FEATURES,
        'providers': {
            'aws': {
                'configured': config['aws'],
                'region': AWS_REGION if config['aws'] else None
            },
            'gcp': {
                'configured': False,
                'supported': False
            }
        }
    }
    
    return status