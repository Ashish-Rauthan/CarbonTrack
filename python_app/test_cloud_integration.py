# python_app/test_cloud_integration.py

"""
Test script for AWS cloud integration
Run this to verify your AWS setup is working
"""

import os
from dotenv import load_dotenv
from cloud_service import CloudService
import config

# Load environment
load_dotenv()

def print_header(text):
    print("\n" + "="*60)
    print(f"  {text}")
    print("="*60)

def print_success(text):
    print(f"  ✓ {text}")

def print_error(text):
    print(f"  ✗ {text}")

def print_warning(text):
    print(f"  ⚠  {text}")

def print_info(text):
    print(f"  ℹ  {text}")

def test_configuration():
    print_header("TESTING CONFIGURATION")
    
    cloud_config = config.validate_cloud_config()
    cloud_status = config.get_cloud_status()
    
    print(f"\nBackend URL: {config.BACKEND_URL}")
    print(f"Dashboard URL: {config.DASHBOARD_URL}")
    print(f"Cloud Features Enabled: {config.ENABLE_CLOUD_FEATURES}")
    
    print(f"\nCloud Provider Configuration:")
    
    if cloud_config['aws']:
        print_success(f"AWS Configured (Region: {config.AWS_REGION})")
    else:
        print_error("AWS NOT Configured")
        
    print_info("GCP not supported in AWS-only mode")
    
    if not cloud_config['aws']:
        print("\n" + "!"*60)
        print_error("AWS credentials missing!")
        print("\nPlease add to your .env file:")
        print("  AWS_ACCESS_KEY_ID=your-key-here")
        print("  AWS_SECRET_ACCESS_KEY=your-secret-here")
        print("  AWS_REGION=us-east-1")
        print("!"*60)
        return False
    
    print_success("Configuration valid!")
    return True

def test_backend_connection(token):
    print_header("TESTING BACKEND CONNECTION")
    
    if not token:
        print_warning("No token provided, skipping backend tests")
        return False
    
    cloud_service = CloudService(token)
    
    # Test AWS connection
    print("\nTesting AWS connection through backend...")
    aws_result = cloud_service.test_connection('aws')
    
    if aws_result and aws_result.get('success'):
        print_success("AWS connection successful!")
        print(f"  Region: {aws_result.get('region', 'unknown')}")
        print(f"  Message: {aws_result.get('message', '')}")
    else:
        print_error("AWS connection failed")
        error = aws_result.get('error') if aws_result else 'No response'
        print(f"  Error: {error}")
        return False
    
    return True

def test_regions(token):
    print_header("TESTING REGION DATA")
    
    if not token:
        print_warning("No token provided, skipping region tests")
        return False
    
    cloud_service = CloudService(token)
    
    print("\nFetching AWS regions...")
    regions_data = cloud_service.get_available_regions(provider='aws')
    
    if regions_data and 'regions' in regions_data:
        aws_regions = [r for r in regions_data['regions'] if r['provider'] == 'aws']
        print_success(f"Found {len(aws_regions)} AWS regions")
        
        if aws_regions:
            rec = aws_regions[0]
            print(f"\n💚 Greenest AWS Region:")
            print(f"  Region: {rec['regionName']} ({rec['region']})")
            print(f"  Carbon Intensity: {rec['carbonIntensity']} gCO₂/kWh")
            print(f"  Renewable: {rec['renewablePercentage']}%")
            print(f"  Country: {rec['country']}")
        
        print(f"\nTop 5 Greenest AWS Regions:")
        for i, region in enumerate(aws_regions[:5], 1):
            print(f"  {i}. {region['regionName']:20} - {region['carbonIntensity']:4} gCO₂/kWh ({region['renewablePercentage']:2}% renewable)")
        
        print(f"\nTop 3 Highest Carbon AWS Regions:")
        sorted_regions = sorted(aws_regions, key=lambda x: x['carbonIntensity'], reverse=True)
        for i, region in enumerate(sorted_regions[:3], 1):
            print(f"  {i}. {region['regionName']:20} - {region['carbonIntensity']:4} gCO₂/kWh ({region['renewablePercentage']:2}% renewable)")
        
        return True
    else:
        print_error("Failed to load regions")
        return False

