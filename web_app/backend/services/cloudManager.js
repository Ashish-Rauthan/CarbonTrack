// web_app/backend/services/cloudManager.js

const { 
  EC2Client, 
  DescribeInstancesCommand, 
  RunInstancesCommand, 
  TerminateInstancesCommand,
  DescribeInstanceTypesCommand
} = require('@aws-sdk/client-ec2');
const { CloudWatchClient } = require('@aws-sdk/client-cloudwatch');
const { S3Client } = require('@aws-sdk/client-s3');
require('dotenv').config();

// ─── Region → Free-Tier-eligible instance type ───────────────────────────────
// t2.micro  : free tier only in regions that still support the T2 family
// t3.micro  : free tier in newer regions (T3 replaced T2)
// Source: https://aws.amazon.com/free/?all-free-tier
const REGION_FREE_TIER_INSTANCE = {
  // T2 regions (legacy, still support t2.micro free tier)
  'us-east-1':      't2.micro',
  'us-east-2':      't2.micro',
  'us-west-1':      't2.micro',
  'us-west-2':      't2.micro',
  'eu-west-1':      't2.micro',
  'eu-west-2':      't2.micro',
  'eu-central-1':   't2.micro',
  'ap-northeast-1': 't2.micro',
  'ap-southeast-1': 't2.micro',
  'ap-southeast-2': 't2.micro',
  'sa-east-1':      't2.micro',

  // T3 regions (newer, only t3.micro is free tier eligible)
  'eu-north-1':     't3.micro',   // Stockholm
  'ca-central-1':   't3.micro',   // Montreal
  'ap-south-1':     't3.micro',   // Mumbai
  'ap-northeast-2': 't3.micro',   // Seoul
  'ap-northeast-3': 't3.micro',   // Osaka
  'eu-west-3':      't3.micro',   // Paris
  'eu-south-1':     't3.micro',   // Milan
  'af-south-1':     't3.micro',   // Cape Town
  'me-south-1':     't3.micro',   // Bahrain
};

// ─── Region → latest Amazon Linux 2023 AMI ───────────────────────────────────
// ami-* IDs are region-specific. These are Amazon Linux 2023 (HVM, x86_64).
const REGION_AMI = {
  'us-east-1':      'ami-0230bd60aa48260c6',
  'us-east-2':      'ami-0a606d8395a538502',
  'us-west-1':      'ami-04fdea8e25817cd69',
  'us-west-2':      'ami-0688ba7eeeeefe3cd',
  'eu-west-1':      'ami-0d71ea30463e0ff8d',
  'eu-west-2':      'ami-0bd2230cfb28832f7',
  'eu-west-3':      'ami-0c6ebbd55ab05f070',
  'eu-north-1':     'ami-092cce4a19b438926',   // Stockholm
  'eu-central-1':   'ami-06dd92ecc74fdfb36',
  'ap-south-1':     'ami-0c2af51e265bd5e0e',   // Mumbai
  'ap-southeast-1': 'ami-0dc2d3e4c0f9ebd18',
  'ap-southeast-2': 'ami-0c55b159cbfafe1f0',
  'ap-northeast-1': 'ami-0bba69335379e17f8',
  'ap-northeast-2': 'ami-09e67e426f25ce0d7',
  'ca-central-1':   'ami-0c3377fc7bcdc3ed8',   // Montreal
  'sa-east-1':      'ami-02334c45dd95ca1fc',
};

// All regions we support for launch
const SUPPORTED_REGIONS = Object.keys(REGION_AMI);

// Supported instance types (what we allow the user to choose)
const SUPPORTED_INSTANCE_TYPES = [
  't2.micro',
  't2.small',
  't3.micro',
  't3.small',
];

// Hourly on-demand cost estimates (USD) — used for savings display only
const INSTANCE_COST_PER_HOUR = {
  't2.micro':  0.0116,
  't2.small':  0.0230,
  't2.medium': 0.0464,
  't3.micro':  0.0104,
  't3.small':  0.0208,
  't3.medium': 0.0416,
};

