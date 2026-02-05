// web_app/backend/routes/cloud.js

const express = require('express');
const CloudWorkload = require('../models/CloudWorkload');
const CloudRegion = require('../models/CloudRegion');
const auth = require('../middleware/auth');
const cloudManager = require('../services/cloudManager');

const router = express.Router();

// Test cloud connection
router.get('/test-connection/:provider', auth, async (req, res) => {
  try {
    const { provider } = req.params;
    
    if (provider !== 'aws') {
      return res.status(400).json({ 
        success: false, 
        message: 'Only AWS is supported. Please use provider "aws"' 
      });
    }
    
    const result = await cloudManager.testConnection(provider);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(503).json(result);
    }
  } catch (error) {
    console.error('Connection test error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Connection test failed',
      error: error.message 
    });
  }
});

// Launch cloud instance
router.post('/launch-instance', auth, async (req, res) => {
  try {
    const { 
      provider, 
      region,
      instanceType, 
      workloadType,
      estimatedDurationHours 
    } = req.body;

    // Validate inputs
    if (!provider || !workloadType || !estimatedDurationHours) {
      return res.status(400).json({ 
        message: 'Missing required fields: provider, workloadType, estimatedDurationHours' 
      });
    }

    if (provider !== 'aws') {
      return res.status(400).json({ 
        message: 'Only AWS is supported. Please use provider "aws"' 
      });
    }

    if (!region) {
      return res.status(400).json({ message: 'AWS requires region parameter' });
    }

    // Validate region
    const supportedRegions = cloudManager.getSupportedRegions();
    if (!supportedRegions.includes(region)) {
      return res.status(400).json({ 
        message: `Unsupported region. Supported regions: ${supportedRegions.join(', ')}` 
      });
    }

    // Default instance type
    const finalInstanceType = instanceType || 't2.micro';

    // Validate instance type
    const supportedTypes = cloudManager.getSupportedInstanceTypes();
    if (!supportedTypes.includes(finalInstanceType)) {
      return res.status(400).json({ 
        message: `Unsupported instance type. Supported types: ${supportedTypes.join(', ')}` 
      });
    }

    console.log('Launching instance with params:', {
      provider,
      region,
      instanceType: finalInstanceType,
      workloadType,
      duration: estimatedDurationHours
    });

    // Launch instance
    const instanceData = await cloudManager.launchAWSInstance(
      region, 
      finalInstanceType,
      { workloadType, userId: req.user.id }
    );

    console.log('Instance launched:', instanceData);

    // Calculate emissions
    const emissions = await cloudManager.calculateCloudEmissions(
      provider, 
      region, 
      finalInstanceType, 
      estimatedDurationHours
    );

    console.log('Emissions calculated:', emissions);

    // Estimate cost
    const estimatedCost = cloudManager.estimateCost(
      provider,
      finalInstanceType,
      estimatedDurationHours
    );

    // Assume local emissions are higher (average grid mix)
    const localCarbonIntensity = 500; // gCO2/kWh (typical mixed grid)
    const localEmissions = emissions.energyKWh * localCarbonIntensity;

    // Create workload record
    const workload = await CloudWorkload.create({
      user: req.user.id,
      workloadType,
      sourceRegion: 'local',
      targetCloudRegion: region,
      cloudProvider: provider,
      instanceId: instanceData.instanceId,
      instanceType: finalInstanceType,
      estimatedLocalEmissions: localEmissions,
      estimatedCloudEmissions: emissions.emissionsGCO2,
      savingsGCO2: localEmissions - emissions.emissionsGCO2,
      estimatedCost: estimatedCost,
      status: 'running',
      metadata: {
        energyKWh: emissions.energyKWh,
        estimatedDurationHours,
        power: emissions.power,
        carbonIntensity: emissions.carbonIntensity,
        renewablePercentage: emissions.renewablePercentage,
        launchTime: instanceData.launchTime || new Date()
      }
    });

    console.log('Workload created:', workload._id);

    res.status(201).json({
      message: 'Instance launched successfully',
      instance: instanceData,
      workload: {
        id: workload._id,
        status: workload.status,
        savingsGCO2: workload.savingsGCO2,
        estimatedCost: workload.estimatedCost
      },
      emissions
    });
  } catch (error) {
    console.error('Error launching instance:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Failed to launch instance',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Terminate cloud instance
router.post('/terminate-instance', auth, async (req, res) => {
  try {
    const { provider, region, instanceId, workloadId } = req.body;

    if (!provider || !instanceId) {
      return res.status(400).json({ 
        message: 'Missing required fields: provider, instanceId' 
      });
    }

    if (provider !== 'aws') {
      return res.status(400).json({ 
        message: 'Only AWS is supported' 
      });
    }

    const result = await cloudManager.terminateAWSInstance(instanceId, region);

    // Update workload status
    if (workloadId) {
      const workload = await CloudWorkload.findById(workloadId);
      
      if (workload) {
        const duration = Math.floor((Date.now() - workload.startTime) / 1000);
        
        await CloudWorkload.findByIdAndUpdate(workloadId, {
          status: 'completed',
          endTime: new Date(),
          duration: duration
        });
      }
    }

    res.json({
      message: 'Instance terminated successfully',
      result
    });
  } catch (error) {
    console.error('Error terminating instance:', error);
    res.status(500).json({ 
      message: 'Failed to terminate instance',
      error: error.message 
    });
  }
});

// Get instance status
router.get('/instance-status/:provider/:instanceId', auth, async (req, res) => {
  try {
    const { provider, instanceId } = req.params;
    const { region } = req.query;

    if (provider !== 'aws') {
      return res.status(400).json({ 
        message: 'Only AWS is supported' 
      });
    }

    const status = await cloudManager.getAWSInstanceStatus(instanceId, region);
    res.json(status);
  } catch (error) {
    console.error('Error getting instance status:', error);
    res.status(500).json({ 
      message: 'Failed to get instance status',
      error: error.message 
    });
  }
});

// List instances
router.get('/instances/:provider', auth, async (req, res) => {
  try {
    const { provider } = req.params;
    const { region } = req.query;

    if (provider !== 'aws') {
      return res.status(400).json({ 
        message: 'Only AWS is supported' 
      });
    }

    const instances = await cloudManager.listAWSInstances(region);
    res.json(instances);
  } catch (error) {
    console.error('Error listing instances:', error);
    res.status(500).json({ 
      message: 'Failed to list instances',
      error: error.message 
    });
  }
});

// Get available cloud regions
router.get('/regions', auth, async (req, res) => {
  try {
    const { provider } = req.query;
    
    const query = { available: true };
    if (provider) {
      query.provider = provider.toLowerCase();
    }
    
    const regions = await CloudRegion.find(query)
      .sort({ carbonIntensity: 1 })
      .lean();
    
    res.json({
      regions,
      recommendation: regions[0],
      count: regions.length
    });
  } catch (error) {
    console.error('Error fetching regions:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Calculate potential savings
router.post('/calculate-savings', auth, async (req, res) => {
  try {
    const { 
      workloadType, 
      estimatedDurationHours,
      estimatedPowerWatts,
      targetRegion 
    } = req.body;
    
    // Default local carbon intensity (average for mixed grid)
    const localCarbonIntensity = 500; // gCO2/kWh
    
    const region = await CloudRegion.findById(targetRegion);
    if (!region) {
      return res.status(404).json({ message: 'Region not found' });
    }
    
    const energyKWh = (estimatedPowerWatts * estimatedDurationHours) / 1000;
    const localEmissions = energyKWh * localCarbonIntensity;
    const cloudEmissions = energyKWh * region.carbonIntensity;
    const savings = localEmissions - cloudEmissions;
    
    res.json({
      localEmissions: localEmissions.toFixed(2),
      cloudEmissions: cloudEmissions.toFixed(2),
      savingsGCO2: savings.toFixed(2),
      savingsPercentage: ((savings / localEmissions) * 100).toFixed(1),
      energyKWh: energyKWh.toFixed(6),
      region: {
        id: region._id,
        name: region.regionName,
        provider: region.provider,
        renewablePercentage: region.renewablePercentage,
        carbonIntensity: region.carbonIntensity
      }
    });
  } catch (error) {
    console.error('Error calculating savings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Submit cloud workload (manual/simulated)
router.post('/workloads', auth, async (req, res) => {
  try {
    const {
      workloadType,
      targetCloudRegion,
      cloudProvider,
      estimatedLocalEmissions,
      estimatedCloudEmissions,
      metadata
    } = req.body;
    
    // Validate required fields
    if (!workloadType || !targetCloudRegion || !cloudProvider || 
        estimatedLocalEmissions === undefined || estimatedCloudEmissions === undefined) {
      return res.status(400).json({ 
        message: 'Missing required fields' 
      });
    }
    
    const workload = await CloudWorkload.create({
      user: req.user.id,
      workloadType,
      targetCloudRegion,
      cloudProvider,
      estimatedLocalEmissions,
      estimatedCloudEmissions,
      savingsGCO2: estimatedLocalEmissions - estimatedCloudEmissions,
      status: 'pending',
      metadata: metadata || {}
    });
    
    res.status(201).json({
      message: 'Workload submitted successfully',
      workload: {
        id: workload._id,
        workloadType: workload.workloadType,
        savingsGCO2: workload.savingsGCO2,
        status: workload.status
      }
    });
  } catch (error) {
    console.error('Error submitting workload:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's cloud workloads
router.get('/workloads', auth, async (req, res) => {
  try {
    const { status, provider, limit = 50 } = req.query;
    
    const query = { user: req.user.id };
    if (status) query.status = status;
    if (provider) query.cloudProvider = provider;
    
    const workloads = await CloudWorkload.find(query)
      .sort({ startTime: -1 })
      .limit(parseInt(limit))
      .lean();
    
    const stats = {
      totalWorkloads: workloads.length,
      totalSavings: workloads.reduce((sum, w) => sum + (w.savingsGCO2 || 0), 0),
      totalCost: workloads.reduce((sum, w) => sum + (w.estimatedCost || 0), 0),
      byStatus: {
        pending: workloads.filter(w => w.status === 'pending').length,
        running: workloads.filter(w => w.status === 'running').length,
        completed: workloads.filter(w => w.status === 'completed').length,
        failed: workloads.filter(w => w.status === 'failed').length
      },
      byProvider: {
        aws: workloads.filter(w => w.cloudProvider === 'aws').length,
        gcp: 0,
        azure: 0
      }
    };
    
    res.json({
      workloads,
      stats: {
        ...stats,
        totalSavings: stats.totalSavings.toFixed(2),
        totalCost: stats.totalCost.toFixed(4)
      }
    });
  } catch (error) {
    console.error('Error fetching workloads:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get workload details
router.get('/workloads/:id', auth, async (req, res) => {
  try {
    const workload = await CloudWorkload.findOne({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!workload) {
      return res.status(404).json({ message: 'Workload not found' });
    }
    
    res.json(workload);
  } catch (error) {
    console.error('Error fetching workload:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Seed cloud regions data (AWS only)
router.post('/regions/seed', async (req, res) => {
  try {
    const regions = [
      // AWS Regions - All Available for Launch
      { 
        provider: 'aws', 
        region: 'eu-north-1', 
        regionName: 'Stockholm', 
        country: 'Sweden', 
        carbonIntensity: 8, 
        renewablePercentage: 98,
        instanceTypes: ['t2.micro', 't2.small', 't3.micro', 't3.small'],
        zones: ['eu-north-1a', 'eu-north-1b', 'eu-north-1c'],
        available: true
      },
      { 
        provider: 'aws', 
        region: 'ca-central-1', 
        regionName: 'Montreal', 
        country: 'Canada', 
        carbonIntensity: 25, 
        renewablePercentage: 95,
        instanceTypes: ['t2.micro', 't2.small', 't3.micro', 't3.small'],
        zones: ['ca-central-1a', 'ca-central-1b'],
        available: true
      },
      { 
        provider: 'aws', 
        region: 'us-west-2', 
        regionName: 'Oregon', 
        country: 'USA', 
        carbonIntensity: 50, 
        renewablePercentage: 90,
        instanceTypes: ['t2.micro', 't2.small', 't3.micro', 't3.small', 't3.medium'],
        zones: ['us-west-2a', 'us-west-2b', 'us-west-2c'],
        available: true
      },
      { 
        provider: 'aws', 
        region: 'us-west-1', 
        regionName: 'N. California', 
        country: 'USA', 
        carbonIntensity: 220, 
        renewablePercentage: 60,
        instanceTypes: ['t2.micro', 't2.small', 't3.micro', 't3.small'],
        zones: ['us-west-1a', 'us-west-1b'],
        available: true
      },
      { 
        provider: 'aws', 
        region: 'eu-west-1', 
        regionName: 'Ireland', 
        country: 'Ireland', 
        carbonIntensity: 280, 
        renewablePercentage: 55,
        instanceTypes: ['t2.micro', 't2.small', 't3.micro'],
        zones: ['eu-west-1a', 'eu-west-1b', 'eu-west-1c'],
        available: true
      },
      { 
        provider: 'aws', 
        region: 'eu-central-1', 
        regionName: 'Frankfurt', 
        country: 'Germany', 
        carbonIntensity: 310, 
        renewablePercentage: 50,
        instanceTypes: ['t2.micro', 't2.small', 't3.micro'],
        zones: ['eu-central-1a', 'eu-central-1b', 'eu-central-1c'],
        available: true
      },
      { 
        provider: 'aws', 
        region: 'us-east-1', 
        regionName: 'N. Virginia', 
        country: 'USA', 
        carbonIntensity: 380, 
        renewablePercentage: 45,
        instanceTypes: ['t2.micro', 't2.small', 't2.medium', 't3.micro', 't3.small'],
        zones: ['us-east-1a', 'us-east-1b', 'us-east-1c'],
        available: true
      },
      { 
        provider: 'aws', 
        region: 'ap-southeast-1', 
        regionName: 'Singapore', 
        country: 'Singapore', 
        carbonIntensity: 400, 
        renewablePercentage: 40,
        instanceTypes: ['t2.micro', 't2.small', 't3.micro'],
        zones: ['ap-southeast-1a', 'ap-southeast-1b', 'ap-southeast-1c'],
        available: true
      },
      { 
        provider: 'aws', 
        region: 'us-east-2', 
        regionName: 'Ohio', 
        country: 'USA', 
        carbonIntensity: 420, 
        renewablePercentage: 35,
        instanceTypes: ['t2.micro', 't2.small', 't3.micro'],
        zones: ['us-east-2a', 'us-east-2b', 'us-east-2c'],
        available: true
      },
      { 
        provider: 'aws', 
        region: 'ap-south-1', 
        regionName: 'Mumbai', 
        country: 'India', 
        carbonIntensity: 630, 
        renewablePercentage: 25,
        instanceTypes: ['t2.micro', 't2.small', 't3.micro'],
        zones: ['ap-south-1a', 'ap-south-1b', 'ap-south-1c'],
        available: true
      },
      
      // Reference regions (not available without those cloud providers)
      { 
        provider: 'gcp', 
        region: 'europe-north1', 
        regionName: 'Finland', 
        country: 'Finland', 
        carbonIntensity: 75, 
        renewablePercentage: 85,
        instanceTypes: [],
        zones: [],
        available: false
      },
      { 
        provider: 'azure', 
        region: 'norwayeast', 
        regionName: 'Norway East', 
        country: 'Norway', 
        carbonIntensity: 12, 
        renewablePercentage: 97,
        instanceTypes: [],
        zones: [],
        available: false
      }
    ];
    
    // Clear existing and insert new
    await CloudRegion.deleteMany({});
    const inserted = await CloudRegion.insertMany(regions);
    
    const awsRegions = inserted.filter(r => r.provider === 'aws' && r.available);
    const referenceRegions = inserted.filter(r => !r.available);
    
    res.json({ 
      message: 'Regions seeded successfully', 
      count: inserted.length,
      awsRegions: awsRegions.length,
      referenceRegions: referenceRegions.length,
      greenestRegion: awsRegions[0]
    });
  } catch (error) {
    console.error('Error seeding regions:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message 
    });
  }
});

module.exports = router;