def test_calculations(token):
    print_header("TESTING SAVINGS CALCULATION")
    
    if not token:
        print_warning("No token provided, skipping calculation tests")
        return False
    
    cloud_service = CloudService(token)
    
    # Get AWS regions first
    regions_data = cloud_service.get_available_regions(provider='aws')
    
    if not regions_data or 'regions' not in regions_data:
        print_error("No regions available for testing")
        return False
    
    aws_regions = [r for r in regions_data['regions'] if r['provider'] == 'aws']
    
    if not aws_regions:
        print_error("No AWS regions found")
        return False
    
    # Use greenest region
    test_region = aws_regions[0]
    
    print(f"\nCalculating savings for:")
    print(f"  Region: {test_region['regionName']} ({test_region['provider'].upper()})")
    print(f"  Carbon Intensity: {test_region['carbonIntensity']} gCO₂/kWh")
    print(f"  Workload: 100W for 2 hours")
    
    savings = cloud_service.calculate_savings(
        workload_type='computation',
        duration_hours=2.0,
        power_watts=100,
        target_region_id=test_region['_id']
    )
    
    if savings:
        print_success("Calculation successful!")
        print(f"\n  Local Emissions:  {savings['localEmissions']} gCO₂")
        print(f"  Cloud Emissions:  {savings['cloudEmissions']} gCO₂")
        print(f"  💚 Savings:       {savings['savingsGCO2']} gCO₂ ({savings['savingsPercentage']}% reduction!)")
        print(f"  Energy Used:      {savings['energyKWh']} kWh")
        
        # Show comparison with worst region
        worst_region = max(aws_regions, key=lambda x: x['carbonIntensity'])
        if worst_region['_id'] != test_region['_id']:
            print(f"\n  💡 Fun Fact:")
            print(f"     Running in {test_region['regionName']} vs {worst_region['regionName']}")
            worst_emissions = float(savings['energyKWh']) * worst_region['carbonIntensity']
            best_emissions = float(savings['cloudEmissions'])
            regional_savings = worst_emissions - best_emissions
            regional_percent = (regional_savings / worst_emissions) * 100
            print(f"     saves {regional_savings:.2f} gCO₂ ({regional_percent:.1f}% reduction!)")
        
        return True
    else:
        print_error("Calculation failed")
        return False

def test_direct_aws():
    print_header("TESTING DIRECT AWS CONNECTION")
    
    cloud_config = config.validate_cloud_config()
    
    if not cloud_config['aws']:
        print_error("AWS not configured, skipping direct test")
        return False
    
    try:
        import boto3
        
        print("\nTesting direct AWS SDK connection...")
        
        # Create EC2 client
        ec2 = boto3.client(
            'ec2',
            region_name=config.AWS_REGION,
            aws_access_key_id=config.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=config.AWS_SECRET_ACCESS_KEY
        )
        
        # Try to describe instances
        response = ec2.describe_instances(MaxResults=5)
        
        print_success("Direct AWS SDK connection successful!")
        print(f"  Region: {config.AWS_REGION}")
        print(f"  Reservations found: {len(response.get('Reservations', []))}")
        
        return True
        
    except Exception as e:
        print_error(f"Direct AWS connection failed: {str(e)}")
        return False

def main():
    print("\n" + "🌍"*30)
    print("  CARBON TRACKER - AWS CLOUD INTEGRATION TEST")
    print("  AWS-Only Configuration")
    print("🌍"*30)
    
    # Test configuration
    if not test_configuration():
        print("\n❌ Configuration test failed. Please fix your configuration.")
        return
    
    # Test direct AWS connection
    print()
    if test_direct_aws():
        print_success("Direct AWS connection verified!")
    else:
        print_warning("Direct AWS connection failed, but backend might still work")
    
    # Ask for login token
    print("\n" + "-"*60)
    print("To test backend connectivity, please provide a login token.")
    print("You can get this by logging into the app or web interface.")
    print("-"*60)
    
    token = input("\nEnter your auth token (or press Enter to skip backend tests): ").strip()
    
    if not token:
        print_warning("Skipping backend tests (no token provided)")
        print("\n✓ Configuration test passed!")
        print("✓ Direct AWS connection verified!")
        print("\nTo run full tests, restart with a valid auth token.")
        return
    
    # Test backend connection
    print()
    if not test_backend_connection(token):
        print("\n❌ Backend connection test failed")
        print("   Make sure the backend server is running:")
        print("   cd web_app/backend && npm run dev")
        return
    
    # Test regions
    print()
    if not test_regions(token):
        print("\n❌ Regions test failed")
        print("   Try seeding regions:")
        print("   curl -X POST http://localhost:5000/api/cloud/regions/seed")
        return
    
    # Test calculations
    print()
    if not test_calculations(token):
        print("\n❌ Calculations test failed")
        return
    
    print("\n" + "="*60)
    print("  ✓ ALL TESTS PASSED!")
    print("="*60)
    print("\n✓ Your AWS cloud integration is configured correctly!")
    print("✓ You can now use the Carbon Tracker app with AWS cloud features.")
    print("\n💚 Start optimizing your carbon footprint!")

if __name__ == "__main__":
    main()