// Approximate power consumption in watts per instance type
const INSTANCE_POWER_WATTS = {
  't2.micro':  5,
  't2.small':  10,
  't2.medium': 20,
  't3.micro':  4,
  't3.small':  8,
  't3.medium': 16,
  't3.large':  32,
};

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
        },
      };

      this.ec2Client         = new EC2Client(this.awsConfig);
      this.s3Client          = new S3Client(this.awsConfig);
      this.cloudWatchClient  = new CloudWatchClient(this.awsConfig);

      console.log('✓ AWS clients initialised');
      console.log(`✓ Default region: ${this.awsConfig.region}`);
    } catch (error) {
      console.error('❌ Error initialising AWS clients:', error.message);
      this.isEnabled = false;
    }
  }

  // ── helpers ────────────────────────────────────────────────────────────────

  isAvailable() {
    return this.isEnabled;
  }

  /** Return the correct EC2 client for a given region */
  _ec2ForRegion(region) {
    if (!region || region === this.awsConfig.region) return this.ec2Client;
    return new EC2Client({ ...this.awsConfig, region });
  }

  /**
   * Return the AMI ID for a region.
   * Always returns a plain string — never an array.
   */
  getAMIForRegion(region) {
    const ami = REGION_AMI[region] || REGION_AMI['us-east-1'];
    return String(ami).trim();
  }

  /**
   * Return the free-tier-eligible instance type for a region.
   * Falls back to 't3.micro' which is free-tier eligible everywhere.
   */
  getFreeTierInstanceForRegion(region) {
    return REGION_FREE_TIER_INSTANCE[region] || 't3.micro';
  }

  /**
   * Resolve the instance type to use.
   *
   * Rules:
   *  1. If the caller explicitly chose 't2.micro' but the region only supports
   *     t3 free tier → silently upgrade to 't3.micro'.
   *  2. Otherwise honour the caller's choice.
   */
  resolveInstanceType(requestedType, region) {
    const freeTier = this.getFreeTierInstanceForRegion(region);

    // If user asked for t2.micro but this region only has t3.micro as free tier
    if (requestedType === 't2.micro' && freeTier === 't3.micro') {
      console.log(
        `ℹ️  t2.micro is not free-tier in ${region} — using t3.micro instead`
      );
      return 't3.micro';
    }

    return requestedType || freeTier;
  }

  // ── core AWS operations ────────────────────────────────────────────────────

  async launchAWSInstance(region, instanceType = null, tags = {}) {
    console.log('\n=== LAUNCH AWS INSTANCE ===');
    console.log('Requested region      :', region);
    console.log('Requested instanceType:', instanceType);

    if (!this.isEnabled) throw new Error('Cloud integration is disabled');

    // ── Resolve the correct instance type for this region ──
    const resolvedType = this.resolveInstanceType(instanceType, region);
    const amiId        = this.getAMIForRegion(region);
    const ec2          = this._ec2ForRegion(region);

    console.log('Resolved instanceType :', resolvedType);
    console.log('AMI ID                :', amiId);

    const params = {
      ImageId:      amiId,
      InstanceType: resolvedType,
      MinCount: 1,
      MaxCount: 1,
      TagSpecifications: [
        {
          ResourceType: 'instance',
          Tags: [
            { Key: 'Name',      Value: 'CarbonTracker-Workload' },
            { Key: 'ManagedBy', Value: 'CarbonTrackerApp' },
            { Key: 'CreatedAt', Value: new Date().toISOString() },
            { Key: 'Purpose',   Value: 'Carbon-Optimization' },
            ...Object.entries(tags).map(([Key, Value]) => ({
              Key,
              Value: String(Value),
            })),
          ],
        },
      ],
    };

    console.log('RunInstances params:', JSON.stringify(params, null, 2));

    try {
      const response = await ec2.send(new RunInstancesCommand(params));
      const instance  = response.Instances[0];

      console.log(`✓ Instance launched: ${instance.InstanceId}`);
      console.log('=== LAUNCH SUCCESS ===\n');

      return {
        success:      true,
        instanceId:   instance.InstanceId,
        state:        instance.State.Name,
        launchTime:   instance.LaunchTime,
        instanceType: instance.InstanceType,
        region,
        provider:     'aws',
        resolvedInstanceType: resolvedType,  // so caller knows what was used
      };
    } catch (error) {
      console.error('=== LAUNCH FAILED ===');
      console.error('Error:', error.message);
      throw new Error(`Failed to launch AWS instance: ${error.message}`);
    }
  }

  async terminateAWSInstance(instanceId, region = null) {
    if (!this.isEnabled) throw new Error('Cloud integration is disabled');

    const ec2 = this._ec2ForRegion(region);
    console.log(`Terminating instance ${instanceId} in ${region || this.awsConfig.region}...`);

    const response = await ec2.send(
      new TerminateInstancesCommand({ InstanceIds: [instanceId] })
    );

    console.log(`✓ Instance ${instanceId} terminated`);
    return {
      success:       true,
      instanceId,
      currentState:  response.TerminatingInstances[0].CurrentState.Name,
      previousState: response.TerminatingInstances[0].PreviousState.Name,
    };
  }

  async getAWSInstanceStatus(instanceId, region = null) {
    if (!this.isEnabled) throw new Error('Cloud integration is disabled');

    try {
      const ec2      = this._ec2ForRegion(region);
      const response = await ec2.send(
        new DescribeInstancesCommand({ InstanceIds: [instanceId] })
      );

      if (!response.Reservations.length) {
        return { success: false, error: 'Instance not found' };
      }

      const instance = response.Reservations[0].Instances[0];
      return {
        success:      true,
        instanceId:   instance.InstanceId,
        state:        instance.State.Name,
        instanceType: instance.InstanceType,
        launchTime:   instance.LaunchTime,
        publicIp:     instance.PublicIpAddress  || null,
        privateIp:    instance.PrivateIpAddress || null,
        region:       region || this.awsConfig.region,
      };
    } catch (error) {
      console.error('Error getting instance status:', error);
      return { success: false, error: error.message };
    }
  }

  async listAWSInstances(region = null) {
    if (!this.isEnabled) throw new Error('Cloud integration is disabled');

    try {
      const ec2      = this._ec2ForRegion(region);
      const response = await ec2.send(
        new DescribeInstancesCommand({
          Filters: [
            { Name: 'tag:ManagedBy',          Values: ['CarbonTrackerApp'] },
            { Name: 'instance-state-name',    Values: ['pending', 'running', 'stopping', 'stopped'] },
          ],
        })
      );

      const instances = response.Reservations.flatMap(r =>
        r.Instances.map(i => ({
          instanceId:   i.InstanceId,
          state:        i.State.Name,
          instanceType: i.InstanceType,
          launchTime:   i.LaunchTime,
          publicIp:     i.PublicIpAddress || null,
          region:       region || this.awsConfig.region,
        }))
      );

      return { success: true, instances, count: instances.length };
    } catch (error) {
      console.error('Error listing instances:', error);
      return { success: false, error: error.message, instances: [] };
    }
  }

  async calculateCloudEmissions(provider, region, instanceType, durationHours) {
    const power      = INSTANCE_POWER_WATTS[instanceType] || 5;
    const energyKWh  = (power * durationHours) / 1000;

    const CloudRegion = require('../models/CloudRegion');
    const regionData  = await CloudRegion.findOne({ provider, region });

    if (!regionData) {
      throw new Error(`Region data not found for ${provider}:${region}`);
    }

    const emissionsGCO2 = energyKWh * regionData.carbonIntensity;

    return {
      energyKWh:          parseFloat(energyKWh.toFixed(6)),
      emissionsGCO2:      parseFloat(emissionsGCO2.toFixed(2)),
      carbonIntensity:    regionData.carbonIntensity,
      renewablePercentage: regionData.renewablePercentage,
      power,
    };
  }

  async testConnection(provider) {
    if (!this.isEnabled) {
      return { success: false, provider, error: 'Cloud integration is disabled' };
    }
    if (provider !== 'aws') {
      return { success: false, provider, error: 'Only AWS is supported' };
    }

    try {
      await this.ec2Client.send(new DescribeInstancesCommand({ MaxResults: 5 }));
      return {
        success:  true,
        provider: 'aws',
        message:  'AWS connection successful',
        region:   this.awsConfig.region,
      };
    } catch (error) {
      console.error('Error testing AWS connection:', error);
      return { success: false, provider: 'aws', error: error.message };
    }
  }

  estimateCost(provider, instanceType, durationHours) {
    if (provider !== 'aws') return 0;
    const hourly = INSTANCE_COST_PER_HOUR[instanceType] || 0.01;
    return parseFloat((hourly * durationHours).toFixed(4));
  }

  getSupportedRegions()      { return SUPPORTED_REGIONS; }
  getSupportedInstanceTypes() { return SUPPORTED_INSTANCE_TYPES; }

  /**
   * Expose free-tier info so the frontend / routes can surface it to the user.
   * Returns { instanceType, isFree } for a given region + requested type.
   */
  getInstanceTypeInfo(region, requestedType) {
    const resolved = this.resolveInstanceType(requestedType, region);
    const freeTier = this.getFreeTierInstanceForRegion(region);
    return {
      requestedType,
      resolvedType: resolved,
      freeTierType: freeTier,
      wasUpgraded:  resolved !== requestedType,
    };
  }
}

module.exports = new CloudManager();