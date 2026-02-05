// web_app/backend/services/cloudManager.js

const { 
  EC2Client, 
  DescribeInstancesCommand, 
  RunInstancesCommand, 
  TerminateInstancesCommand,
  DescribeInstanceStatusCommand
} = require('@aws-sdk/client-ec2');
const { CloudWatchClient, GetMetricStatisticsCommand } = require('@aws-sdk/client-cloudwatch');
const { S3Client } = require('@aws-sdk/client-s3');
require('dotenv').config();

class CloudManager {
  constructor() {
    this.isEnabled = process.env.ENABLE_CLOUD_INTEGRATION === 'true';
    
    if (!this.isEnabled) {
      console.log('⚠️  Cloud integration is disabled');
      return;
    }

    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      console.error('❌ AWS credentials not found in environment variables');
      this.isEnabled = false;
      return;
    }

    try {
      this.awsConfig = {
        region: process.env.AWS_REGION || 'us-east-1',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        }
      };
      
      this.ec2Client = new EC2Client(this.awsConfig);
      this.s3Client = new S3Client(this.awsConfig);
      this.cloudWatchClient = new CloudWatchClient(this.awsConfig);
      
      console.log('✓ AWS clients initialized successfully');
      console.log(`✓ Default region: ${this.awsConfig.region}`);
    } catch (error) {
      console.error('❌ Error initializing AWS clients:', error.message);
      this.isEnabled = false;
    }
  }

  isAvailable() {
    return this.isEnabled;
  }

  getAMIForRegion(region) {
    const amiMap = {
      'us-east-1': 'ami-0230bd60aa48260c6',
      'us-east-2': 'ami-0a606d8395a538502',
      'us-west-1': 'ami-04fdea8e25817cd69',
      'us-west-2': 'ami-0688ba7eeeeefe3cd',
      'eu-west-1': 'ami-0d71ea30463e0ff8d',
      'eu-west-2': 'ami-0bd2230cfb28832f7',
      'eu-north-1': 'ami-092cce4a19b438926',
      'eu-central-1': 'ami-06dd92ecc74fdfb36',
      'ap-south-1': 'ami-0c2af51e265bd5e0e',
      'ap-southeast-1': 'ami-0dc2d3e4c0f9ebd18',
      'ap-northeast-1': 'ami-0bba69335379e17f8',
      'ca-central-1': 'ami-0c3377fc7bcdc3ed8',
      'sa-east-1': 'ami-02334c45dd95ca1fc',
    };
    
    const ami = amiMap[region] || amiMap['us-east-1'];
    
    console.log(`getAMIForRegion("${region}") = "${ami}"`);
    console.log(`AMI type: ${typeof ami}, is Array: ${Array.isArray(ami)}`);
    
    // Safety check
    if (Array.isArray(ami)) {
      console.error('ERROR: AMI is an array!', ami);
      return String(ami[0]);
    }
    
    return String(ami); // Force to string
  }

  async launchAWSInstance(region, instanceType = 't2.micro', tags = {}) {
    console.log('\n=== LAUNCH AWS INSTANCE ===');
    console.log('Region:', region);
    console.log('Instance Type:', instanceType);
    console.log('Tags:', tags);
    
    if (!this.isEnabled) {
      throw new Error('Cloud integration is disabled');
    }

    try {
      const ec2 = region !== this.awsConfig.region 
        ? new EC2Client({ ...this.awsConfig, region })
        : this.ec2Client;

      // Get AMI with debugging
      console.log('Getting AMI for region...');
      let amiId = this.getAMIForRegion(region);
      
      console.log('AMI ID before sanitization:', amiId);
      console.log('AMI ID type:', typeof amiId);
      console.log('AMI ID is Array?:', Array.isArray(amiId));
      
      // Extra defensive coding
      if (Array.isArray(amiId)) {
        console.error('WARNING: AMI ID is an array, extracting first element');
        amiId = amiId[0];
      }
      
      // Force to string and trim
      amiId = String(amiId).trim();
      
      console.log('Final AMI ID:', amiId);
      console.log('Final AMI ID length:', amiId.length);
      console.log('Final AMI ID starts with "ami-"?:', amiId.startsWith('ami-'));

      const params = {
        ImageId: amiId,
        InstanceType: instanceType,
        MinCount: 1,
        MaxCount: 1,
        TagSpecifications: [
          {
            ResourceType: 'instance',
            Tags: [
              { Key: 'Name', Value: 'CarbonTracker-Workload' },
              { Key: 'ManagedBy', Value: 'CarbonTrackerApp' },
              { Key: 'CreatedAt', Value: new Date().toISOString() },
              { Key: 'Purpose', Value: 'Carbon-Optimization' },
              ...Object.entries(tags).map(([Key, Value]) => ({ Key, Value: String(Value) }))
            ]
          }
        ]
      };

      console.log('Launch params:');
      console.log(JSON.stringify(params, null, 2));
      console.log(`Launching ${instanceType} instance in ${region}...`);
      
      const command = new RunInstancesCommand(params);
      const response = await ec2.send(command);
      
      const instance = response.Instances[0];
      
      console.log(`✓ Instance launched: ${instance.InstanceId}`);
      console.log('=== LAUNCH SUCCESS ===\n');
      
      return {
        success: true,
        instanceId: instance.InstanceId,
        state: instance.State.Name,
        launchTime: instance.LaunchTime,
        instanceType: instance.InstanceType,
        region: region,
        provider: 'aws'
      };
    } catch (error) {
      console.error('=== LAUNCH FAILED ===');
      console.error('Error:', error.message);
      console.error('Stack:', error.stack);
      throw new Error(`Failed to launch AWS instance: ${error.message}`);
    }
  }

  async terminateAWSInstance(instanceId, region = null) {
    if (!this.isEnabled) {
      throw new Error('Cloud integration is disabled');
    }

    try {
      const ec2 = region && region !== this.awsConfig.region
        ? new EC2Client({ ...this.awsConfig, region })
        : this.ec2Client;

      console.log(`Terminating instance ${instanceId}...`);
      const command = new TerminateInstancesCommand({
        InstanceIds: [instanceId]
      });
      
      const response = await ec2.send(command);
      
      console.log(`✓ Instance ${instanceId} terminated`);
      
      return {
        success: true,
        instanceId: instanceId,
        currentState: response.TerminatingInstances[0].CurrentState.Name,
        previousState: response.TerminatingInstances[0].PreviousState.Name
      };
    } catch (error) {
      console.error('Error terminating AWS instance:', error);
      throw new Error(`Failed to terminate AWS instance: ${error.message}`);
    }
  }

  async getAWSInstanceStatus(instanceId, region = null) {
    if (!this.isEnabled) {
      throw new Error('Cloud integration is disabled');
    }

    try {
      const ec2 = region && region !== this.awsConfig.region
        ? new EC2Client({ ...this.awsConfig, region })
        : this.ec2Client;

      const command = new DescribeInstancesCommand({
        InstanceIds: [instanceId]
      });
      
      const response = await ec2.send(command);
      
      if (response.Reservations.length === 0) {
        return { success: false, error: 'Instance not found' };
      }
      
      const instance = response.Reservations[0].Instances[0];
      
      return {
        success: true,
        instanceId: instance.InstanceId,
        state: instance.State.Name,
        instanceType: instance.InstanceType,
        launchTime: instance.LaunchTime,
        publicIp: instance.PublicIpAddress || null,
        privateIp: instance.PrivateIpAddress || null,
        region: region || this.awsConfig.region
      };
    } catch (error) {
      console.error('Error getting AWS instance status:', error);
      return { success: false, error: error.message };
    }
  }

  async listAWSInstances(region = null) {
    if (!this.isEnabled) {
      throw new Error('Cloud integration is disabled');
    }

    try {
      const ec2 = region && region !== this.awsConfig.region
        ? new EC2Client({ ...this.awsConfig, region })
        : this.ec2Client;

      const command = new DescribeInstancesCommand({
        Filters: [
          {
            Name: 'tag:ManagedBy',
            Values: ['CarbonTrackerApp']
          },
          {
            Name: 'instance-state-name',
            Values: ['pending', 'running', 'stopping', 'stopped']
          }
        ]
      });
      
      const response = await ec2.send(command);
      
      const instances = [];
      for (const reservation of response.Reservations) {
        for (const instance of reservation.Instances) {
          instances.push({
            instanceId: instance.InstanceId,
            state: instance.State.Name,
            instanceType: instance.InstanceType,
            launchTime: instance.LaunchTime,
            publicIp: instance.PublicIpAddress || null,
            region: region || this.awsConfig.region
          });
        }
      }
      
      return { success: true, instances, count: instances.length };
    } catch (error) {
      console.error('Error listing AWS instances:', error);
      return { success: false, error: error.message, instances: [] };
    }
  }

  async calculateCloudEmissions(provider, region, instanceType, durationHours) {
    const powerMap = {
      't2.micro': 5,
      't2.small': 10,
      't2.medium': 20,
      't3.micro': 4,
      't3.small': 8,
      't3.medium': 16,
      't3.large': 32,
    };

    const power = powerMap[instanceType] || 5;
    const energyKWh = (power * durationHours) / 1000;

    const CloudRegion = require('../models/CloudRegion');
    const regionData = await CloudRegion.findOne({ 
      provider, 
      region 
    });

    if (!regionData) {
      throw new Error(`Region data not found for ${provider}:${region}`);
    }

    const emissionsGCO2 = energyKWh * regionData.carbonIntensity;

    return {
      energyKWh: parseFloat(energyKWh.toFixed(6)),
      emissionsGCO2: parseFloat(emissionsGCO2.toFixed(2)),
      carbonIntensity: regionData.carbonIntensity,
      renewablePercentage: regionData.renewablePercentage,
      power: power
    };
  }

  async testConnection(provider) {
    if (!this.isEnabled) {
      return { 
        success: false, 
        provider, 
        error: 'Cloud integration is disabled' 
      };
    }

    if (provider !== 'aws') {
      return { 
        success: false, 
        provider, 
        error: 'Only AWS is supported' 
      };
    }

    try {
      const command = new DescribeInstancesCommand({ MaxResults: 5 });
      await this.ec2Client.send(command);
      return { 
        success: true, 
        provider: 'aws', 
        message: 'AWS connection successful',
        region: this.awsConfig.region
      };
    } catch (error) {
      console.error(`Error testing AWS connection:`, error);
      return { 
        success: false, 
        provider: 'aws', 
        error: error.message
      };
    }
  }

  estimateCost(provider, instanceType, durationHours) {
    if (provider !== 'aws') {
      return 0;
    }

    const costMap = {
      't2.micro': 0.0116,
      't2.small': 0.023,
      't2.medium': 0.0464,
      't3.micro': 0.0104,
      't3.small': 0.0208,
      't3.medium': 0.0416,
    };

    const hourlyCost = costMap[instanceType] || 0.01;
    return parseFloat((hourlyCost * durationHours).toFixed(4));
  }

  getSupportedRegions() {
    return [
      'us-east-1',
      'us-east-2',
      'us-west-1',
      'us-west-2',
      'eu-west-1',
      'eu-west-2',
      'eu-north-1',
      'eu-central-1',
      'ap-south-1',
      'ap-southeast-1',
      'ap-northeast-1',
      'ca-central-1',
      'sa-east-1'
    ];
  }

  getSupportedInstanceTypes() {
    return [
      't2.micro',
      't2.small',
      't2.medium',
      't3.micro',
      't3.small',
      't3.medium'
    ];
  }
}

module.exports = new CloudManager();