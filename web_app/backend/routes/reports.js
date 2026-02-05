// web_app/backend/routes/reports.js

const express = require('express');
const Emission = require('../models/Emission');
const CloudWorkload = require('../models/CloudWorkload');
const auth = require('../middleware/auth');

const router = express.Router();

// Get summary report
router.get('/summary', auth, async (req, res) => {
  try {
    const { period = 'week' } = req.query;
    
    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    
    switch(period) {
      case 'day':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }
    
    // Get local emissions stats
    const localStats = await Emission.aggregate([
      {
        $match: {
          user: req.user.id,
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalEmissions: { $sum: '$emissionsGCO2' },
          totalEnergy: { $sum: '$energyKWh' },
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get cloud workload stats
    const cloudStats = await CloudWorkload.aggregate([
      {
        $match: {
          user: req.user.id,
          startTime: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalSavings: { $sum: '$savingsGCO2' },
          totalCost: { $sum: '$estimatedCost' },
          count: { $sum: 1 }
        }
      }
    ]);
    
    const local = localStats[0] || { totalEmissions: 0, totalEnergy: 0, count: 0 };
    const cloud = cloudStats[0] || { totalSavings: 0, totalCost: 0, count: 0 };
    
    res.json({
      period,
      local: {
        totalEmissions: parseFloat(local.totalEmissions.toFixed(2)),
        totalEnergy: parseFloat(local.totalEnergy.toFixed(6)),
        sessionCount: local.count
      },
      cloud: {
        totalSavings: parseFloat(cloud.totalSavings.toFixed(2)),
        totalCost: parseFloat(cloud.totalCost.toFixed(4)),
        workloadCount: cloud.count
      },
      netEmissions: parseFloat((local.totalEmissions - cloud.totalSavings).toFixed(2))
    });
  } catch (error) {
    console.error('Error generating summary:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get insights
router.get('/insights', auth, async (req, res) => {
  try {
    // Get data from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const emissions = await Emission.find({
      user: req.user.id,
      timestamp: { $gte: thirtyDaysAgo }
    }).sort({ timestamp: -1 });
    
    const workloads = await CloudWorkload.find({
      user: req.user.id,
      startTime: { $gte: thirtyDaysAgo }
    }).sort({ startTime: -1 });
    
    const insights = [];
    
    // Total emissions insight
    const totalEmissions = emissions.reduce((sum, e) => sum + e.emissionsGCO2, 0);
    insights.push({
      type: 'total',
      title: 'Total Carbon Footprint',
      value: `${totalEmissions.toFixed(2)} gCO₂`,
      description: `Your total emissions in the last 30 days`,
      trend: totalEmissions > 1000 ? 'high' : 'moderate'
    });
    
    // Cloud savings insight
    const totalSavings = workloads.reduce((sum, w) => sum + w.savingsGCO2, 0);
    if (totalSavings > 0) {
      insights.push({
        type: 'savings',
        title: 'Cloud Carbon Savings',
        value: `${totalSavings.toFixed(2)} gCO₂`,
        description: `Saved by using low-carbon cloud regions`,
        trend: 'positive'
      });
    }
    
    // Average daily emissions
    const avgDaily = totalEmissions / 30;
    insights.push({
      type: 'average',
      title: 'Daily Average',
      value: `${avgDaily.toFixed(2)} gCO₂`,
      description: 'Average emissions per day',
      trend: avgDaily > 50 ? 'high' : 'moderate'
    });
    
    // Most used cloud provider
    if (workloads.length > 0) {
      const providerCounts = workloads.reduce((acc, w) => {
        acc[w.cloudProvider] = (acc[w.cloudProvider] || 0) + 1;
        return acc;
      }, {});
      
      const mostUsed = Object.entries(providerCounts).sort((a, b) => b[1] - a[1])[0];
      
      insights.push({
        type: 'cloud',
        title: 'Most Used Provider',
        value: mostUsed[0].toUpperCase(),
        description: `${mostUsed[1]} workloads executed`,
        trend: 'neutral'
      });
    }
    
    res.json({ insights });
  } catch (error) {
    console.error('Error generating insights:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get progress tracking
router.get('/progress', auth, async (req, res) => {
  try {
    // Get last 30 days of data, grouped by day
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const dailyEmissions = await Emission.aggregate([
      {
        $match: {
          user: req.user.id,
          timestamp: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
          },
          totalEmissions: { $sum: '$emissionsGCO2' },
          totalEnergy: { $sum: '$energyKWh' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    const dailySavings = await CloudWorkload.aggregate([
      {
        $match: {
          user: req.user.id,
          startTime: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$startTime' }
          },
          totalSavings: { $sum: '$savingsGCO2' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    // Combine data
    const savingsMap = dailySavings.reduce((acc, item) => {
      acc[item._id] = item.totalSavings;
      return acc;
    }, {});
    
    const progress = dailyEmissions.map(item => ({
      date: item._id,
      emissions: parseFloat(item.totalEmissions.toFixed(2)),
      savings: parseFloat((savingsMap[item._id] || 0).toFixed(2)),
      net: parseFloat((item.totalEmissions - (savingsMap[item._id] || 0)).toFixed(2)),
      sessions: item.count
    }));
    
    res.json({ progress });
  } catch (error) {
    console.error('Error generating progress:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;